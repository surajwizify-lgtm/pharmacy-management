import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGstLedgerEntry } from '@/lib/gst-ledger';

function round2(n: number) {
    return Math.round(n * 100) / 100;
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    // body: { supplierId, purchaseInvoiceId?, returnNumber, reason, refundType?, items: [{ batchId, productId, quantity, unitPrice }] }

    if (!body.items?.length) {
        return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const preparedItems = [];
            let totalTaxable = 0;
            let totalGst = 0;
            let totalCgst = 0;
            let totalSgst = 0;
            let totalIgst = 0;

            for (const it of body.items) {
                const batch = await tx.batch.findUnique({ where: { id: it.batchId } });
                if (!batch) throw new Error(`Batch ${it.batchId} not found`);
                if (batch.quantityAvailable < it.quantity) {
                    throw new Error(
                        `Cannot return ${it.quantity} units — only ${batch.quantityAvailable} available in batch ${batch.batchNumber}`
                    );
                }

                const invoiceItem = await tx.purchaseInvoiceItem.findFirst({
                    where: { batchId: it.batchId },
                    include: { purchaseInvoice: true },
                });
                if (!invoiceItem) {
                    throw new Error(`No purchase invoice found for batch ${batch.batchNumber}`);
                }

                const gstPercentage = Number(invoiceItem.gstPercentage);
                const isInterState = invoiceItem.purchaseInvoice.isInterState;

                const taxableValue = it.quantity * it.unitPrice;
                const gstAmount = taxableValue * (gstPercentage / 100);
                const cgstAmount = isInterState ? 0 : gstAmount / 2;
                const sgstAmount = isInterState ? 0 : gstAmount / 2;
                const igstAmount = isInterState ? gstAmount : 0;
                const totalPrice = taxableValue + gstAmount;

                preparedItems.push({
                    batchId: it.batchId,
                    productId: it.productId,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    gstAmount: round2(gstAmount),
                    totalPrice: round2(totalPrice),
                });

                totalTaxable += taxableValue;
                totalGst += gstAmount;
                totalCgst += cgstAmount;
                totalSgst += sgstAmount;
                totalIgst += igstAmount;
            }

            const totalAmount = preparedItems.reduce((sum, i) => sum + i.totalPrice, 0);

            const supplierReturn = await tx.supplierReturn.create({
                data: {
                    returnNumber: body.returnNumber,
                    supplierId: body.supplierId,
                    purchaseInvoiceId: body.purchaseInvoiceId || null,
                    reason: body.reason || null,
                    refundType: body.refundType || 'credit_note',
                    totalAmount: round2(totalAmount),
                    totalGst: round2(totalGst),
                    items: { create: preparedItems },
                },
                include: { items: true },
            });

            // Reverses ITC already claimed on the original purchase.
            // Stored as positive here — the summary route subtracts
            // supplierReturn-linked INPUT entries from purchase-linked
            // INPUT entries, so this must stay positive, not negative.
            await createGstLedgerEntry(tx, {
                type: 'INPUT',
                taxableValue: round2(totalTaxable),
                cgstAmount: round2(totalCgst),
                sgstAmount: round2(totalSgst),
                igstAmount: round2(totalIgst),
                totalGst: round2(totalGst),
                supplierReturnId: supplierReturn.id,
            });

            for (const it of preparedItems) {
                await tx.batch.update({
                    where: { id: it.batchId },
                    data: { quantityAvailable: { decrement: it.quantity } },
                });
            }

            return supplierReturn;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to create supplier return' }, { status: 500 });
    }
}

export async function GET() {
    const returns = await prisma.supplierReturn.findMany({
        include: {
            supplier: true,
            purchaseInvoice: {
                include: {
                    purchaseOrder: true,
                },
            },
            items: {
                include: {
                    product: true,
                    batch: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return NextResponse.json(returns);
}