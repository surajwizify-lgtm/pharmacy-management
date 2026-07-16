// src/components/dashboard/OverduePayablesList.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

type OverdueInvoice = {
    id: number;
    supplierName: string;
    grnNumber: string;
    remainingAmount: number;
    daysSince: number;
};

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

function formatOverdue(days: number) {
    if (days <= 0) return 'Due today';
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} since invoice`;
    if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} since invoice`;
    }
    const monthsAgo = Math.floor(days / 30);
    return `${monthsAgo} month${monthsAgo > 1 ? 's' : ''} since invoice`;
}

export default function OverduePayablesList() {
    const [invoices, setInvoices] = useState<OverdueInvoice[] | null>(null);

    useEffect(() => {
        apiFetch<OverdueInvoice[]>('/api/dashboard/overdue-payables').then(setInvoices);
    }, []);

    const visible = invoices?.slice(0, 5) ?? [];

    return (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
                <h2 className="font-medium text-neutral-800">
                    Outstanding supplier bills
                    {invoices && invoices.length > 0 && (
                        <span className="ml-1.5 text-neutral-400">
                            ({invoices.length}{invoices.length >= 5 ? '+' : ''})
                        </span>
                    )}
                </h2>
                <Link
                    href="/purchase-orders/purchase-invoices"
                    className="text-xs font-medium text-primary-600 hover:underline"
                >
                    View all
                </Link>
            </div>

            <div className="divide-y divide-neutral-100">
                {invoices === null ? (
                    <div className="px-5 py-6 text-sm text-neutral-400">Loading…</div>
                ) : visible.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-neutral-400">No outstanding supplier bills. Nice work.</div>
                ) : (
                    visible.map((inv) => (
                        <Link
                            key={inv.id}
                            href={`/purchase-orders/purchase-invoices/${inv.id}`}
                            className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-neutral-50"
                        >
                            <div>
                                <p className="font-medium text-neutral-800">{inv.supplierName}</p>
                                <p className="text-sm text-danger-600">{formatOverdue(inv.daysSince)}</p>
                            </div>
                            <span className="font-semibold text-neutral-900">{formatCurrency(inv.remainingAmount)}</span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}