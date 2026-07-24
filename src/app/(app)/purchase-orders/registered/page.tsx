'use client';

import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useEffect, useState } from "react";
import PurchaseOrderPrintButton from '@/components/purchase-orders/PurchaseOrderPrintButton';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    SENT: 'bg-sky-50 text-sky-700 border-sky-200',
    PARTIALLY_RECEIVED: 'bg-amber-50 text-amber-700 border-amber-200',
    RECEIVED: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    CANCELLED: 'bg-danger-50 text-danger-700 border-danger-200',
};

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch<any[]>('/api/purchase-orders')
            .then(setOrders)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="">
            <PageHeader
                header={`Procurement`}
                subheader="Purchase Orders"
            >
                <HeaderButton text="New Purchase Order" href='/purchase-orders/new' />
            </PageHeader>

            {/* Table */}
            <Container>
                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-12 text-neutral-500">
                        <svg className="h-5 w-5 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        <span className="text-sm font-medium">Loading purchase orders...</span>
                    </div>
                ) : orders.length === 0 ? (
                    <p className="px-6 py-12 text-center text-sm text-neutral-500">No purchase orders found.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Order Date</TableHead>
                                <TableHead className='text-center'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {orders.map((po) => (
                                <TableRow key={po.id}>
                                    <TableCell>
                                        <Link href={`/purchase-orders/${po.id}`}>
                                            {po.poNumber}
                                        </Link>
                                    </TableCell>

                                    <TableCell>
                                        {po.supplier.name}
                                    </TableCell>

                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[po.status] ??
                                                "bg-neutral-100 text-neutral-600 border-neutral-200"
                                                }`}
                                        >
                                            {po.status.replace("_", " ")}
                                        </span>
                                    </TableCell>

                                    <TableCell>
                                        {po.items.length}
                                    </TableCell>

                                    <TableCell>
                                        {new Date(po.orderDate).toLocaleDateString()}
                                    </TableCell>

                                    <TableCell className='text-center'>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="outline">
                                                <Link href={`/purchase-orders/${po.id}/edit`}>
                                                    Edit
                                                </Link>
                                            </Button>

                                            {po.status !== "RECEIVED" &&
                                                po.status !== "CANCELLED" && (
                                                    <Button variant="outline">
                                                        <Link href={`/purchase-orders/${po.id}/receive`}>
                                                            Receive
                                                        </Link>
                                                    </Button>
                                                )}

                                            {po.status === "RECEIVED" && (
                                                <Button variant="destructive">
                                                    <Link href={`/purchase-orders/return/new`}>
                                                        Return
                                                    </Link>
                                                </Button>
                                            )}

                                            <PurchaseOrderPrintButton poId={po.id} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Container>
        </div>
    );
}