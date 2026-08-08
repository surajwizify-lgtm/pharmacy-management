// app/purchase-orders/suppliers/SuppliersTable.tsx
'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import CreatePurchaseOrderModal from "@/components/CreatePurchaseOrderModal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";

export interface Supplier {
    id: number;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
}

export default function SuppliersTable({ data }: { data: Supplier[] }) {
    const router = useRouter();

    const [showCreatePO, setShowCreatePO] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    function openCreatePurchaseOrder(supplier: Supplier) {
        setSelectedSupplier(supplier);
        setShowCreatePO(true);
    }

    const columns: ColumnDef<Supplier>[] = useMemo(
        () => [
            {
                id: 'name',
                header: 'Name',
                accessorKey: 'name',
                cell: ({ row }) => (
                    <div>
                        <div>{row.original.name}</div>
                        <div className="text-xs text-neutral-500">{row.original.contactPerson || "-"}</div>
                    </div>
                ),
            },
            {
                id: 'email',
                header: 'Email',
                accessorFn: (row) => row.email ?? '-',
            },
            {
                id: 'phone',
                header: 'Phone',
                accessorFn: (row) => row.phone ?? '-',
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Button onClick={() => openCreatePurchaseOrder(row.original)}>
                            Create Purchase Order
                        </Button>

                        <Button variant="outline">
                            <Link href={`/purchase-orders/suppliers/${row.original.id}`}>
                                View
                            </Link>
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <>
            <DataTable columns={columns} data={data} />

            <CreatePurchaseOrderModal
                open={showCreatePO}
                supplier={selectedSupplier}
                onClose={() => {
                    setShowCreatePO(false);
                    setSelectedSupplier(null);
                }}
                onSuccess={() => {
                    setShowCreatePO(false);
                    setSelectedSupplier(null);
                    router.refresh();
                }}
            />
        </>
    );
}