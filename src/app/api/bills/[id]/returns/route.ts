import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createGstLedgerEntry } from '@/lib/gst-ledger';

function round2(n: number) {
    return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pharmacyId = session.user.pharmacyId;
    if (!pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy associated with this user' }, { status: 400 });
    }

    const billId = Number(params.id);

    const bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: { billItems: true },
    });
    if (!bill) {
        return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    if (bill.pharmacyId !== pharmacyId) {
        return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const priorReturnItems = await prisma.returnItem.findMany({
        where: { return: { billId } },
    });

    const returnedByBatch = new Map<number, number>();
    for (const ri of priorReturnItems) {
        returnedByBatch.set(ri.batchId, (returnedByBatch.get(ri.batchId) || 0) + ri.quantity);
    }

    const remainingByBillItemId: Record<number, number> = {};
    for (const item of bill.billItems) {
        const alreadyReturned = returnedByBatch.get(item.batchId) || 0;
        remainingByBillItemId[item.id] = Math.max(0, item.quantity - alreadyReturned);
    }

    const fullyReturned = bill.billItems.every((item) => remainingByBillItemId[item.id] === 0);

    return NextResponse.json({ remainingByBillItemId, fullyReturned });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pharmacyId = session.user.pharmacyId;
    if (!pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy associated with this user' }, { status: 400 });
    }

    const billId = Number(params.id);
    const body = await req.json();

    if (!body.items?.length) {
        return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const bill = await tx.bill.findUnique({
                where: { id: billId },
                include: { billItems: true },
            });
            if (!bill) throw new Error('Bill not found');
            if (bill.pharmacyId !== pharmacyId) throw new Error('Bill not found');

            const priorReturnItems = await tx.returnItem.findMany({
                where: { return: { billId } },
            });
            const returnedByBatch = new Map<number, number>();
            for (const ri of priorReturnItems) {
                returnedByBatch.set(ri.batchId, (returnedByBatch.get(ri.batchId) || 0) + ri.quantity);
            }

            const preparedItems = [];
            let totalRefund = 0;
            let totalTaxable = 0;
            let totalGst = 0;
            let totalCgst = 0;
            let totalSgst = 0;
            let totalIgst = 0;

            for (const reqItem of body.items) {
                const billItem = bill.billItems.find((bi) => bi.id === reqItem.billItemId);
                if (!billItem) throw new Error(`Bill item ${reqItem.billItemId} not found on this bill`);

                const alreadyReturned = returnedByBatch.get(billItem.batchId) || 0;
                const remaining = billItem.quantity - alreadyReturned;

                if (reqItem.quantity <= 0) continue;
                if (reqItem.quantity > remaining) {
                    throw new Error(
                        `Cannot return ${reqItem.quantity} of "${billItem.batchNumber}" — only ${remaining} unit(s) remain returnable (already returned: ${alreadyReturned})`
                    );
                }

                const fraction = reqItem.quantity / billItem.quantity;
                const taxableValue = Number(billItem.unitPrice) * reqItem.quantity;
                const gstAmount = Number(billItem.gstAmount) * fraction;
                const cgstAmount = Number(billItem.cgstAmount) * fraction;
                const sgstAmount = Number(billItem.sgstAmount) * fraction;
                const igstAmount = Number(billItem.igstAmount) * fraction;
                const refundAmount = Number(billItem.totalAmount) * fraction;

                preparedItems.push({
                    batchId: billItem.batchId,
                    quantity: reqItem.quantity,
                    refundAmount: round2(refundAmount),
                });

                totalRefund += refundAmount;
                totalTaxable += taxableValue;
                totalGst += gstAmount;
                totalCgst += cgstAmount;
                totalSgst += sgstAmount;
                totalIgst += igstAmount;
                returnedByBatch.set(billItem.batchId, alreadyReturned + reqItem.quantity);
            }

            if (preparedItems.length === 0) {
                throw new Error('No returnable quantity was entered for any item');
            }

            const saleReturn = await tx.return.create({
                data: {
                    billId,
                    reason: body.reason || null,
                    totalRefund: round2(totalRefund),
                    returnItems: { create: preparedItems },
                },
                include: { returnItems: true },
            });

            await createGstLedgerEntry(tx, {
                type: 'OUTPUT',
                taxableValue: round2(totalTaxable),
                cgstAmount: round2(totalCgst),
                sgstAmount: round2(totalSgst),
                igstAmount: round2(totalIgst),
                totalGst: round2(totalGst),
                returnId: saleReturn.id,
                pharmacyId,
            });

            for (const item of preparedItems) {
                await tx.batch.update({
                    where: { id: item.batchId },
                    data: { quantityAvailable: { increment: item.quantity } },
                });
            }

            return saleReturn;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to process return' }, { status: 400 });
    }
}