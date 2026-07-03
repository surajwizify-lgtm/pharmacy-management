import Decimal from 'decimal.js';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { badRequest, notFound } from './api-utils';
import type { z } from 'zod';
import type { createBillSchema } from './schemas';

type CreateBillDto = z.infer<typeof createBillSchema>;
type Tx = Prisma.TransactionClient;

/** Sequential, date-scoped bill numbers, e.g. BILL-20260703-0007 */
async function generateBillNumber(tx: Tx): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

  const countToday = await tx.bill.count({ where: { billDate: { gte: startOfDay } } });
  const sequence = String(countToday + 1).padStart(4, '0');
  return `BILL-${dateStr}-${sequence}`;
}

/**
 * Creates a bill: for each line item, resolves stock (FIFO by expiry
 * unless a batchId is pinned), computes GST split into CGST+SGST
 * (intra-state) or IGST (inter-state), deducts stock with optimistic
 * locking, and persists everything atomically in one transaction.
 *
 * Direct port of the NestJS BillingService.createBill() - same Decimal.js
 * math, same FIFO batch resolution, same optimistic-locking stock deduction.
 */
export async function createBill(dto: CreateBillDto, cashierId: number) {
  return prisma.$transaction(async (tx) => {
    let subtotal = new Decimal(0);
    let totalCgst = new Decimal(0);
    let totalSgst = new Decimal(0);
    let totalIgst = new Decimal(0);

    const isInterState = dto.isInterState ?? false;
    const billItemsData: Prisma.BillItemCreateWithoutBillInput[] = [];

    for (const item of dto.items) {
      const medicine = await tx.medicine.findUnique({ where: { id: item.medicineId } });
      if (!medicine) throw notFound(`Medicine ${item.medicineId} not found`);
      if (medicine.status !== 'ACTIVE') throw badRequest(`Medicine "${medicine.name}" is discontinued`);

      // Resolve batch: pinned batchId, or FIFO (soonest expiry with enough stock)
      const batch = item.batchId
        ? await tx.batch.findUnique({ where: { id: item.batchId } })
        : await tx.batch.findFirst({
            where: {
              medicineId: item.medicineId,
              quantityAvailable: { gte: item.quantity },
              expiryDate: { gte: new Date() },
            },
            orderBy: { expiryDate: 'asc' },
          });

      if (!batch) {
        throw badRequest(`No available (unexpired, sufficient-stock) batch for "${medicine.name}"`);
      }
      if (batch.quantityAvailable < item.quantity) {
        throw badRequest(
          `Insufficient stock for "${medicine.name}" batch ${batch.batchNumber}: ` +
            `requested ${item.quantity}, available ${batch.quantityAvailable}`,
        );
      }

      // ---- GST math (this is the part that matters most) ----
      const unitPrice = new Decimal(batch.sellingPrice.toString());
      const itemSubtotal = unitPrice.mul(item.quantity);
      const gstRate = new Decimal(medicine.gstPercentage.toString());
      const totalGstForItem = itemSubtotal.mul(gstRate).div(100).toDecimalPlaces(2);

      let cgst = new Decimal(0);
      let sgst = new Decimal(0);
      let igst = new Decimal(0);

      if (isInterState) {
        igst = totalGstForItem;
      } else {
        // split evenly - standard practice: CGST = SGST = half the total slab
        cgst = totalGstForItem.div(2).toDecimalPlaces(2);
        sgst = totalGstForItem.sub(cgst); // avoids rounding drift losing/gaining a paisa
      }

      const itemTotal = itemSubtotal.add(cgst).add(sgst).add(igst);

      subtotal = subtotal.add(itemSubtotal);
      totalCgst = totalCgst.add(cgst);
      totalSgst = totalSgst.add(sgst);
      totalIgst = totalIgst.add(igst);

      billItemsData.push({
        medicine: { connect: { id: medicine.id } },
        batch: { connect: { id: batch.id } },
        batchNumber: batch.batchNumber,
        quantity: item.quantity,
        unitPrice: unitPrice.toFixed(2),
        gstPercentage: gstRate.toFixed(2),
        cgstAmount: cgst.toFixed(2),
        sgstAmount: sgst.toFixed(2),
        igstAmount: igst.toFixed(2),
        gstAmount: cgst.add(sgst).add(igst).toFixed(2),
        totalAmount: itemTotal.toFixed(2),
      });

      // Deduct stock with optimistic locking - if another sale beat us to
      // this batch between our read and this write, this throws and the
      // whole transaction rolls back (no partial bill, no phantom deduction).
      const updateResult = await tx.batch.updateMany({
        where: { id: batch.id, version: batch.version },
        data: { quantityAvailable: { decrement: item.quantity }, version: { increment: 1 } },
      });
      if (updateResult.count === 0) {
        throw badRequest(`Stock for batch ${batch.batchNumber} changed concurrently - please retry this bill`);
      }
    }

    const totalGst = totalCgst.add(totalSgst).add(totalIgst);
    const totalAmount = subtotal.add(totalGst);
    const billNumber = await generateBillNumber(tx);

    return tx.bill.create({
      data: {
        billNumber,
        cashierId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerGstin: dto.customerGstin,
        isInterState,
        subtotal: subtotal.toFixed(2),
        totalCgst: totalCgst.toFixed(2),
        totalSgst: totalSgst.toFixed(2),
        totalIgst: totalIgst.toFixed(2),
        totalGst: totalGst.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        paymentStatus: 'PENDING',
        billItems: { create: billItemsData },
      },
      include: { billItems: { include: { medicine: true } }, cashier: true },
    });
  });
}
