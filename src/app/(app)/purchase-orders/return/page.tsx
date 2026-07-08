// Target path: src/app/(app)/purchase-orders/return/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Undo2,
    Building2,
    FileText,
    Package,
    Calendar,
    Wallet,
    ClipboardList,
} from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
}

interface PurchaseInvoice {
    id: number;
    invoiceNumber?: string;
    grnNumber?: string;
}

interface SupplierReturnItem {
    id: number;
    supplierReturnId: number;
    batchId: number;
}

interface SupplierReturn {
    id: number;
    returnNumber: string;
    supplierId: number;
    supplier: Supplier;
    purchaseInvoiceId: number | null;
    purchaseInvoice: PurchaseInvoice | null;
    reason: string | null;
    refundType: string;
    totalAmount: string;
    totalGst: string;
    createdAt: string;
    items: SupplierReturnItem[];
}

const AVATAR_COLORS = [
    'bg-brand-100 text-brand-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
];

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function avatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function refundTypeBadgeClass(type: string) {
    switch (type.toUpperCase()) {
        case 'CASH_REFUND':
        case 'CASH':
            return 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200';
        case 'CREDIT_NOTE':
            return 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200';
        case 'REPLACEMENT':
            return 'bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-200';
        default:
            return 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200';
    }
}

export default function SupplierReturnsPage() {
    const [returns, setReturns] = useState<SupplierReturn[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/supplier-returns')
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setReturns(data);
            })
            .finally(() => setLoading(false));
    }, []);

    // Client-side filter only — no change to how/what data is fetched.
    const filteredReturns = useMemo(() => {
        if (!search.trim()) return returns;
        const q = search.trim().toLowerCase();
        return returns.filter(
            (r) =>
                r.returnNumber.toLowerCase().includes(q) ||
                (r.supplier?.name ?? '').toLowerCase().includes(q)
        );
    }, [returns, search]);

    const totalReturns = returns.length;
    const totalAmount = returns.reduce((sum, r) => sum + Number(r.totalAmount), 0);
    const totalGst = returns.reduce((sum, r) => sum + Number(r.totalGst), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                        <Undo2 className="h-6 w-6 text-brand-600" />
                        Supplier Returns
                    </h1>
                    <p className="text-sm text-slate-500">Track goods returned to suppliers and their refunds.</p>
                </div>

                <Link
                    href="/purchase-orders/return/new"
                    className="btn-primary inline-flex items-center gap-2 shadow-sm shadow-brand-600/20"
                >
                    <Plus className="h-4 w-4" />
                    New Return
                </Link>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                        <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Returns</p>
                        <p className="text-lg font-semibold text-slate-800">{totalReturns}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Refund Amount</p>
                        <p className="text-lg font-semibold text-slate-800">₹{totalAmount.toFixed(2)}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total GST Reversed</p>
                        <p className="text-lg font-semibold text-slate-800">₹{totalGst.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Returns list */}
            <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
                    <h2 className="flex items-center gap-2 font-medium text-slate-800">
                        <ClipboardList className="h-4 w-4 text-brand-600" />
                        All Returns
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {filteredReturns.length}
                        </span>
                    </h2>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="w-64 rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Search return no. or supplier..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="p-3 text-left">Return No</th>
                                <th className="p-3 text-left">Supplier</th>
                                <th className="p-3 text-left">Invoice</th>
                                <th className="p-3 text-left">Reason</th>
                                <th className="p-3 text-left">Refund Type</th>
                                <th className="p-3 text-right">GST</th>
                                <th className="p-3 text-right">Amount</th>
                                <th className="p-3 text-center">Items</th>
                                <th className="p-3 text-left">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-3" colSpan={9}>
                                            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredReturns.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-10">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Undo2 className="mb-2 h-8 w-8" />
                                            <p className="text-sm">No supplier returns found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReturns.map((ret) => {
                                    const supplierName = ret.supplier?.name || 'Unknown';
                                    return (
                                        <tr key={ret.id} className="group transition-colors hover:bg-slate-50/70">
                                            <td className="p-3">
                                                <span className="font-medium text-slate-800">{ret.returnNumber}</span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span
                                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarColor(
                                                            supplierName
                                                        )}`}
                                                    >
                                                        {initials(supplierName)}
                                                    </span>
                                                    <span className="text-slate-600">{supplierName}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-500">
                                                {ret.purchaseInvoice?.invoiceNumber ?? ret.purchaseInvoice?.grnNumber ?? '—'}
                                            </td>
                                            <td className="p-3 text-slate-500">{ret.reason ?? '—'}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${refundTypeBadgeClass(
                                                        ret.refundType
                                                    )}`}
                                                >
                                                    {ret.refundType.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right text-slate-500">
                                                ₹{Number(ret.totalGst).toFixed(2)}
                                            </td>
                                            <td className="p-3 text-right font-medium text-slate-800">
                                                ₹{Number(ret.totalAmount).toFixed(2)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                    <Package className="h-3 w-3" />
                                                    {ret.items.length}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {new Date(ret.createdAt).toLocaleDateString()}
                                                </span>
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