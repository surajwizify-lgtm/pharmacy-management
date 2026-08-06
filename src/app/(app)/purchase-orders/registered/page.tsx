'use client';

import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import PurchaseOrderPrintButton from '@/components/purchase-orders/PurchaseOrderPrintButton';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    SENT: 'bg-sky-50 text-sky-700 border-sky-200',
    PARTIALLY_RECEIVED: 'bg-amber-50 text-amber-700 border-amber-200',
    RECEIVED: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    CANCELLED: 'bg-danger-50 text-danger-700 border-danger-200',
};

interface PurchaseOrder {
    id: number;
    poNumber: string;
    status: string;
    orderDate: string;
    supplier: { name: string };
    items: { id: number }[];
}

const columns: ColumnDef<PurchaseOrder>[] = [
    {
        accessorKey: 'poNumber',
        header: 'PO Number',
        cell: ({ row }) => (
            <Link
                href={`/purchase-orders/${row.original.id}`}
                className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
                {row.original.poNumber}
            </Link>
        ),
    },
    {
        id: 'supplier',
        header: 'Supplier',
        accessorFn: (row) => row.supplier?.name ?? '',
        cell: ({ row }) => <span>{row.original.supplier?.name}</span>,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status;
            return (
                <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                >
                    {status.replace('_', ' ')}
                </span>
            );
        },
    },
    {
        id: 'items',
        header: 'Items',
        accessorFn: (row) => row.items?.length ?? 0,
        cell: ({ row }) => <span>{row.original.items?.length ?? 0}</span>,
    },
    {
        accessorKey: 'orderDate',
        header: 'Order Date',
        cell: ({ row }) => <span>{new Date(row.original.orderDate).toLocaleDateString()}</span>,
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const po = row.original;
            return (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" >
                        <Link href={`/purchase-orders/${po.id}/edit`}>Edit</Link>
                    </Button>

                    {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                        <Button variant="outline" >
                            <Link href={`/purchase-orders/${po.id}/receive`}>Receive</Link>
                        </Button>
                    )}

                    {po.status === 'RECEIVED' && (
                        <Button variant="destructive" >
                            <Link href={`/purchase-orders/return/new`}>Return</Link>
                        </Button>
                    )}

                    <PurchaseOrderPrintButton poId={po.id} />
                </div>
            );
        },
    },
];

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch<PurchaseOrder[]>('/api/purchase-orders')
            .then(setOrders)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="">
            <PageHeader header={`Procurement`} subheader="Purchase Orders">
                <HeaderButton text="New Purchase Order" href="/purchase-orders/new" />
            </PageHeader>

            <Container>
                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-12 text-neutral-500">
                        <svg className="h-5 w-5 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        <span className="text-sm font-medium">Loading purchase orders...</span>
                    </div>
                ) : (
                    <DataTable columns={columns} data={orders} />
                )}
            </Container>
        </div>
    );
}