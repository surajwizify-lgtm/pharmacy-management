// // 'use client';

// // import { useEffect, useState } from 'react';
// // import { useParams } from 'next/navigation';
// // import Link from 'next/link';
// // import { apiFetch, ApiClientError } from '@/lib/api-client';

// // export default function PurchaseOrderDetailPage() {
// //     const params = useParams();
// //     const id = params?.id as string;

// //     const [po, setPo] = useState<any>(null);
// //     const [error, setError] = useState<string | null>(null);
// //     const [loading, setLoading] = useState(true);

// //     useEffect(() => {
// //         if (!id) return;
// //         apiFetch(`/api/purchase-orders/${id}`)
// //             .then(setPo)
// //             .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Something went wrong'))
// //             .finally(() => setLoading(false));
// //     }, [id]);

// //     if (loading) return <p className="text-slate-400">Loading…</p>;
// //     if (error) return <p className="text-sm text-red-600">{error}</p>;
// //     if (!po) return <p className="text-slate-400">No data found.</p>;

// //     const totalPaid = po.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
// //     const balanceDue = Number(po.totalAmount) - totalPaid;

// //     return (
// //         <div className="mx-auto max-w-3xl space-y-6">
// //             <div>
// //                 <Link href="/purchase-orders" className="text-xs font-medium text-brand-600 hover:underline">
// //                     ← Back to purchase orders
// //                 </Link>
// //                 <div className="mt-1 flex items-center justify-between">
// //                     <h1 className="text-2xl font-semibold text-slate-900">PO #{po.poNumber}</h1>
// //                     <span className="badge bg-brand-100 text-brand-700">{po.status}</span>
// //                 </div>
// //                 <p className="text-sm text-slate-500">Supplier: {po.supplier.name}</p>
// //             </div>

// //             <div className="grid grid-cols-3 gap-4">
// //                 <div className="card p-4">
// //                     <p className="label mb-1">Total Amount</p>
// //                     <p className="text-xl font-semibold text-slate-900">₹{Number(po.totalAmount).toFixed(2)}</p>
// //                 </div>
// //                 <div className="card p-4">
// //                     <p className="label mb-1">Total Paid</p>
// //                     <p className="text-xl font-semibold text-green-600">₹{totalPaid.toFixed(2)}</p>
// //                 </div>
// //                 <div className="card p-4">
// //                     <p className="label mb-1">Balance Due</p>
// //                     <p className={`text-xl font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-slate-800'}`}>
// //                         ₹{balanceDue.toFixed(2)}
// //                     </p>
// //                 </div>
// //             </div>

// //             <div className="card p-5">
// //                 <h2 className="mb-3 font-medium text-slate-800">Items Received</h2>
// //                 <table className="w-full text-left text-sm">
// //                     <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
// //                         <tr>
// //                             <th className="py-2">product</th>
// //                             <th className="py-2">Batch #</th>
// //                             <th className="py-2">Expiry</th>
// //                             <th className="py-2">Qty</th>
// //                             <th className="py-2">Unit Price</th>
// //                             <th className="py-2">Total</th>
// //                         </tr>
// //                     </thead>
// //                     <tbody className="divide-y divide-slate-100">
// //                         {po.items.map((item: any) => (
// //                             <tr key={item.id}>
// //                                 <td className="py-2">{item.product.name}</td>
// //                                 <td className="py-2">{item.batchNumber}</td>
// //                                 <td className="py-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
// //                                 <td className="py-2">{item.quantity}</td>
// //                                 <td className="py-2">₹{Number(item.unitPrice).toFixed(2)}</td>
// //                                 <td className="py-2">₹{Number(item.totalPrice).toFixed(2)}</td>
// //                             </tr>
// //                         ))}
// //                     </tbody>
// //                 </table>
// //             </div>

