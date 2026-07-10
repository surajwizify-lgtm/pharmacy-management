
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-slate-200 text-slate-600',
    SENT: 'bg-blue-100 text-blue-700',
    PARTIALLY_RECEIVED: 'bg-amber-100 text-amber-700',
    RECEIVED: 'bg-brand-100 text-brand-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        apiFetch<any[]>('/api/purchase-orders').then(setOrders);
    }, []);

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Purchase Orders</h1>
                <Link href="/purchase-orders/new" className="btn-primary">+ New Purchase Order</Link>
            </div>

            <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                        <th className="py-2">PO Number</th>
                        <th className="py-2">Supplier</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Items</th>
                        <th className="py-2">Order Date</th>
                        <th className="py-2">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {orders.map((po) => (
                        <tr key={po.id}>
                            <td className="py-2">
                                <Link href={`/purchase-orders/${po.id}`} className="text-brand-600 hover:underline">
                                    {po.poNumber}
                                </Link>
                            </td>
                            <td className="py-2">{po.supplier.name}</td>
                            <td className="py-2">
                                <span className={`badge ${STATUS_COLORS[po.status] || ''}`}>{po.status.replace('_', ' ')}</span>
                            </td>
                            <td className="py-2">{po.items.length}</td>
                            <td className="py-2">{new Date(po.orderDate).toLocaleDateString()}</td>
                            <td className="py-2 flex gap-2">
                                <Link href={`/purchase-orders/${po.id}/edit`} className="text-xs text-brand-600 hover:underline">Edit</Link>
                                {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                                    <Link href={`/purchase-orders/${po.id}/receive`} className="text-xs text-green-700 hover:underline">
                                        Receive
                                    </Link>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}