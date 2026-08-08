// app/purchase-orders/manufacturers/ManufacturersTable.tsx
'use client';

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { SupplierStatus } from "@prisma/client";
import DeleteManufacturerButton from "@/components/DeleteManufacturerButton";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";

export interface Manufacturer {
    id: number;
    name: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    status: SupplierStatus;
}

const columns: ColumnDef<Manufacturer>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        id: 'contactPerson',
        header: 'Contact Person',
        accessorFn: (row) => row.contactPerson ?? '-',
    },
    {
        id: 'phone',
        header: 'Phone',
        accessorFn: (row) => row.phone ?? '-',
    },
    {
        id: 'email',
        header: 'Email',
        accessorFn: (row) => row.email ?? '-',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
            <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs ${row.original.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                    }`}
            >
                {row.original.status}
            </span>
        ),
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Button variant="link">
                    <Link href={`/purchase-orders/manufacturers/${row.original.id}`}>
                        Edit
                    </Link>
                </Button>

                <DeleteManufacturerButton id={row.original.id} name={row.original.name} />
            </div>
        ),
    },
];

export default function ManufacturersTable({ data }: { data: Manufacturer[] }) {
    return <DataTable columns={columns} data={data} />;
}