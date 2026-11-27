// app/purchase-orders/manufacturers/page.tsx
import { prisma } from "@/lib/prisma";
import { Prisma, SupplierStatus } from "@prisma/client";
import PageHeader from "@/components/common/Header";
import HeaderButton from "@/components/common/HeaderButton";
import Container from "@/components/common/Container";
import ManufacturersTable from "./ManufacturersTable";
import type { Manufacturer } from "./ManufacturersTable";

export const dynamic = "force-dynamic";

export default async function ManufacturerListPage({
    searchParams,
}: {
    searchParams: { search?: string; status?: string };
}) {
    const search = searchParams.search?.trim() || "";
    const status = searchParams.status as SupplierStatus | undefined;

    const where: Prisma.ManufacturerWhereInput = {
        ...(status === "ACTIVE" || status === "INACTIVE" ? { status } : {}),
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                    { contactPerson: { contains: search } },
                    { phone: { contains: search } },
                    { email: { contains: search } },
                ],
            }
            : {}),
    };

    const rows = await prisma.manufacturer.findMany({
        where,
        orderBy: { name: "asc" },
    });

    const manufacturers: Manufacturer[] = rows.map((m) => ({
        id: m.id,
        name: m.name,
        contactPerson: m.contactPerson,
        phone: m.phone,
        email: m.email,
        status: m.status,
    }));

    return (
        <div className="">
            <PageHeader header="Manufacturers" subheader="Manage All Manufatures Here">
                <HeaderButton text="New Manufacturer" href="/purchase-orders/manufacturers/new" />
            </PageHeader>

            <Container>
                <form className="flex gap-3 mb-4" method="get">
                    <input
                        type="text"
                        name="search"
                        defaultValue={search}
                        placeholder="Search name, contact, phone, email..."
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <select
                        name="status"
                        defaultValue={status || ""}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                    <button
                        type="submit"
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                        Filter
                    </button>
                </form>

                <ManufacturersTable data={manufacturers} />
            </Container>
        </div>
    );
}