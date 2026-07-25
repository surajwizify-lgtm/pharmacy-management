import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma, SupplierStatus } from "@prisma/client";
import DeleteManufacturerButton from "@/components/DeleteManufacturerButton";
import PageHeader from "@/components/common/Header";
import HeaderButton from "@/components/common/HeaderButton";
import Container from "@/components/common/Container";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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

    const manufacturers = await prisma.manufacturer.findMany({
        where,
        orderBy: { name: "asc" },
    });

    return (
        <div className="">
            <PageHeader
                header={`Manufacturers`}
                subheader="Manage All Manufatures Here"
            >
                <HeaderButton text="New Manufacturer" href='/purchase-orders/manufacturers/new' />
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

                <div className="overflow-x-auto border rounded-md">
                    <Table className="table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact Person</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {manufacturers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        No manufacturers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                manufacturers.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell>
                                            {m.name}
                                        </TableCell>

                                        <TableCell>
                                            {m.contactPerson || "-"}
                                        </TableCell>

                                        <TableCell>
                                            {m.phone || "-"}
                                        </TableCell>

                                        <TableCell>
                                            {m.email || "-"}
                                        </TableCell>

                                        <TableCell>
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs ${m.status === "ACTIVE"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {m.status}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="link" >
                                                    <Link href={`/purchase-orders/manufacturers/${m.id}`}>
                                                        Edit
                                                    </Link>
                                                </Button>

                                                <DeleteManufacturerButton
                                                    id={m.id}
                                                    name={m.name}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Container >
        </div >
    );
}