// //             <div className="card p-5">
// //                 <h2 className="mb-3 font-medium text-slate-800">Payments</h2>
// //                 {po.payments.length ? (
// //                     <table className="w-full text-left text-sm">
// //                         <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
// //                             <tr>
// //                                 <th className="py-2">Date</th>
// //                                 <th className="py-2">Amount</th>
// //                                 <th className="py-2">Mode</th>
// //                                 <th className="py-2">Reference</th>
// //                             </tr>
// //                         </thead>
// //                         <tbody className="divide-y divide-slate-100">
// //                             {po.payments.map((p: any) => (
// //                                 <tr key={p.id}>
// //                                     <td className="py-2">{new Date(p.paidAt).toLocaleDateString()}</td>
// //                                     <td className="py-2">₹{Number(p.amount).toFixed(2)}</td>
// //                                     <td className="py-2">{p.paymentMode}</td>
// //                                     <td className="py-2">{p.referenceNo || '-'}</td>
// //                                 </tr>
// //                             ))}
// //                         </tbody>
// //                     </table>
// //                 ) : (
// //                     <p className="text-sm text-slate-400">No payments recorded yet.</p>
// //                 )}
// //             </div>
// //         </div>
// //     );
// // }
// 'use client';

// import { useEffect, useState, type FormEvent } from 'react';
// import { useParams } from 'next/navigation';
// import Link from 'next/link';
// import { apiFetch, ApiClientError } from '@/lib/api-client';

// export default function PurchaseOrderDetailPage() {
//     const params = useParams();
//     const id = params?.id as string;

//     const [po, setPo] = useState<any>(null);
//     const [error, setError] = useState<string | null>(null);
//     const [loading, setLoading] = useState(true);

//     const [showPaymentForm, setShowPaymentForm] = useState(false);
//     const [paymentForm, setPaymentForm] = useState({
//         amount: '',
//         paymentMode: 'cash',
//         referenceNo: '',
//         notes: '',
//     });
//     const [paySaving, setPaySaving] = useState(false);
//     const [payError, setPayError] = useState<string | null>(null);

//     async function load() {
//         const data = await apiFetch<any>(`/api/purchase-orders/${id}`);
//         setPo(data);
//     }

//     useEffect(() => {
//         if (!id) return;
//         load()
//             .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Something went wrong'))
//             .finally(() => setLoading(false));
//     }, [id]);

//     async function handleAddPayment(e: FormEvent) {
//         e.preventDefault();
//         setPayError(null);

//         if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
//             setPayError('Enter a valid amount');
//             return;
//         }

//         setPaySaving(true);
//         try {
//             await apiFetch(`/api/purchase-orders/${id}/payments`, {
//                 method: 'POST',
//                 body: JSON.stringify({
//                     amount: Number(paymentForm.amount),
//                     paymentMode: paymentForm.paymentMode,
//                     referenceNo: paymentForm.referenceNo || undefined,
//                     notes: paymentForm.notes || undefined,
//                 }),
//             });
//             setShowPaymentForm(false);
//             setPaymentForm({ amount: '', paymentMode: 'cash', referenceNo: '', notes: '' });
//             load();
//         } catch (err) {
//             setPayError(err instanceof ApiClientError ? err.message : 'Something went wrong');
//         } finally {
//             setPaySaving(false);
//         }
//     }

//     if (loading) return <p className="text-slate-400">Loading…</p>;
//     if (error) return <p className="text-sm text-red-600">{error}</p>;
//     if (!po) return <p className="text-slate-400">No data found.</p>;

//     const totalPaid = po.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
//     const balanceDue = Number(po.totalAmount) - totalPaid;

//     return (
//         <div className="mx-auto max-w-3xl space-y-6">
//             <div>
//                 <Link href="/purchase-orders" className="text-xs font-medium text-brand-600 hover:underline">
//                     ← Back to purchase orders
//                 </Link>
//                 <div className="mt-1 flex items-center justify-between">
//                     <h1 className="text-2xl font-semibold text-slate-900">PO #{po.poNumber}</h1>
//                     <span className="badge bg-brand-100 text-brand-700">{po.status}</span>
//                 </div>
//                 <p className="text-sm text-slate-500">Supplier: {po.supplier.name}</p>
//             </div>

//             <div className="grid grid-cols-3 gap-4">
//                 <div className="card p-4">
//                     <p className="label mb-1">Total Amount</p>
//                     <p className="text-xl font-semibold text-slate-900">₹{Number(po.totalAmount).toFixed(2)}</p>
//                 </div>
//                 <div className="card p-4">
//                     <p className="label mb-1">Total Paid</p>
//                     <p className="text-xl font-semibold text-green-600">₹{totalPaid.toFixed(2)}</p>
//                 </div>
//                 <div className="card p-4">
//                     <p className="label mb-1">Balance Due</p>
//                     <p className={`text-xl font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-slate-800'}`}>
//                         ₹{balanceDue.toFixed(2)}
//                     </p>
//                 </div>
//             </div>

