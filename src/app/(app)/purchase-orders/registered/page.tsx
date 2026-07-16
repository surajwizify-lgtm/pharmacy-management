'use client';

import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useEffect, useState } from "react";
import PurchaseOrderPrintButton from '@/components/purchase-orders/PurchaseOrderPrintButton';

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
        <div className="min-h-screen bg-neutral-50">
            <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-600">Procurement</p>
                        <h1 className="text-2xl font-bold text-neutral-900">Purchase Orders</h1>
                    </div>
                    <Link
                        href="/purchase-orders/new"
                        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        + New Purchase Order
                    </Link>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
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
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                                    <th className="p-3 font-medium">PO Number</th>
                                    <th className="p-3 font-medium">Supplier</th>
                                    <th className="p-3 font-medium">Status</th>
                                    <th className="p-3 font-medium">Items</th>
                                    <th className="p-3 font-medium">Order Date</th>
                                    <th className="p-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((po) => (
                                    <tr key={po.id} className="border-t border-neutral-100 transition-colors hover:bg-neutral-50">
                                        <td className="p-3">
                                            <Link
                                                href={`/purchase-orders/${po.id}`}
                                                className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                            >
                                                {po.poNumber}
                                            </Link>
                                        </td>
                                        <td className="p-3 text-neutral-700">{po.supplier.name}</td>
                                        <td className="p-3">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[po.status] || 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                                    }`}
                                            >
                                                {po.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-neutral-700">{po.items.length}</td>
                                        <td className="p-3 text-neutral-700">{new Date(po.orderDate).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <div className="flex gap-3">
                                                <Link
                                                    href={`/purchase-orders/${po.id}/edit`}
                                                    className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                                >
                                                    Edit
                                                </Link>
                                                {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                                                    <Link
                                                        href={`/purchase-orders/${po.id}/receive`}
                                                        className="text-xs font-medium text-secondary-600 hover:text-secondary-700 hover:underline"
                                                    >
                                                        Receive
                                                    </Link>
                                                )}
                                                {po.status === 'RECEIVED' && (
                                                    <Link
                                                        href={`/purchase-orders/return/new`}
                                                        className="text-xs font-medium text-danger-600 hover:text-danger-700 hover:underline"
                                                    >
                                                        Return
                                                    </Link>
                                                )}
                                                <PurchaseOrderPrintButton poId={po.id} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
}