// app/purchase-orders/suppliers/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PageHeader from "@/components/common/Header";
import HeaderButton from "@/components/common/HeaderButton";
import Container from "@/components/common/Container";
import SuppliersTable from "./SuppliersTable";
import type { Supplier } from "./SuppliersTable";

export default async function SuppliersPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.pharmacyId) {
        return <div>Unauthorized</div>;
    }

    const rows = await prisma.supplier.findMany({
        where: { pharmacyId: session.user.pharmacyId },
        orderBy: { name: "asc" },
    });

    const suppliers: Supplier[] = rows.map((s) => ({
        id: s.id,
        name: s.name,
        contactPerson: s.contactPerson,
        email: s.email,
        phone: s.phone,
    }));

    return (
        <div className="">
            <PageHeader header="Suppliers" subheader="Manage All Supplier Here">
                <HeaderButton text="Add Supplier" href="/purchase-orders/suppliers/new" />
            </PageHeader>
            <Container>
                <SuppliersTable data={suppliers} />
            </Container>
        </div>
    );
}