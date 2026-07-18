
import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling } from '@/lib/api-utils';
import { createBillSchema } from '@/lib/schemas';
import { createBill } from '@/lib/billing';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession();
    const from = req.nextUrl.searchParams.get('from');
    const to = req.nextUrl.searchParams.get('to');
    const cashierId = req.nextUrl.searchParams.get('cashierId');
    // console.log(cashierId);
    const session = await requireSession();

    return prisma.bill.findMany({
      where: {
        billDate: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
        cashierId: Number(session.user.id),// cashierId ? Number(cashierId) : undefined,
      },
      include: {
        billItems: true,
        customer: true,
        cashier: true,
        doctor: true,
        hospital: true,
      },
      orderBy: { billDate: 'desc' },
    });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession([Role.ADMIN, Role.PHARMACIST, Role.CASHIER]);
    const dto = createBillSchema.parse(await req.json());
    return createBill(dto, Number(session.user.id));
  });
}