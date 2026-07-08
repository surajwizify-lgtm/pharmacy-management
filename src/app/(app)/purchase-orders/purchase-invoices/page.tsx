'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    DUE: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    PAID: 'bg-brand-100 text-brand-700',
};

export default function PurchaseInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        apiFetch<any[]>('/api/purchase-invoices').then(setInvoices);
    }, []);

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <h1 className="text-2xl font-semibold text-slate-900">Purchase Invoices (GRNs)</h1>

            <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                        <th className="py-2">GRN #</th>
                        <th className="py-2">Invoice #</th>
                        <th className="py-2">Supplier</th>
                        <th className="py-2">Total</th>
                        <th className="py-2">Payment Status</th>
                        <th className="py-2">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                        <tr key={inv.id}>
                            <td className="py-2">
                                <Link href={`/purchase-invoices/${inv.id}`} className="text-brand-600 hover:underline">
                                    {inv.grnNumber}
                                </Link>
                            </td>
                            <td className="py-2">{inv.invoiceNumber}</td>
                            <td className="py-2">{inv.supplier.name}</td>
                            <td className="py-2">₹{Number(inv.totalAmount).toFixed(2)}</td>
                            <td className="py-2">
                                <span className={`badge ${PAYMENT_STATUS_COLORS[inv.paymentStatus] || ''}`}>{inv.paymentStatus}</span>
                            </td>
                            <td className="py-2">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}