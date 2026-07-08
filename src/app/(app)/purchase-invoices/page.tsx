
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import {
    ArrowLeft,
    Receipt,
    Building2,
    FileText,
    IndianRupee,
    Wallet,
    Undo2,
    AlertCircle,
    Package,
    CreditCard,
    Plus,
    X,
    Calendar,
} from 'lucide-react';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    DUE: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200',
    PARTIAL: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
    PAID: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
};

const PAYMENT_STATUS_DOTS: Record<string, string> = {
    DUE: 'bg-red-500',
    PARTIAL: 'bg-amber-500',
    PAID: 'bg-emerald-500',
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

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="card h-24 animate-pulse p-4" />
                    ))}
                </div>
                <div className="card h-48 animate-pulse p-5" />
            </div>
        );
    }
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!invoice) return <p className="text-slate-400">No data found.</p>;

    const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const totalReturned = invoice.supplierReturns?.reduce((sum: number, r: any) => sum + Number(r.totalAmount), 0) ?? 0;
    const balanceDue = Number(invoice.totalAmount) - totalPaid - totalReturned;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/purchase-invoices"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to purchase invoices
                </Link>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                        <Receipt className="h-6 w-6 text-brand-600" />
                        GRN #{invoice.grnNumber}
                    </h1>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${PAYMENT_STATUS_COLORS[invoice.paymentStatus] || 'bg-slate-100 text-slate-600'}`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${PAYMENT_STATUS_DOTS[invoice.paymentStatus] || 'bg-slate-400'}`} />
                        {invoice.paymentStatus}
                    </span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {invoice.supplier.name}
                    <span className="text-slate-300">·</span>
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    Invoice #{invoice.invoiceNumber}
                    {invoice.purchaseOrder && (
                        <>
                            <span className="text-slate-300">·</span>
                            <Link href={`/purchase-orders/${invoice.purchaseOrder.id}`} className="text-brand-600 hover:underline">
                                PO #{invoice.purchaseOrder.poNumber}
                            </Link>
                        </>
                    )}
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                        <IndianRupee className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Total amount</p>
                        <p className="text-lg font-semibold text-slate-900">₹{Number(invoice.totalAmount).toFixed(2)}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Total paid</p>
                        <p className="text-lg font-semibold text-emerald-600">₹{totalPaid.toFixed(2)}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                        <Undo2 className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Returns deducted</p>
                        <p className="text-lg font-semibold text-orange-600">₹{totalReturned.toFixed(2)}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3 p-4">
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${balanceDue > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                        <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Balance due</p>
                        <p className={`text-lg font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            ₹{balanceDue.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* GST breakdown */}
            <div className="card p-5">
                <h2 className="mb-3 flex items-center gap-2 font-medium text-slate-800">
                    <Receipt className="h-4 w-4 text-brand-600" />
                    GST Breakdown
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {invoice.isInterState ? 'Inter-state' : 'Intra-state'}
                    </span>
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Taxable value</p>
                        <p className="mt-0.5 font-medium text-slate-800">
                            ₹{(Number(invoice.subtotal) - Number(invoice.totalDiscount)).toFixed(2)}
                        </p>
                    </div>
                    {invoice.isInterState ? (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">IGST</p>
                            <p className="mt-0.5 font-medium text-slate-800">₹{Number(invoice.totalIgst).toFixed(2)}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400">CGST</p>
                                <p className="mt-0.5 font-medium text-slate-800">₹{Number(invoice.totalCgst).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400">SGST</p>
                                <p className="mt-0.5 font-medium text-slate-800">₹{Number(invoice.totalSgst).toFixed(2)}</p>
                            </div>
                        </>
                    )}
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Total GST</p>
                        <p className="mt-0.5 font-medium text-slate-800">₹{Number(invoice.totalGst).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Items received */}
            <div className="card overflow-hidden">
                <div className="border-b border-slate-100 p-4">
                    <h2 className="flex items-center gap-2 font-medium text-slate-800">
                        <Package className="h-4 w-4 text-brand-600" />
                        Items Received
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {invoice.items.length}
                        </span>
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="p-3">Product</th>
                                <th className="p-3">Batch #</th>
                                <th className="p-3">Expiry</th>
                                <th className="p-3">Qty</th>
                                <th className="p-3">Free</th>
                                <th className="p-3">Rate</th>
                                <th className="p-3">GST%</th>
                                <th className="p-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoice.items.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/70">
                                    <td className="p-3 font-medium text-slate-800">{item.product.name}</td>
                                    <td className="p-3 text-slate-500">{item.batchNumber}</td>
                                    <td className="p-3 text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            {new Date(item.expiryDate).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-600">{item.quantity}</td>
                                    <td className="p-3 text-slate-600">{item.freeQuantity}</td>
                                    <td className="p-3 text-slate-600">₹{Number(item.purchaseRate).toFixed(2)}</td>
                                    <td className="p-3 text-slate-600">{String(item.gstPercentage)}%</td>
                                    <td className="p-3 text-right font-medium text-slate-800">₹{Number(item.totalAmount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payments */}
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <h2 className="flex items-center gap-2 font-medium text-slate-800">
                        <CreditCard className="h-4 w-4 text-brand-600" />
                        Payments
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {invoice.payments.length}
                        </span>
                    </h2>
                    {balanceDue > 0 && (
                        <button
                            className="btn-primary inline-flex items-center gap-1.5 text-sm"
                            onClick={() => setShowPaymentForm(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Record Payment
                        </button>
                    )}
                </div>

                {invoice.payments.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Mode</th>
                                    <th className="p-3">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoice.payments.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-slate-50/70">
                                        <td className="p-3 text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                {new Date(p.paidAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="p-3 font-medium text-emerald-600">₹{Number(p.amount).toFixed(2)}</td>
                                        <td className="p-3 text-slate-600">
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                {p.paymentMode}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-500">{p.referenceNo || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <CreditCard className="mb-2 h-8 w-8" />
                        <p className="text-sm">No payments recorded yet.</p>
                    </div>
                )}
            </div>

            {/* Returns */}
            {invoice.supplierReturns?.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="border-b border-slate-100 p-4">
                        <h2 className="flex items-center gap-2 font-medium text-slate-800">
                            <Undo2 className="h-4 w-4 text-orange-600" />
                            Returns Against This Invoice
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                {invoice.supplierReturns.length}
                            </span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="p-3">Return #</th>
                                    <th className="p-3">Reason</th>
                                    <th className="p-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoice.supplierReturns.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50/70">
                                        <td className="p-3">
                                            <Link href={`/supplier-returns/${r.id}`} className="font-medium text-brand-600 hover:underline">
                                                {r.returnNumber}
                                            </Link>
                                        </td>
                                        <td className="p-3 text-slate-600">{r.reason || '—'}</td>
                                        <td className="p-3 text-right font-medium text-orange-600">₹{Number(r.totalAmount).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Record payment modal */}
            {showPaymentForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
                    onClick={() => !paySaving && setShowPaymentForm(false)}
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4 text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                                    <CreditCard className="h-4 w-4" />
                                </div>
                                <h2 className="text-base font-semibold">Record Payment</h2>
                            </div>
                            <button
                                onClick={() => setShowPaymentForm(false)}
                                className="rounded-full p-1.5 transition-colors hover:bg-white/15"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddPayment} className="space-y-3 p-6">
                            <div>
                                <label className="label !flex items-center gap-1.5">
                                    <IndianRupee className="h-3.5 w-3.5" /> Amount
                                </label>
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
                                <label className="label">Payment mode</label>
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
                                <label className="label">Reference no. (optional)</label>
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
                                <button
                                    type="button"
                                    className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                    onClick={() => setShowPaymentForm(false)}
                                    disabled={paySaving}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1 justify-center" disabled={paySaving}>
                                    {paySaving ? 'Saving…' : 'Save payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}