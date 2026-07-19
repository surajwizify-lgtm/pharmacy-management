import { NextRequest } from 'next/server';
import Decimal from 'decimal.js';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound, badRequest } from '@/lib/api-utils';
import { recordPaymentSchema } from '@/lib/schemas';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST, Role.CASHIER]);
    const billId = Number(params.id);
    if (Number.isNaN(billId)) throw badRequest('Invalid bill id');
    const dto = recordPaymentSchema.parse(await req.json());

    const bill = await prisma.bill.findUnique({ where: { id: billId } });
    if (!bill) throw notFound(`Bill ${billId} not found`);

    return prisma.$transaction(async (tx) => {
      await tx.payment.create({ data: { billId, amount: dto.amount, method: dto.method } });

      const payments = await tx.payment.findMany({ where: { billId } });
      const totalPaid = payments.reduce((sum, p) => sum.add(p.amount.toString()), new Decimal(0));
      const totalAmount = new Decimal(bill.totalAmount.toString());

      const paymentStatus = totalPaid.gte(totalAmount)
        ? 'PAID'
        : totalPaid.gt(0)
          ? 'PARTIALLY_PAID'
          : 'PENDING';

      return tx.bill.update({ where: { id: billId }, data: { paymentStatus } });
    });
  });
}
