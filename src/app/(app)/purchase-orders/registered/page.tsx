// app/purchase-orders/page.tsx
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import PurchaseOrdersTable from './PurchaseOrdersTable';
import type { PurchaseOrder } from './PurchaseOrdersTable';

export default async function PurchaseOrdersPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.pharmacyId) {
        return <div>Unauthorized</div>;
    }

    const rows = await prisma.purchaseOrder.findMany({
        where: { pharmacyId: session.user.pharmacyId },
        include: {
            supplier: { select: { name: true } },
            items: { select: { id: true } },
        },
        orderBy: { orderDate: 'desc' },
    });

    const orders: PurchaseOrder[] = rows.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        status: po.status,
        orderDate: po.orderDate.toISOString(),
        supplier: { name: po.supplier?.name ?? '' },
        items: po.items.map((i) => ({ id: i.id })),
    }));

    return (
        <div className="">
            <PageHeader header="Procurement" subheader="Purchase Orders">
                <HeaderButton text="New Purchase Order" href="/purchase-orders/new" />
            </PageHeader>

            <Container>
                <PurchaseOrdersTable data={orders} />
            </Container>
        </div>
    );
}