// app/purchase-orders/return/page.tsx
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import SupplierReturnsTable from './SupplierReturnsTable';
import type { SupplierReturn } from './SupplierReturnsTable';

export default async function SupplierReturnsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.pharmacyId) {
        return <div>Unauthorized</div>;
    }

    const rows = await prisma.supplierReturn.findMany({
        where: {
            supplier: { pharmacyId: session.user.pharmacyId },
        },
        include: {
            supplier: { select: { id: true, name: true } },
            purchaseInvoice: { select: { id: true, invoiceNumber: true, grnNumber: true } },
            items: { select: { id: true, supplierReturnId: true, batchId: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const returns: SupplierReturn[] = rows.map((ret) => ({
        id: ret.id,
        returnNumber: ret.returnNumber,
        supplierId: ret.supplierId,
        supplier: { id: ret.supplier.id, name: ret.supplier.name },
        purchaseInvoiceId: ret.purchaseInvoiceId,
        purchaseInvoice: ret.purchaseInvoice
            ? {
                id: ret.purchaseInvoice.id,
                invoiceNumber: ret.purchaseInvoice.invoiceNumber ?? undefined,
                grnNumber: ret.purchaseInvoice.grnNumber ?? undefined,
            }
            : null,
        reason: ret.reason,
        refundType: ret.refundType,
        totalAmount: ret.totalAmount.toString(),
        totalGst: ret.totalGst.toString(),
        createdAt: ret.createdAt.toISOString(),
        items: ret.items,
    }));

    return (
        <div className="">
            <PageHeader header="Supplier Returns" subheader="Goods returned to suppliers and their refunds.">
                <HeaderButton text="New Return" href="/purchase-orders/return/new" />
            </PageHeader>

            <Container>
                <SupplierReturnsTable data={returns} />
            </Container>
        </div>
    );
}