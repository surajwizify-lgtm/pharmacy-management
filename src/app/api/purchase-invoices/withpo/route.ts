import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';

const itemSchema = z.object({
    productId: z.number().int().positive(),
    batchNumber: z.string().min(1),
    manufactureDate: z.string().optional(),
    expiryDate: z.string().min(1),
    quantity: z.number().int().positive(),
    freeQuantity: z.number().int().min(0).default(0),
    purchaseRate: z.number().min(0),
    mrp: z.number().min(0),
    sellingPrice: z.number().min(0),
    discountPercent: z.number().min(0).max(100).default(0),
    hsnCode: z.string().min(1),
    gstPercentage: z.number().min(0).max(28),
    location: z.string().optional(),
});

const bodySchema = z.object({
    supplierId: z.number().int().positive(),
    poNumber: z.string().min(1),
    orderDate: z.string().min(1),
    expectedDate: z.string().optional(),
    notes: z.string().optional(),

    invoiceNumber: z.string().min(1),
    grnNumber: z.string().min(1),
    invoiceDate: z.string().min(1),
    isInterState: z.boolean().default(false),

    items: z.array(itemSchema).min(1),
});

function calcLine(item: z.infer<typeof itemSchema>, isInterState: boolean) {
    const gross = item.quantity * item.purchaseRate;
    const discountAmt = gross * (item.discountPercent / 100);
    const taxableValue = gross - discountAmt;
    const gstAmount = taxableValue * (item.gstPercentage / 100);

    const cgstAmount = isInterState ? 0 : gstAmount / 2;
    const sgstAmount = isInterState ? 0 : gstAmount / 2;
    const igstAmount = isInterState ? gstAmount : 0;

    const totalAmount = taxableValue + gstAmount;

    return {
        taxableValue: round2(taxableValue),
        gstAmount: round2(gstAmount),
        cgstAmount: round2(cgstAmount),
        sgstAmount: round2(sgstAmount),
        igstAmount: round2(igstAmount),
        totalAmount: round2(totalAmount),
    };
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (role !== 'ADMIN' && role !== 'PHARMACIST') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const pharmacyId = session.user.pharmacyId;
    if (!pharmacyId) {
        return NextResponse.json({ message: 'No pharmacy associated with this user' }, { status: 400 });
    }

    const json = await req.json().catch(() => null);
    if (!json) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json(
            { message: 'Validation failed', errors: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const data = parsed.data;

    const lineCalcs = data.items.map((it) => calcLine(it, data.isInterState));

    const totals = lineCalcs.reduce(
        (acc, c) => ({
            subtotal: acc.subtotal + c.taxableValue,
            totalCgst: acc.totalCgst + c.cgstAmount,
            totalSgst: acc.totalSgst + c.sgstAmount,
            totalIgst: acc.totalIgst + c.igstAmount,
            totalGst: acc.totalGst + c.gstAmount,
            totalAmount: acc.totalAmount + c.totalAmount,
        }),
        { subtotal: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, totalGst: 0, totalAmount: 0 }
    );

    try {
        const result = await prisma.$transaction(async (tx) => {
            const productIds = [...new Set(data.items.map((i) => i.productId))];
            const products = await tx.product.findMany({
                where: { id: { in: productIds }, pharmacyId },
            });
            if (products.length !== productIds.length) {
                throw new Error('One or more products were not found');
            }

            const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId } });
            if (!supplier || supplier.pharmacyId !== pharmacyId) {
                throw new Error('Supplier not found');
            }

            const locationNames = [...new Set(
                data.items.map((i) => i.location).filter((v): v is string => !!v)
            )];
            const matchedLocations = locationNames.length
                ? await tx.location.findMany({
                    where: { name: { in: locationNames }, pharmacyId },
                    select: { id: true, name: true },
                })
                : [];
            const locationIdByName = new Map(matchedLocations.map((l) => [l.name, l.id]));

            const po = await tx.purchaseOrder.create({
                data: {
                    poNumber: data.poNumber,
                    supplierId: data.supplierId,
                    status: 'RECEIVED',
                    orderDate: new Date(data.orderDate),
                    expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
                    notes: data.notes,
                    pharmacyId,
                    items: {
                        create: data.items.map((i) => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            expectedRate: i.purchaseRate,
                        })),
                    },
                },
            });

            const invoice = await tx.purchaseInvoice.create({
                data: {
                    invoiceNumber: data.invoiceNumber,
                    grnNumber: data.grnNumber,
                    supplierId: data.supplierId,
                    purchaseOrderId: po.id,
                    invoiceDate: new Date(data.invoiceDate),
                    isInterState: data.isInterState,
                    subtotal: totals.subtotal,
                    totalDiscount: 0,
                    totalCgst: totals.totalCgst,
                    totalSgst: totals.totalSgst,
                    totalIgst: totals.totalIgst,
                    totalGst: totals.totalGst,
                    totalAmount: totals.totalAmount,
                    paymentStatus: 'DUE',
                    pharmacyId,
                },
            });

            for (let i = 0; i < data.items.length; i++) {
                const item = data.items[i];
                const calc = lineCalcs[i];

                const resolvedLocationId = item.location
                    ? locationIdByName.get(item.location) ?? null
                    : null;

                const batch = await tx.batch.create({
                    data: {
                        productId: item.productId,
                        batchNumber: item.batchNumber,
                        manufactureDate: item.manufactureDate ? new Date(item.manufactureDate) : undefined,
                        expiryDate: new Date(item.expiryDate),
                        purchasePrice: item.purchaseRate,
                        mrp: item.mrp,
                        sellingPrice: item.sellingPrice,
                        quantityAvailable: item.quantity,
                        locationId: resolvedLocationId,
                        pharmacyId,
                    },
                });

                await tx.purchaseInvoiceItem.create({
                    data: {
                        purchaseInvoiceId: invoice.id,
                        productId: item.productId,
                        batchNumber: item.batchNumber,
                        manufactureDate: item.manufactureDate ? new Date(item.manufactureDate) : undefined,
                        expiryDate: new Date(item.expiryDate),
                        quantity: item.quantity,
                        freeQuantity: item.freeQuantity,
                        purchaseRate: item.purchaseRate,
                        mrp: item.mrp,
                        sellingPrice: item.sellingPrice,
                        discountPercent: item.discountPercent,
                        hsnCode: item.hsnCode,
                        gstPercentage: item.gstPercentage,
                        cgstAmount: calc.cgstAmount,
                        sgstAmount: calc.sgstAmount,
                        igstAmount: calc.igstAmount,
                        taxableValue: calc.taxableValue,
                        totalAmount: calc.totalAmount,
                        location: item.location,
                        batchId: batch.id,
                    },
                });
            }

            await tx.gstLedgerEntry.create({
                data: {
                    type: 'INPUT',
                    purchaseInvoiceId: invoice.id,
                    taxableValue: totals.subtotal,
                    cgstAmount: totals.totalCgst,
                    sgstAmount: totals.totalSgst,
                    igstAmount: totals.totalIgst,
                    totalGst: totals.totalGst,
                    entryDate: new Date(data.invoiceDate),
                    pharmacyId,
                },
            });

            return { po, invoice };
        });

        return NextResponse.json(
            { poId: result.po.id, invoiceId: result.invoice.id },
            { status: 201 }
        );
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
            return NextResponse.json(
                { message: `Duplicate value for ${target} — check PO number, invoice number, and GRN number are unique` },
                { status: 409 }
            );
        }
        const message = err instanceof Error ? err.message : 'Failed to create purchase';
        return NextResponse.json({ message }, { status: 400 });
    }
}