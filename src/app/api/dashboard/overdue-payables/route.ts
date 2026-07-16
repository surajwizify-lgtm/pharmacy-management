// src/app/api/dashboard/overdue-payables/route.ts
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling } from '@/lib/api-utils';

export async function GET() {
    return withErrorHandling(async () => {
        await requireSession();

        const invoices = await prisma.purchaseInvoice.findMany({
            where: { paymentStatus: { in: ['DUE', 'PARTIAL'] } },
            include: { supplier: true, payments: true, supplierReturns: true },
            orderBy: { invoiceDate: 'asc' },
        });

        const overdue = invoices
            .map((inv) => {
                const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                const returned = inv.supplierReturns.reduce((sum, r) => sum + Number(r.totalAmount), 0);
                const remainingAmount = Number(inv.totalAmount) - paid - returned;
                const daysSince = Math.floor(
                    (Date.now() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
                );
                return {
                    id: inv.id,
                    supplierName: inv.supplier.name,
                    grnNumber: inv.grnNumber,
                    remainingAmount,
                    daysSince,
                };
            })
            .filter((inv) => inv.remainingAmount > 0.01)
            .sort((a, b) => b.remainingAmount - a.remainingAmount);

        return overdue;
    });
}