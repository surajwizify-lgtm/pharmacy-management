'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';

export default function PurchaseOrderDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [po, setPo] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        apiFetch(`/api/purchase-orders/${id}`)
            .then(setPo)
            .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Something went wrong'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading)
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <div className="flex items-center gap-3 text-neutral-500">
                    <svg className="h-5 w-5 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-sm font-medium">Loading purchase order...</span>
                </div>
            </div>
        );

    if (error)
        return (
            <div className="mx-auto max-w-3xl">
                <div className="rounded-lg border border-danger-200 bg-danger-50 px-6 py-4 text-sm font-medium text-danger-700">
                    {error}
                </div>
            </div>
        );

    if (!po)
        return (
            <div className="mx-auto max-w-3xl">
                <p className="text-sm text-neutral-500">No data found.</p>
            </div>
        );

    const estimatedTotal = po.items.reduce((sum: number, it: any) => sum + it.quantity * Number(it.expectedRate), 0);

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
            APPROVED: 'bg-sky-50 text-sky-700 border-sky-200',
            PARTIALLY_RECEIVED: 'bg-purple-50 text-purple-700 border-purple-200',
            RECEIVED: 'bg-secondary-50 text-secondary-700 border-secondary-200',
            CANCELLED: 'bg-danger-50 text-danger-700 border-danger-200',
            PAID: 'bg-secondary-50 text-secondary-700 border-secondary-200',
            PARTIAL: 'bg-sky-50 text-sky-700 border-sky-200',
            UNPAID: 'bg-amber-50 text-amber-700 border-amber-200',
        };
        return map[status] || 'bg-neutral-100 text-neutral-600 border-neutral-200';
    };

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
                {/* Header */}
                <div>
                    <Link href="/purchase-orders" className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline">
                        ← Back to purchase orders
                    </Link>
                    <div className="mt-2 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-neutral-900">PO #{po.poNumber}</h1>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge(po.status)}`}>
                            {po.status.replace('_', ' ')}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                        Supplier: <span className="font-medium text-neutral-700">{po.supplier.name}</span>
                    </p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Estimated Total</p>
                        <p className="text-xl font-bold text-neutral-900">₹{estimatedTotal.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Expected Date</p>
                        <p className="text-xl font-bold text-neutral-900">
                            {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}
                        </p>
                    </div>
                </div>

                {/* Requested Items */}
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <div className="border-b border-neutral-200 px-6 py-4">
                        <h2 className="text-base font-semibold text-neutral-900">Requested Items</h2>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                                <th className="p-3 font-medium">Product</th>
                                <th className="p-3 font-medium">Qty Requested</th>
                                <th className="p-3 font-medium">Expected Rate</th>
                                <th className="p-3 font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {po.items.map((item: any) => (
                                <tr key={item.id} className="border-t border-neutral-100 transition-colors hover:bg-neutral-50">
                                    <td className="p-3 text-neutral-900">{item.product.name}</td>
                                    <td className="p-3 text-neutral-700">{item.quantity}</td>
                                    <td className="p-3 text-neutral-700">₹{Number(item.expectedRate).toFixed(2)}</td>
                                    <td className="p-3 font-medium text-neutral-900">
                                        ₹{(item.quantity * Number(item.expectedRate)).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                        <div className="flex justify-end border-t border-neutral-200 bg-neutral-50 px-6 py-4">
                            <Link
                                href={`/purchase-orders/${id}/receive`}
                                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                            >
                                Receive this Purchase Order
                            </Link>
                        </div>
                    )}
                </div>

                {/* Linked Purchase Invoices */}
                {po.purchaseInvoices?.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="border-b border-neutral-200 px-6 py-4">
                            <h2 className="text-base font-semibold text-neutral-900">Linked Purchase Invoices (GRNs)</h2>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                                    <th className="p-3 font-medium">GRN #</th>
                                    <th className="p-3 font-medium">Invoice #</th>
                                    <th className="p-3 font-medium">Total</th>
                                    <th className="p-3 font-medium">Payment Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {po.purchaseInvoices.map((inv: any) => (
                                    <tr key={inv.id} className="border-t border-neutral-100 transition-colors hover:bg-neutral-50">
                                        <td className="p-3">
                                            <Link
                                                href={`/purchase-orders/purchase-invoices/${inv.id}`}
                                                className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                            >
                                                {inv.grnNumber}
                                            </Link>
                                        </td>
                                        <td className="p-3 text-neutral-700">{inv.invoiceNumber}</td>
                                        <td className="p-3 font-medium text-neutral-900">₹{Number(inv.totalAmount).toFixed(2)}</td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge(inv.paymentStatus)}`}>
                                                {inv.paymentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}