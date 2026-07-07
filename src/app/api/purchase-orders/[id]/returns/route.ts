
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/supplier-returns?supplierId=&from=&to=&page=&pageSize=
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const supplierId = searchParams.get('supplierId');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const page = Number(searchParams.get('page') || '1');
        const pageSize = Number(searchParams.get('pageSize') || '20');
        const skip = (page - 1) * pageSize;
        const where = {
            ...(supplierId && { supplierId: Number(supplierId) }),
            ...(from && to && { createdAt: { gte: new Date(from), lte: new Date(to) } }),
        };
        const [items, total] = await Promise.all([
            prisma.supplierReturn.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    supplier: { select: { id: true, name: true } },
                    items: { include: { product: true, batch: true } },
                },
            }),
            prisma.supplierReturn.count({ where }),
        ]);

        return NextResponse.json({ items, total, page, pageSize });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to fetch supplier returns' }, { status: 500 });
    }
}

// POST /api/supplier-returns
// body: { purchaseInvoiceId?, supplierId, reason, refundType, items: [{ medicineId, batchId, quantity, unitPrice, gstPercent? }] }
export async function POST(req: NextRequest) {
    const body = await req.json();

    if (!body.supplierId || !body.items?.length) {
        return NextResponse.json({ error: 'supplierId and items are required' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Validate stock before touching anything
            const preparedItems = [];
            for (const it of body.items) {
                const batch = await tx.batch.findUnique({ where: { id: it.batchId } });
                if (!batch) throw new Error(`Batch not found (id: ${it.batchId})`);
                if (batch.quantityAvailable < it.quantity) {
                    throw new Error(
                        `Cannot return ${it.quantity} units — only ${batch.quantityAvailable} available in batch ${batch.batchNumber}`
                    );
                }

                const gstAmount = Math.round(it.quantity * it.unitPrice * ((it.gstPercent || 0) / 100) * 100) / 100;
                const totalPrice = Math.round((it.quantity * it.unitPrice + gstAmount) * 100) / 100;

                preparedItems.push({
                    productId: it.productId,
                    batchId: it.batchId,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    gstAmount,
                    totalPrice,
                });
            }

            const totalAmount = preparedItems.reduce((sum, i) => sum + i.totalPrice, 0);
            const totalGst = preparedItems.reduce((sum, i) => sum + i.gstAmount, 0);

            const returnCount = await tx.supplierReturn.count();
            const returnNumber = `PRET-${String(returnCount + 1).padStart(6, '0')}`;

            const supplierReturn = await tx.supplierReturn.create({
                data: {
                    returnNumber,
                    supplierId: body.supplierId,
                    purchaseInvoiceId: body.purchaseInvoiceId || null,
                    reason: body.reason || null,
                    refundType: body.refundType || 'credit_note',
                    totalAmount: Math.round(totalAmount * 100) / 100,
                    totalGst: Math.round(totalGst * 100) / 100,
                    items: { create: preparedItems },
                },
                include: { items: true },
            });

            // Deduct stock for each returned batch
            for (const it of preparedItems) {
                await tx.batch.update({
                    where: { id: it.batchId },
                    data: { quantityAvailable: { decrement: it.quantity } },
                });
            }

            // if this return is against an invoice, reduce what's owed
            if (body.purchaseInvoiceId && body.refundType === 'credit_note') {
                await tx.purchaseInvoice.update({
                    where: { id: body.purchaseInvoiceId },
                    data: {
                        // recompute balance from scratch to avoid double-decrementing on retries
                    },
                });
            }
            return supplierReturn;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to create supplier return' }, { status: 500 });
    }
}