//             <div className="card p-5">
//                 <h2 className="mb-3 font-medium text-slate-800">Items Received</h2>
//                 <table className="w-full text-left text-sm">
//                     <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
//                         <tr>
//                             <th className="py-2">product</th>
//                             <th className="py-2">Batch #</th>
//                             <th className="py-2">Expiry</th>
//                             <th className="py-2">Qty</th>
//                             <th className="py-2">Unit Price</th>
//                             <th className="py-2">Total</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-100">
//                         {po.items.map((item: any) => (
//                             <tr key={item.id}>
//                                 <td className="py-2">{item.product.name}</td>
//                                 <td className="py-2">{item.batchNumber}</td>
//                                 <td className="py-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
//                                 <td className="py-2">{item.quantity}</td>
//                                 <td className="py-2">₹{Number(item.unitPrice).toFixed(2)}</td>
//                                 <td className="py-2">₹{Number(item.totalPrice).toFixed(2)}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             <div className="card p-5">
//                 <div className="mb-3 flex items-center justify-between">
//                     <h2 className="font-medium text-slate-800">Payments</h2>
//                     {balanceDue > 0 && (
//                         <button className="btn-primary text-sm" onClick={() => setShowPaymentForm(true)}>
//                             + Record Payment
//                         </button>
//                     )}
//                 </div>

//                 {po.payments.length ? (
//                     <table className="w-full text-left text-sm">
//                         <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
//                             <tr>
//                                 <th className="py-2">Date</th>
//                                 <th className="py-2">Amount</th>
//                                 <th className="py-2">Mode</th>
//                                 <th className="py-2">Reference</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                             {po.payments.map((p: any) => (
//                                 <tr key={p.id}>
//                                     <td className="py-2">{new Date(p.paidAt).toLocaleDateString()}</td>
//                                     <td className="py-2">₹{Number(p.amount).toFixed(2)}</td>
//                                     <td className="py-2">{p.paymentMode}</td>
//                                     <td className="py-2">{p.referenceNo || '-'}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 ) : (
//                     <p className="text-sm text-slate-400">No payments recorded yet.</p>
//                 )}
//             </div>

//             {showPaymentForm && (
//                 <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
//                     <div className="card w-full max-w-md p-6">
//                         <h2 className="mb-4 text-lg font-semibold text-slate-800">Record Payment</h2>
//                         <form onSubmit={handleAddPayment} className="space-y-3">
//                             <div>
//                                 <label className="label">Amount</label>
//                                 <input
//                                     type="number"
//                                     step="0.01"
//                                     className="input"
//                                     required
//                                     max={balanceDue}
//                                     value={paymentForm.amount}
//                                     onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
//                                 />
//                                 <p className="mt-1 text-xs text-slate-400">Balance due: ₹{balanceDue.toFixed(2)}</p>
//                             </div>
//                             <div>
//                                 <label className="label">Payment Mode</label>
//                                 <select
//                                     className="input"
//                                     value={paymentForm.paymentMode}
//                                     onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
//                                 >
//                                     <option value="cash">Cash</option>
//                                     <option value="bank_transfer">Bank Transfer</option>
//                                     <option value="cheque">Cheque</option>
//                                     <option value="upi">UPI</option>
//                                 </select>
//                             </div>
//                             <div>
//                                 <label className="label">Reference No (optional)</label>
//                                 <input
//                                     className="input"
//                                     value={paymentForm.referenceNo}
//                                     onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
//                                 />
//                             </div>
//                             <div>
//                                 <label className="label">Notes (optional)</label>
//                                 <input
//                                     className="input"
//                                     value={paymentForm.notes}
//                                     onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
//                                 />
//                             </div>
//                             {payError && <p className="text-sm text-red-600">{payError}</p>}

//                             <div className="flex justify-end gap-2 pt-2">
//                                 <button type="button" className="btn-secondary" onClick={() => setShowPaymentForm(false)}>
//                                     Cancel
//                                 </button>
//                                 <button type="submit" className="btn-primary" disabled={paySaving}>
//                                     {paySaving ? 'Saving…' : 'Save Payment'}
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }
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
                                        <Link href={`/purchase-invoices/${inv.id}`} className="text-brand-600 hover:underline">
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