import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound } from '@/lib/api-utils';
import { createBillSchema } from '@/lib/schemas';
import { createBill } from '@/lib/billing';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession();

    const from = req.nextUrl.searchParams.get('from');
    const to = req.nextUrl.searchParams.get('to');
    const cashierIdParam = req.nextUrl.searchParams.get('cashierId');

    // SUPER_ADMIN can inspect a specific pharmacy via ?pharmacyId=
    const pharmacyIdParam = req.nextUrl.searchParams.get('pharmacyId');
    const pharmacyId =
      session.user.role === Role.SUPER_ADMIN && pharmacyIdParam
        ? Number(pharmacyIdParam)
        : session.user.pharmacyId;

    if (!pharmacyId) {
      throw notFound('No pharmacy associated with this user');
    }

    // CASHIER only sees their own bills; ADMIN/PHARMACIST/SUPER_ADMIN can see
    // all bills for the pharmacy, optionally filtered by ?cashierId=
    const cashierId =
      session.user.role === Role.CASHIER
        ? Number(session.user.id)
        : cashierIdParam
          ? Number(cashierIdParam)
          : undefined;

    return prisma.bill.findMany({
      where: {
        pharmacyId,
        billDate: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
        cashierId,
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

    const pharmacyId = session.user.pharmacyId;
    if (!pharmacyId) {
      throw notFound('No pharmacy associated with this user');
    }

    return createBill(dto, Number(session.user.id), pharmacyId);
  });
}