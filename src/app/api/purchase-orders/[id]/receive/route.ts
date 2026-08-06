import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pharmacyId = session.user.pharmacyId;
    if (!pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy associated with this user' }, { status: 400 });
    }

    const poId = Number(params.id);
    const body = await req.json();

    if (!body.items?.length) {
        return NextResponse.json({ error: 'No items to receive' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.findUnique({ where: { id: poId }, include: { items: true } });
            if (!po) throw new Error('Purchase order not found');
            if (po.pharmacyId !== pharmacyId) throw new Error('Purchase order not found');
            if (po.status === 'RECEIVED') throw new Error('This purchase order is already fully received');
            if (po.status === 'CANCELLED') throw new Error('Cannot receive a cancelled purchase order');

            const locationNames: string[] = Array.from(
                new Set<string>(
                    body.items
                        .map((it: any) => it.location)
                        .filter((v: any): v is string => typeof v === 'string' && v.length > 0)
                )
            );
            const matchedLocations = locationNames.length
                ? await tx.location.findMany({
                    where: { name: { in: locationNames }, pharmacyId },
                    select: { id: true, name: true },
                })
                : [];
            const locationIdByName = new Map(matchedLocations.map((l) => [l.name, l.id]));

            let subtotal = 0;
            let totalDiscount = 0;
            let totalCgst = 0;
            let totalSgst = 0;
            let totalIgst = 0;

            const preparedItems = body.items.map((it: any) => {
                const gross = it.quantity * it.purchaseRate;
                const discountAmount = gross * (Number(it.discountPercent || 0) / 100);
                const taxableValue = gross - discountAmount;
                const gstAmount = taxableValue * (Number(it.gstPercentage) / 100);

                const cgst = body.isInterState ? 0 : gstAmount / 2;
                const sgst = body.isInterState ? 0 : gstAmount / 2;
                const igst = body.isInterState ? gstAmount : 0;

                subtotal += gross;
                totalDiscount += discountAmount;
                totalCgst += cgst;
                totalSgst += sgst;
                totalIgst += igst;

                return {
                    productId: it.productId,
                    batchNumber: it.batchNumber,
                    manufactureDate: it.manufactureDate ? new Date(it.manufactureDate) : null,
                    expiryDate: new Date(it.expiryDate),
                    quantity: it.quantity,
                    freeQuantity: it.freeQuantity || 0,
                    purchaseRate: it.purchaseRate,
                    mrp: it.mrp,
                    sellingPrice: it.sellingPrice,
                    discountPercent: it.discountPercent || 0,
                    hsnCode: it.hsnCode,
                    gstPercentage: it.gstPercentage,
                    cgstAmount: cgst,
                    sgstAmount: sgst,
                    igstAmount: igst,
                    taxableValue,
                    totalAmount: taxableValue + gstAmount,
                    location: it.location || null,
                };
            });

            const totalGst = totalCgst + totalSgst + totalIgst;
            const totalAmount = subtotal - totalDiscount + totalGst;

            // GRN sequence scoped per pharmacy
            const grnCount = await tx.purchaseInvoice.count({ where: { pharmacyId } });
            const grnNumber = `GRN-${String(grnCount + 1).padStart(6, '0')}`;

            const invoice = await tx.purchaseInvoice.create({
                data: {
                    invoiceNumber: body.invoiceNumber,
                    grnNumber,
                    supplierId: po.supplierId,
                    purchaseOrderId: po.id,
                    invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : new Date(),
                    isInterState: !!body.isInterState,
                    subtotal,
                    totalDiscount,
                    totalCgst,
                    totalSgst,
                    totalIgst,
                    totalGst,
                    totalAmount,
                    pharmacyId,
                },
            });

            for (const it of preparedItems) {
                const batch = await tx.batch.create({
                    data: {
                        productId: it.productId,
                        batchNumber: it.batchNumber,
                        manufactureDate: it.manufactureDate,
                        expiryDate: it.expiryDate,
                        purchasePrice: it.purchaseRate,
                        mrp: it.mrp,
                        sellingPrice: it.sellingPrice,
                        quantityAvailable: it.quantity + it.freeQuantity,
                        locationId: it.location ? locationIdByName.get(it.location) ?? null : null,
                        pharmacyId,
                    },
                });

                await tx.purchaseInvoiceItem.create({
                    data: {
                        purchaseInvoiceId: invoice.id,
                        productId: it.productId,
                        batchNumber: it.batchNumber,
                        manufactureDate: it.manufactureDate,
                        expiryDate: it.expiryDate,
                        quantity: it.quantity,
                        freeQuantity: it.freeQuantity,
                        purchaseRate: it.purchaseRate,
                        mrp: it.mrp,
                        sellingPrice: it.sellingPrice,
                        discountPercent: it.discountPercent,
                        hsnCode: it.hsnCode,
                        gstPercentage: it.gstPercentage,
                        cgstAmount: it.cgstAmount,
                        sgstAmount: it.sgstAmount,
                        igstAmount: it.igstAmount,
                        taxableValue: it.taxableValue,
                        totalAmount: it.totalAmount,
                        location: it.location,
                        batchId: batch.id,
                    },
                });
            }

            await tx.purchaseOrder.update({
                where: { id: po.id },
                data: { status: 'RECEIVED' },
            });

            await tx.gstLedgerEntry.create({
                data: {
                    type: 'INPUT',
                    purchaseInvoiceId: invoice.id,
                    taxableValue: subtotal - totalDiscount,
                    cgstAmount: totalCgst,
                    sgstAmount: totalSgst,
                    igstAmount: totalIgst,
                    totalGst,
                    pharmacyId,
                },
            });

            return invoice;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to receive purchase order' }, { status: 500 });
    }
}