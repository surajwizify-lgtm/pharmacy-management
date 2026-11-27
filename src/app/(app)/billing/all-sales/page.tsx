// app/billing/page.tsx
import { prisma } from '@/lib/prisma';
import type { Bill } from '@/types';
import BillingClient from './BillingClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  const bills = await prisma.bill.findMany({
    where: { pharmacyId: session?.user.pharmacyId || 0 },
    include: {
      customer: true,
      cashier: true,
      billItems: { include: { product: true } },
      payments: true,
    },
    orderBy: { billDate: 'desc' },
  });
  console.log(session?.user.pharmacyId, bills)

  return <BillingClient initialBills={bills as unknown as Bill[]} />;
}