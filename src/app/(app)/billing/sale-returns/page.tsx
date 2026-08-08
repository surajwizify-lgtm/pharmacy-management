// app/billing/returns/page.tsx
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/common/Header';
import Container from '@/components/common/Container';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SalesReturnsTable, { ReturnRow } from './SalesReturnsTable';

export default async function SalesReturnsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.pharmacyId) {
        return <div>Unauthorized</div>;
    }
    const rows = await prisma.return.findMany({
        where: {
            bill: {
                pharmacyId: session.user.pharmacyId,
            },
        },
        include: {
            bill: {
                select: {
                    id: true,
                    billNumber: true,
                    billDate: true,
                    customer: true,   // full Customer object (or null) — not just { name: true }
                },
            },
            returnItems: {
                include: {
                    batch: {
                        select: {
                            batchNumber: true,
                            product: { select: { name: true } },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const returns: ReturnRow[] = rows.map((r) => ({
        id: r.id,
        billId: r.billId,
        reason: r.reason,
        totalRefund: r.totalRefund.toString(),
        createdAt: r.createdAt.toISOString(),
        bill: {
            id: r.bill.id,
            billNumber: r.bill.billNumber,
            customer: r.bill.customer,          // ✅ pass whole object through — no more customerName
            billDate: r.bill.billDate.toISOString(),
        },
        returnItems: r.returnItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            refundAmount: item.refundAmount.toString(),
            batch: {
                batchNumber: item.batch.batchNumber,
                product: item.batch.product ? { name: item.batch.product.name } : null,
            },
        })),
    }));

    return (
        <div className="">
            <PageHeader header="Sales Returns" subheader="All returns processed against sales bills." />
            <Container className="overflow-hidden">
                <SalesReturnsTable data={returns} />
            </Container>
        </div>
    );
}