import { createGstLedgerEntry } from '@/lib/gst-ledger';
import Decimal from 'decimal.js';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { badRequest, notFound } from './api-utils';
import type { z } from 'zod';
import type { createSalesReturnSchema } from './schemas';

type CreateSalesReturnDto = z.infer<typeof createSalesReturnSchema>;
type Tx = Prisma.TransactionClient;

async function generateReturnNumber(tx: Tx): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

    const countToday = await tx.return.count({ where: { createdAt: { gte: startOfDay } } });
    const sequence = String(countToday + 1).padStart(4, '0');
    return `SRET-${dateStr}-${sequence}`;
}

/**
 * Creates a sales return against an existing bill: for each returned
 * line, validates the quantity against what was actually billed on that
 * batch (minus anything already returned), adds stock back, reverses
 * the GST proportionally, and writes one OUTPUT ledger entry linked via
 * returnId (the summary report subtracts returnId-linked OUTPUT rows
 * from billId-linked OUTPUT rows - see /api/gst/summary).
 */
export async function createSalesReturn(dto: CreateSalesReturnDto) {
    return prisma.$transaction(async (tx) => {
        const bill = await tx.bill.findUnique({
            where: { id: dto.billId },
            include: { billItems: true, returns: { include: { returnItems: true } } },
        });
        if (!bill) throw notFound(`Bill ${dto.billId} not found`);
        if (bill.cancelled) throw badRequest(`Bill ${bill.billNumber} is cancelled - cannot return against it`);

        let totalRefund = new Decimal(0);
        let totalCgst = new Decimal(0);
        let totalSgst = new Decimal(0);
        let totalIgst = new Decimal(0);

        const returnItemsData: Prisma.ReturnItemCreateWithoutReturnInput[] = [];

        for (const item of dto.items) {
            const billItem = bill.billItems.find((bi) => bi.batchId === item.batchId);
            if (!billItem) {
                throw badRequest(`Batch ${item.batchId} was not sold on bill ${bill.billNumber}`);
            }

            // Sum whatever's already been returned against this same batch on
            // this bill, so a second partial return can't exceed what remains.
            const alreadyReturned = bill.returns
                .flatMap((r) => r.returnItems)
                .filter((ri) => ri.batchId === item.batchId)
                .reduce((sum, ri) => sum + ri.quantity, 0);

            const remainingQty = billItem.quantity - alreadyReturned;
            if (item.quantity > remainingQty) {
                throw badRequest(
                    `Cannot return ${item.quantity} units of batch ${item.batchId}: ` +
                    `only ${remainingQty} remain returnable (${billItem.quantity} sold, ${alreadyReturned} already returned)`,
                );
            }
            if (item.quantity <= 0) {
                throw badRequest(`Return quantity for batch ${item.batchId} must be greater than zero`);
            }

            // Scale the original line's price/GST by the fraction being returned.
            const fraction = new Decimal(item.quantity).div(billItem.quantity);
            const refundAmount = new Decimal(billItem.totalAmount.toString()).mul(fraction).toDecimalPlaces(2);
            const cgst = new Decimal(billItem.cgstAmount.toString()).mul(fraction).toDecimalPlaces(2);
            const sgst = new Decimal(billItem.sgstAmount.toString()).mul(fraction).toDecimalPlaces(2);
            const igst = new Decimal(billItem.igstAmount.toString()).mul(fraction).toDecimalPlaces(2);

            totalRefund = totalRefund.add(refundAmount);
            totalCgst = totalCgst.add(cgst);
            totalSgst = totalSgst.add(sgst);
            totalIgst = totalIgst.add(igst);

            returnItemsData.push({
                batch: { connect: { id: item.batchId } },
                quantity: item.quantity,
                refundAmount: refundAmount.toFixed(2),
            });

            // Add stock back to the same batch it came from.
            await tx.batch.update({
                where: { id: item.batchId },
                data: { quantityAvailable: { increment: item.quantity }, version: { increment: 1 } },
            });
        }

        const salesReturn = await tx.return.create({
            data: {
                bill: { connect: { id: bill.id } },
                reason: dto.reason,
                totalRefund: totalRefund.toFixed(2),
                returnItems: { create: returnItemsData },
            },
            include: {
                returnItems: { include: { batch: { include: { product: true } } } },
                bill: true,
            },
        });

        // Reverse the OUTPUT GST. Same type as the original bill's entry -
        // the summary query nets returnId-linked rows against billId-linked
        // rows for the same type, rather than storing a negative amount here.
        const taxableValue = totalRefund.sub(totalCgst).sub(totalSgst).sub(totalIgst);
        await createGstLedgerEntry(tx, {
            type: 'OUTPUT',
            taxableValue: Number(taxableValue.toFixed(2)),
            cgstAmount: Number(totalCgst.toFixed(2)),
            sgstAmount: Number(totalSgst.toFixed(2)),
            igstAmount: Number(totalIgst.toFixed(2)),
            totalGst: Number(totalCgst.add(totalSgst).add(totalIgst).toFixed(2)),
            returnId: salesReturn.id,
        });

        return salesReturn;
    });
}