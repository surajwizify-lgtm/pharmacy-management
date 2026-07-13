
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

    if (loading) return <p className="text-slate-400">Loading…</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!po) return <p className="text-slate-400">No data found.</p>;

    const estimatedTotal = po.items.reduce((sum: number, it: any) => sum + it.quantity * Number(it.expectedRate), 0);

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link href="/purchase-orders" className="text-xs font-medium text-brand-600 hover:underline">
                    ← Back to purchase orders
                </Link>
                <div className="mt-1 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">PO #{po.poNumber}</h1>
                    <span className="badge bg-brand-100 text-brand-700">{po.status.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-slate-500">Supplier: {po.supplier.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="card p-4">
                    <p className="label mb-1">Estimated Total</p>
                    <p className="text-xl font-semibold text-slate-900">₹{estimatedTotal.toFixed(2)}</p>
                </div>
                <div className="card p-4">
                    <p className="label mb-1">Expected Date</p>
                    <p className="text-xl font-semibold text-slate-900">
                        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}
                    </p>
                </div>
            </div>

            <div className="card p-5">
                <h2 className="mb-3 font-medium text-slate-800">Requested Items</h2>
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="py-2">product</th>
                            <th className="py-2">Qty Requested</th>
                            <th className="py-2">Expected Rate</th>
                            <th className="py-2">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {po.items.map((item: any) => (
                            <tr key={item.id}>
                                <td className="py-2">{item.product.name}</td>
                                <td className="py-2">{item.quantity}</td>
                                <td className="py-2">₹{Number(item.expectedRate).toFixed(2)}</td>
                                <td className="py-2">₹{(item.quantity * Number(item.expectedRate)).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                    <div className="mt-4 flex justify-end">
                        <Link href={`/purchase-orders/${id}/receive`} className="btn-primary">
                            Receive this Purchase Order
                        </Link>
                    </div>
                )}
            </div>

            {po.purchaseInvoices?.length > 0 && (
                <div className="card p-5">
                    <h2 className="mb-3 font-medium text-slate-800">Linked Purchase Invoices (GRNs)</h2>
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="py-2">GRN #</th>
                                <th className="py-2">Invoice #</th>
                                <th className="py-2">Total</th>
                                <th className="py-2">Payment Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {po.purchaseInvoices.map((inv: any) => (
                                <tr key={inv.id}>
                                    <td className="py-2">
                                        <Link href={`/purchase-orders/purchase-invoices/${inv.id}`} className="text-brand-600 hover:underline">
                                            {inv.grnNumber}
                                        </Link>
                                    </td>
                                    <td className="py-2">{inv.invoiceNumber}</td>
                                    <td className="py-2">₹{Number(inv.totalAmount).toFixed(2)}</td>
                                    <td className="py-2">{inv.paymentStatus}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}