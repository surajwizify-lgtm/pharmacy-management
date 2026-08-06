import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import PurchaseInvoicesTable from '@/components/purchase-orders/purchase-invoices/PurchaseInvoiceTable';

export default async function PurchaseInvoicesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }

    const pharmacyId = session.user.pharmacyId;
    if (!pharmacyId) {
        return (
            <div>
                <PageHeader header="Purchase Invoices" subheader="View All Purchase Invoices">
                    <HeaderButton text="Create Invoice" href="/purchase-orders/purchase-invoices/new" />
                </PageHeader>
                <p className="p-6 text-sm text-muted-foreground">
                    No pharmacy associated with this account.
                </p>
            </div>
        );
    }

    const [rawInvoices, suppliers] = await Promise.all([
        prisma.purchaseInvoice.findMany({
            where: { pharmacyId },
            include: { supplier: true, payments: true, supplierReturns: true },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.supplier.findMany({
            where: { pharmacyId },
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    // compute remainingAmount = total - paid - returned, same logic as the overdue-payments route
    const invoices = rawInvoices.map((inv) => {
        const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const returned = inv.supplierReturns.reduce((sum, r) => sum + Number(r.totalAmount), 0);
        const remainingAmount = Number(inv.totalAmount) - paid - returned;

        return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            grnNumber: inv.grnNumber,
            invoiceDate: inv.invoiceDate.toISOString(),
            totalAmount: Number(inv.totalAmount),
            remainingAmount,
            paymentStatus: inv.paymentStatus,
            supplierId: inv.supplierId,
            supplier: { name: inv.supplier.name },
        };
    });

    return (
        <div className="">
            <PageHeader
                header={`Purchase Invoices`}
                subheader="View All Purchase Invoices"
            >
                <HeaderButton text="Create Invoice" href="/purchase-orders/purchase-invoices/new" />
            </PageHeader>
            <PurchaseInvoicesTable suppliers={suppliers} invoices={invoices} />
        </div>
    );
}