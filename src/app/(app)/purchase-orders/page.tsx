// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { apiFetch } from '@/lib/api-client';

// export default function PurchaseOrdersPage() {
//     const [orders, setOrders] = useState<any[]>([]);

//     useEffect(() => {
//         apiFetch<any[]>('/api/purchase-orders').then(setOrders);
//     }, []);

//     return (
//         <div className="mx-auto max-w-4xl space-y-6">
//             <div className="flex items-center justify-between">
//                 <h1 className="text-2xl font-semibold text-slate-900">Purchase Orders</h1>
//                 <Link href="/purchase-orders/new" className="btn-primary">+ New Purchase Order</Link>
//             </div>

//             <table className="w-full text-left text-sm">
//                 <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
//                     <tr>
//                         <th className="py-2">PO Number</th>
//                         <th className="py-2">Supplier</th>
//                         <th className="py-2">Status</th>
//                         <th className="py-2">Total</th>
//                         <th className="py-2">Order Date</th>
//                         <th className="py-2">Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                     {orders.map((po) => (
//                         <tr key={po.id}>
//                             <td className="py-2">
//                                 <Link href={`/purchase-orders/${po.id}`} className="text-brand-600 hover:underline">
//                                     {po.poNumber}
//                                 </Link>
//                             </td>
//                             <td className="py-2">{po.supplier.name}</td>
//                             <td className="py-2">{po.status}</td>
//                             <td className="py-2">₹{Number(po.totalAmount).toFixed(2)}</td>
//                             <td className="py-2">{new Date(po.orderDate).toLocaleDateString()}</td>
//                             <td className="py-2">
//                                 <Link href={`/purchase-orders/${po.id}/edit`} className="text-xs pr-5 text-brand-600 hover:underline">
//                                     Edit
//                                 </Link>
//                                 <Link href={`/purchase-orders/${po.id}`} className="text-xs text-brand-600 hover:underline">
//                                     view
//                                 </Link>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// }
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import {
    ClipboardList,
    Search,
    Plus,
    Building2,
    Package,
    Calendar,
    Pencil,
    PackageCheck,
    Undo2,
} from 'lucide-react';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] as const;

function statusBadgeClass(status: string) {
    switch (status) {
        case 'RECEIVED':
            return 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200';
        case 'PARTIALLY_RECEIVED':
            return 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200';
        case 'SENT':
            return 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200';
        case 'CANCELLED':
            return 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200';
        default:
            return 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200';
    }
}

function statusDotClass(status: string) {
    switch (status) {
        case 'RECEIVED':
            return 'bg-emerald-500';
        case 'PARTIALLY_RECEIVED':
            return 'bg-amber-500';
        case 'SENT':
            return 'bg-blue-500';
        case 'CANCELLED':
            return 'bg-red-500';
        default:
            return 'bg-slate-400';
    }
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

const AVATAR_COLORS = [
    'bg-brand-100 text-brand-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
];

function avatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Design-only additions — filter the already-fetched list client-side.
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('ALL');

    useEffect(() => {
        setLoading(true);
        apiFetch<any[]>('/api/purchase-orders')
            .then(setOrders)
            .finally(() => setLoading(false));
    }, []);

    const filteredOrders = orders.filter((po) => {
        const q = search.toLowerCase();
        const matchesSearch =
            !q || po.poNumber.toLowerCase().includes(q) || po.supplier?.name?.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const receivedCount = orders.filter((po) => po.status === 'RECEIVED').length;
    const pendingCount = orders.filter((po) => po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED').length;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                        <ClipboardList className="h-6 w-6 text-brand-600" />
                        Purchase Orders
                    </h1>
                    <p className="text-sm text-slate-500">Requests sent to suppliers, tracked through to receipt.</p>
                </div>
                <Link
                    href="/purchase-orders/new"
                    className="btn-primary inline-flex items-center gap-2 shadow-sm shadow-brand-600/20"
                >
                    <Plus className="h-4 w-4" />
                    New Purchase Order
                </Link>
            </div>

            {/* Stat chips */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                        <ClipboardList className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Total orders</p>
                        <p className="text-lg font-semibold text-slate-900">{orders.length}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <Package className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Pending / partial</p>
                        <p className="text-lg font-semibold text-slate-900">{pendingCount}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <PackageCheck className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Received</p>
                        <p className="text-lg font-semibold text-slate-900">{receivedCount}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar + table */}
            <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
                    <h2 className="flex items-center gap-2 font-medium text-slate-800">
                        <ClipboardList className="h-4 w-4 text-brand-600" />
                        All Purchase Orders
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {filteredOrders.length}
                        </span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                className="input w-56 pl-8 text-sm"
                                placeholder="Search PO number or supplier…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="input w-auto text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s === 'ALL' ? 'All statuses' : s.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="p-3 text-left">PO number</th>
                                <th className="p-3 text-left">Supplier</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Items</th>
                                <th className="p-3 text-left">Order date</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-3" colSpan={6}>
                                            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-10">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <ClipboardList className="mb-2 h-8 w-8" />
                                            <p className="text-sm">No purchase orders found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((po) => {
                                    const supplierName = po.supplier?.name ?? 'Unknown supplier';
                                    return (
                                        <tr key={po.id} className="group transition-colors hover:bg-slate-50/70">
                                            <td className="p-3">
                                                <Link href={`/purchase-orders/${po.id}`} className="font-medium text-brand-600 hover:underline">
                                                    {po.poNumber}
                                                </Link>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span
                                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarColor(supplierName)}`}
                                                    >
                                                        {initials(supplierName)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-slate-600">
                                                        <Building2 className="h-3 w-3 text-slate-400" />
                                                        {supplierName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(po.status)}`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(po.status)}`} />
                                                    {po.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-600">{po.items.length}</td>
                                            <td className="p-3 text-slate-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {new Date(po.orderDate).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                                                    <Link
                                                        href={`/purchase-orders/${po.id}/edit`}
                                                        title="Edit"
                                                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                    {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                                                        <Link
                                                            href={`/purchase-orders/${po.id}/receive`}
                                                            title="Receive"
                                                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                                        >
                                                            <PackageCheck className="h-4 w-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}