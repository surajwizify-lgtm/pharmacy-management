// app/billing/customers/page.tsx
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PageHeader from '@/components/common/Header';
import Container from '@/components/common/Container';
import CustomersTable from './CustomersTable';
import type { Customer } from './CustomersTable';

export default async function CustomersPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.pharmacyId) {
        return <div>Unauthorized</div>;
    }

    const rows = await prisma.customer.findMany({
        where: { pharmacyId: session.user.pharmacyId },
        include: { _count: { select: { bills: true } } },
        orderBy: { name: 'asc' },
    });

    const customers: Customer[] = rows.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        gstin: c.gstin,
        active: c.active,
        _count: { bills: c._count.bills },
    }));

    return (
        <div className="">
            <PageHeader header="Customers" subheader="Manage customer records used across billing." />

            <Container>
                <CustomersTable data={customers} />
            </Container>
        </div>
    );
}