// src/app/api/dashboard/cashflow/route.ts
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling } from '@/lib/api-utils';

function monthKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(req: Request) {
    return withErrorHandling(async () => {
        await requireSession();

        const { searchParams } = new URL(req.url);
        const months = Math.min(Math.max(Number(searchParams.get('months') ?? 12), 1), 24);

        const start = new Date();
        start.setMonth(start.getMonth() - (months - 1));
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        const [inflowPayments, outflowPayments] = await Promise.all([
            prisma.payment.findMany({
                where: { paidAt: { gte: start } },
                select: { amount: true, paidAt: true },
            }),
            prisma.supplierPayment.findMany({
                where: { paidAt: { gte: start } },
                select: { amount: true, paidAt: true },
            }),
        ]);

        const buckets = new Map<string, { inflow: number; outflow: number }>();
        for (let i = 0; i < months; i++) {
            const d = new Date(start);
            d.setMonth(d.getMonth() + i);
            buckets.set(monthKey(d), { inflow: 0, outflow: 0 });
        }

        for (const p of inflowPayments) {
            buckets.get(monthKey(new Date(p.paidAt)))!.inflow += Number(p.amount);
        }
        for (const p of outflowPayments) {
            buckets.get(monthKey(new Date(p.paidAt)))!.outflow += Number(p.amount);
        }

        return Array.from(buckets.entries()).map(([key, v]) => {
            const [year, month] = key.split('-').map(Number);
            const label = new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
                month: 'short',
                year: '2-digit',
            });
            return { month: key, label, inflow: v.inflow, outflow: v.outflow, net: v.inflow - v.outflow };
        });
    });
}