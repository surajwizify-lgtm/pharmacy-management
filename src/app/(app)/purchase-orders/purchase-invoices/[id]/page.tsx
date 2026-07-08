'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    DUE: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    PAID: 'bg-brand-100 text-brand-700',
};

export default function PurchaseInvoiceDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [invoice, setInvoice] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMode: 'cash', referenceNo: '', notes: '' });
    const [paySaving, setPaySaving] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);

    async function load() {
        const data = await apiFetch<any>(`/api/purchase-invoices/${id}`);
        setInvoice(data);
    }

    useEffect(() => {
        if (!id) return;
        load()
            .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Something went wrong'))
            .finally(() => setLoading(false));
    }, [id]);

    async function handleAddPayment(e: FormEvent) {
        e.preventDefault();
        setPayError(null);

        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
            setPayError('Enter a valid amount');
            return;
        }

        setPaySaving(true);
        try {
            await apiFetch(`/api/purchase-invoices/${id}/payments`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: Number(paymentForm.amount),
                    paymentMode: paymentForm.paymentMode,
                    referenceNo: paymentForm.referenceNo || undefined,
                    notes: paymentForm.notes || undefined,
                }),
            });
            setShowPaymentForm(false);
            setPaymentForm({ amount: '', paymentMode: 'cash', referenceNo: '', notes: '' });
            load();
        } catch (err) {
            setPayError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setPaySaving(false);
        }
    }

    if (loading) return <p className="text-slate-400">Loading…</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!invoice) return <p className="text-slate-400">No data found.</p>;

    const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const totalReturned = invoice.supplierReturns?.reduce((sum: number, r: any) => sum + Number(r.totalAmount), 0) ?? 0;
    const balanceDue = Number(invoice.totalAmount) - totalPaid - totalReturned;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link href="/purchase-invoices" className="text-xs font-medium text-brand-600 hover:underline">
                    ← Back to purchase invoices
                </Link>
                <div className="mt-1 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">GRN #{invoice.grnNumber}</h1>
                    <span className={`badge ${PAYMENT_STATUS_COLORS[invoice.paymentStatus] || ''}`}>{invoice.paymentStatus}</span>
                </div>
                <p className="text-sm text-slate-500">
                    Supplier: {invoice.supplier.name} · Invoice #{invoice.invoiceNumber}
                    {invoice.purchaseOrder && (
                        <>
                            {' · '}
                            <Link href={`/purchase-orders/${invoice.purchaseOrder.id}`} className="text-brand-600 hover:underline">
                                PO #{invoice.purchaseOrder.poNumber}
                            </Link>
                        </>
                    )}
                </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="label mb-1">Total Amount</p>
                    <p className="text-xl font-semibold text-slate-900">₹{Number(invoice.totalAmount).toFixed(2)}</p>
                </div>
                <div className="card p-4">
                    <p className="label mb-1">Total Paid</p>
                    <p className="text-xl font-semibold text-green-600">₹{totalPaid.toFixed(2)}</p>
                </div>
                <div className="card p-4">
                    <p className="label mb-1">Returns Deducted</p>
                    <p className="text-xl font-semibold text-orange-600">₹{totalReturned.toFixed(2)}</p>
                </div>
                <div className="card p-4">
                    <p className="label mb-1">Balance Due</p>
                    <p className={`text-xl font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        ₹{balanceDue.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="card p-5">
                <h2 className="mb-3 font-medium text-slate-800">GST Breakdown ({invoice.isInterState ? 'Inter-state' : 'Intra-state'})</h2>
                <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-slate-500">Taxable Value</p>
                        <p className="font-medium">₹{(Number(invoice.subtotal) - Number(invoice.totalDiscount)).toFixed(2)}</p>
                    </div>
                    {invoice.isInterState ? (
                        <div>
                            <p className="text-slate-500">IGST</p>
                            <p className="font-medium">₹{Number(invoice.totalIgst).toFixed(2)}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className="text-slate-500">CGST</p>
                                <p className="font-medium">₹{Number(invoice.totalCgst).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">SGST</p>
                                <p className="font-medium">₹{Number(invoice.totalSgst).toFixed(2)}</p>
                            </div>
                        </>
                    )}
                    <div>
                        <p className="text-slate-500">Total GST</p>
                        <p className="font-medium">₹{Number(invoice.totalGst).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="card p-5">
                <h2 className="mb-3 font-medium text-slate-800">Items Received</h2>
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="py-2">product</th>
                            <th className="py-2">Batch #</th>
                            <th className="py-2">Expiry</th>
                            <th className="py-2">Qty</th>
                            <th className="py-2">Free</th>
                            <th className="py-2">Rate</th>
                            <th className="py-2">GST%</th>
                            <th className="py-2">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoice.items.map((item: any) => (
                            <tr key={item.id}>
                                <td className="py-2">{item.product.name}</td>
                                <td className="py-2">{item.batchNumber}</td>
                                <td className="py-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
                                <td className="py-2">{item.quantity}</td>
                                <td className="py-2">{item.freeQuantity}</td>
                                <td className="py-2">₹{Number(item.purchaseRate).toFixed(2)}</td>
                                <td className="py-2">{String(item.gstPercentage)}%</td>
                                <td className="py-2">₹{Number(item.totalAmount).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-medium text-slate-800">Payments</h2>
                    {balanceDue > 0 && (
                        <button className="btn-primary text-sm" onClick={() => setShowPaymentForm(true)}>
                            + Record Payment
                        </button>
                    )}
                </div>

                {invoice.payments.length ? (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="py-2">Date</th>
                                <th className="py-2">Amount</th>
                                <th className="py-2">Mode</th>
                                <th className="py-2">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoice.payments.map((p: any) => (
                                <tr key={p.id}>
                                    <td className="py-2">{new Date(p.paidAt).toLocaleDateString()}</td>
                                    <td className="py-2">₹{Number(p.amount).toFixed(2)}</td>
                                    <td className="py-2">{p.paymentMode}</td>
                                    <td className="py-2">{p.referenceNo || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-slate-400">No payments recorded yet.</p>
                )}
            </div>

            {invoice.supplierReturns?.length > 0 && (
                <div className="card p-5">
                    <h2 className="mb-3 font-medium text-slate-800">Returns Against This Invoice</h2>
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="py-2">Return #</th>
                                <th className="py-2">Reason</th>
                                <th className="py-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoice.supplierReturns.map((r: any) => (
                                <tr key={r.id}>
                                    <td className="py-2">
                                        <Link href={`/supplier-returns/${r.id}`} className="text-brand-600 hover:underline">
                                            {r.returnNumber}
                                        </Link>
                                    </td>
                                    <td className="py-2">{r.reason || '-'}</td>
                                    <td className="py-2 text-orange-600">₹{Number(r.totalAmount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showPaymentForm && (
                <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
                    <div className="card w-full max-w-md p-6">
                        <h2 className="mb-4 text-lg font-semibold text-slate-800">Record Payment</h2>
                        <form onSubmit={handleAddPayment} className="space-y-3">
                            <div>
                                <label className="label">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input"
                                    required
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                />
                                <p className="mt-1 text-xs text-slate-400">Balance due: ₹{balanceDue.toFixed(2)}</p>
                            </div>
                            <div>
                                <label className="label">Payment Mode</label>
                                <select
                                    className="input"
                                    value={paymentForm.paymentMode}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="upi">UPI</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Reference No (optional)</label>
                                <input
                                    className="input"
                                    value={paymentForm.referenceNo}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label">Notes (optional)</label>
                                <input
                                    className="input"
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                />
                            </div>

                            {payError && <p className="text-sm text-red-600">{payError}</p>}

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" className="btn-secondary" onClick={() => setShowPaymentForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={paySaving}>
                                    {paySaving ? 'Saving…' : 'Save Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}