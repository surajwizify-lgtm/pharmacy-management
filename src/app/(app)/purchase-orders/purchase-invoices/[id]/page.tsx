'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    DUE: 'bg-danger-100 text-danger-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    PAID: 'bg-secondary-100 text-secondary-700',
};

const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelClass = 'mb-1 block text-xs font-medium text-neutral-600';

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

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-300" />
                Loading…
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
                <span className="text-sm font-medium text-danger-700">{error}</span>
            </div>
        );
    }
    if (!invoice) return <p className="text-sm text-neutral-400">No data found.</p>;

    const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const totalReturned = invoice.supplierReturns?.reduce((sum: number, r: any) => sum + Number(r.totalAmount), 0) ?? 0;
    const balanceDue = Number(invoice.totalAmount) - totalPaid - totalReturned;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link
                    href="/purchase-orders/purchase-invoices"
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                    ← Back to purchase invoices
                </Link>
                <div className="mt-1 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-neutral-900">GRN No:- <span className='text-primary-700'>{invoice.grnNumber}</span></h1>
                    <span className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_COLORS[invoice.paymentStatus] || 'bg-neutral-100 text-neutral-600'}`}>
                        {invoice.paymentStatus}
                    </span>
                </div>
                <p className="text-sm text-neutral-500">
                    Supplier: {invoice.supplier.name} · Invoice #{invoice.invoiceNumber}
                    {invoice.purchaseOrder && (
                        <>
                            {' · '}
                            <Link
                                href={`/purchase-orders/${invoice.purchaseOrder.id}`}
                                className="text-primary-600 hover:text-primary-700 hover:underline"
                            >
                                PO #{invoice.purchaseOrder.poNumber}
                            </Link>
                        </>
                    )}
                </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <p className="mb-1 text-xs font-medium text-neutral-500">Total Amount</p>
                    <p className="text-xl font-semibold text-neutral-900">₹{Number(invoice.totalAmount).toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <p className="mb-1 text-xs font-medium text-neutral-500">Total Paid</p>
                    <p className="text-xl font-semibold text-secondary-600">₹{totalPaid.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <p className="mb-1 text-xs font-medium text-neutral-500">Returns Deducted</p>
                    <p className="text-xl font-semibold text-amber-600">₹{totalReturned.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <p className="mb-1 text-xs font-medium text-neutral-500">Balance Due</p>
                    <p className={`text-xl font-semibold ${balanceDue > 0 ? 'text-danger-600' : 'text-neutral-800'}`}>
                        ₹{balanceDue.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-medium text-neutral-800">
                    GST Breakdown ({invoice.isInterState ? 'Inter-state' : 'Intra-state'})
                </h2>
                <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-neutral-500">Taxable Value</p>
                        <p className="font-medium text-neutral-800">₹{(Number(invoice.subtotal) - Number(invoice.totalDiscount)).toFixed(2)}</p>
                    </div>
                    {invoice.isInterState ? (
                        <div>
                            <p className="text-neutral-500">IGST</p>
                            <p className="font-medium text-neutral-800">₹{Number(invoice.totalIgst).toFixed(2)}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className="text-neutral-500">CGST</p>
                                <p className="font-medium text-neutral-800">₹{Number(invoice.totalCgst).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-neutral-500">SGST</p>
                                <p className="font-medium text-neutral-800">₹{Number(invoice.totalSgst).toFixed(2)}</p>
                            </div>
                        </>
                    )}
                    <div>
                        <p className="text-neutral-500">Total GST</p>
                        <p className="font-medium text-neutral-800">₹{Number(invoice.totalGst).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-medium text-neutral-800">Items Received</h2>
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
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
                    <tbody className="divide-y divide-neutral-100">
                        {invoice.items.map((item: any) => (
                            <tr key={item.id} className="hover:bg-neutral-50">
                                <td className="py-2 font-medium text-neutral-800">{item.product.name}</td>
                                <td className="py-2 text-neutral-600">{item.batchNumber}</td>
                                <td className="py-2 text-neutral-600">{new Date(item.expiryDate).toLocaleDateString()}</td>
                                <td className="py-2 text-neutral-600">{item.quantity}</td>
                                <td className="py-2 text-neutral-600">{item.freeQuantity}</td>
                                <td className="py-2 text-neutral-600">₹{Number(item.purchaseRate).toFixed(2)}</td>
                                <td className="py-2 text-neutral-600">{String(item.gstPercentage)}%</td>
                                <td className="py-2 font-medium text-neutral-800">₹{Number(item.totalAmount).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-medium text-neutral-800">Payments</h2>
                    {balanceDue > 0 && (
                        <button
                            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
                            onClick={() => setShowPaymentForm(true)}
                        >
                            + Record Payment
                        </button>
                    )}
                </div>

                {invoice.payments.length ? (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                            <tr>
                                <th className="py-2">Date</th>
                                <th className="py-2">Amount</th>
                                <th className="py-2">Mode</th>
                                <th className="py-2">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {invoice.payments.map((p: any) => (
                                <tr key={p.id} className="hover:bg-neutral-50">
                                    <td className="py-2 text-neutral-600">{new Date(p.paidAt).toLocaleDateString()}</td>
                                    <td className="py-2 font-medium text-neutral-800">₹{Number(p.amount).toFixed(2)}</td>
                                    <td className="py-2 text-neutral-600">{p.paymentMode}</td>
                                    <td className="py-2 text-neutral-600">{p.referenceNo || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-neutral-400">No payments recorded yet.</p>
                )}
            </div>

            {invoice.supplierReturns?.length > 0 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-3 font-medium text-neutral-800">Returns Against This Invoice</h2>
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                            <tr>
                                <th className="py-2">Return #</th>
                                <th className="py-2">Reason</th>
                                <th className="py-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {invoice.supplierReturns.map((r: any) => (
                                <tr key={r.id} className="hover:bg-neutral-50">
                                    <td className="py-2">
                                        <Link
                                            href={`/purchase-orders/supplier-returns/${r.id}`}
                                            className="text-primary-600 hover:text-primary-700 hover:underline"
                                        >
                                            {r.returnNumber}
                                        </Link>
                                    </td>
                                    <td className="py-2 text-neutral-600">{r.reason || '-'}</td>
                                    <td className="py-2 text-amber-600">₹{Number(r.totalAmount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showPaymentForm && (
                <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="mb-4 text-lg font-semibold text-neutral-800">Record Payment</h2>
                        <form onSubmit={handleAddPayment} className="space-y-3">
                            <div>
                                <label className={labelClass}>Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={inputClass}
                                    required
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                />
                                <p className="mt-1 text-xs text-neutral-400">Balance due: ₹{balanceDue.toFixed(2)}</p>
                            </div>
                            <div>
                                <label className={labelClass}>Payment Mode</label>
                                <select
                                    className={inputClass}
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
                                <label className={labelClass}>Reference No (optional)</label>
                                <input
                                    className={inputClass}
                                    value={paymentForm.referenceNo}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Notes (optional)</label>
                                <input
                                    className={inputClass}
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                />
                            </div>

                            {payError && (
                                <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2">
                                    <span className="text-sm font-medium text-danger-700">{payError}</span>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                                    onClick={() => setShowPaymentForm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paySaving}
                                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
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