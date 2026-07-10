// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// // POST /api/bills/:id/returns
// // body: { reason?: string, items: [{ billItemId: number, quantity: number }] }
// export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
//     const billId = Number(params.id);
//     if (!Number.isInteger(billId) || billId <= 0) {
//         return NextResponse.json({ error: "Invalid bill id" }, { status: 400 });
//     }

//     const body = await req.json();
//     const reason: string | null = body.reason || null;
//     const lines: { billItemId: number; quantity: number }[] = Array.isArray(body.items) ? body.items : [];

//     const toReturn = lines.filter((l) => Number(l.quantity) > 0);
//     if (toReturn.length === 0) {
//         return NextResponse.json({ error: "Select at least one item with a quantity > 0" }, { status: 400 });
//     }

//     try {
//         const bill = await prisma.bill.findUnique({
//             where: { id: billId },
//             include: { billItems: true },
//         });
//         if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

//         // Validate every requested line against the original bill item
//         for (const line of toReturn) {
//             const original = bill.billItems.find((bi) => bi.id === line.billItemId);
//             if (!original) {
//                 return NextResponse.json(
//                     { error: `Bill item ${line.billItemId} does not belong to this bill` },
//                     { status: 400 }
//                 );
//             }
//             if (line.quantity > original.quantity) {
//                 return NextResponse.json(
//                     { error: `Cannot return more than ${original.quantity} units of "${original.batchNumber}"` },
//                     { status: 400 }
//                 );
//             }
//         }

//         const result = await prisma.$transaction(async (tx) => {
//             let totalRefund = 0;
//             const returnItemsData: { batchId: number; quantity: number; refundAmount: number }[] = [];

//             for (const line of toReturn) {
//                 const original = bill.billItems.find((bi) => bi.id === line.billItemId)!;
//                 // Per-unit refund = original line's gst-inclusive unit price
//                 const perUnit = Number(original.totalAmount) / original.quantity;
//                 const refundAmount = Number((perUnit * line.quantity).toFixed(2));

//                 returnItemsData.push({
//                     batchId: original.batchId,
//                     quantity: line.quantity,
//                     refundAmount,
//                 });
//                 totalRefund += refundAmount;

//                 // Stock goes back to the batch
//                 await tx.batch.update({
//                     where: { id: original.batchId },
//                     data: { quantityAvailable: { increment: line.quantity } },
//                 });
//             }

//             const salesReturn = await tx.return.create({
//                 data: {
//                     billId,
//                     reason,
//                     totalRefund: Number(totalRefund.toFixed(2)),
//                     returnItems: { create: returnItemsData },
//                 },
//                 include: { returnItems: true },
//             });

//             return salesReturn;
//         });

//         return NextResponse.json({ data: result }, { status: 201 });
//     } catch (err) {
//         console.error(`POST /api/bills/${params.id}/returns failed`, err);
//         return NextResponse.json({ error: "Failed to process return" }, { status: 500 });
//     }
// }
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGstLedgerEntry } from '@/lib/gst-ledger';

function round2(n: number) {
    return Math.round(n * 100) / 100;
}

// GET — how much of each billItem is still returnable (sold - already returned)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const billId = Number(params.id);

    const bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: { billItems: true },
    });
    if (!bill) {
        return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Sum everything already returned against this bill, grouped by batch —
    // ReturnItem only stores batchId, not billItemId, so we match on that.
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

// POST — create the return, reverse the GST, restore stock
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const billId = Number(params.id);
    const body = await req.json();
    // body: { reason, items: [{ billItemId, quantity }] }

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

                // update running total so a second line against the same batch
                // in this same request also gets checked correctly
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

            // Reverses output tax already collected on the sale.
            // Positive magnitude — /api/gst/summary subtracts return-linked
            // OUTPUT entries from bill-linked OUTPUT entries, same convention
            // as the supplier-return side.
            await createGstLedgerEntry(tx, {
                type: 'OUTPUT',
                taxableValue: round2(totalTaxable),
                cgstAmount: round2(totalCgst),
                sgstAmount: round2(totalSgst),
                igstAmount: round2(totalIgst),
                totalGst: round2(totalGst),
                returnId: saleReturn.id,
            });

            // Stock comes back into the batch (opposite of a supplier return).
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