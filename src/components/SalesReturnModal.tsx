// "use client";

// import { useEffect, useState } from "react";
// import { X, RotateCcw } from "lucide-react";
// import { apiFetch, ApiClientError } from "@/lib/api-client";
// import type { Bill } from "@/types";

// const REASONS = ["Wrong product", "Customer refusal", "Expired at sale", "Other"];

// export default function SalesReturnModal({
//     billId,
//     onClose,
//     onSuccess,
// }: {
//     billId: number;
//     onClose: () => void;
//     onSuccess: () => void;
// }) {
//     const [bill, setBill] = useState<Bill | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [loadError, setLoadError] = useState<string | null>(null);

//     const [qtyByItem, setQtyByItem] = useState<Record<number, number>>({});
//     const [reason, setReason] = useState(REASONS[0]);
//     const [submitting, setSubmitting] = useState(false);
//     const [submitError, setSubmitError] = useState<string | null>(null);

//     useEffect(() => {
//         apiFetch<Bill>(`/api/bills/${billId}`)
//             .then(setBill)
//             .catch((err) => setLoadError(err instanceof ApiClientError ? err.message : "Could not load bill"))
//             .finally(() => setLoading(false));
//     }, [billId]);

//     function setQty(billItemId: number, max: number, value: string) {
//         const n = Math.max(0, Math.min(max, Number(value) || 0));
//         setQtyByItem((prev) => ({ ...prev, [billItemId]: n }));
//     }

//     const totalRefundPreview =
//         bill?.billItems.reduce((sum, item) => {
//             const qty = qtyByItem[item.id] || 0;
//             const perUnit = Number(item.totalAmount) / item.quantity;
//             return sum + perUnit * qty;
//         }, 0) ?? 0;

//     async function handleSubmit() {
//         setSubmitError(null);
//         const items = Object.entries(qtyByItem)
//             .filter(([, qty]) => qty > 0)
//             .map(([billItemId, quantity]) => ({ billItemId: Number(billItemId), quantity }));

//         if (items.length === 0) {
//             setSubmitError("Enter a quantity to return for at least one item.");
//             return;
//         }

//         setSubmitting(true);
//         try {
//             await apiFetch(`/api/bills/${billId}/returns`, {
//                 method: "POST",
//                 body: JSON.stringify({ reason, items }),
//             });
//             onSuccess();
//             onClose();
//         } catch (err) {
//             setSubmitError(err instanceof ApiClientError ? err.message : "Failed to process return");
//         } finally {
//             setSubmitting(false);
//         }
//     }

//     return (
//         <div
//             className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
//             onClick={onClose}
//         >
//             <div
//                 className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
//                 onClick={(e) => e.stopPropagation()}
//             >
//                 <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4 text-white">
//                     <div className="flex items-center gap-2">
//                         <RotateCcw className="h-5 w-5" />
//                         <h2 className="text-lg font-semibold">
//                             {bill ? `Return items — ${bill.billNumber}` : "Sales Return"}
//                         </h2>
//                     </div>
//                     <button onClick={onClose} className="rounded-full p-2 hover:bg-white/15">
//                         <X className="h-5 w-5" />
//                     </button>
//                 </div>

//                 <div className="flex-1 overflow-y-auto p-6">
//                     {loading ? (
//                         <p className="text-sm text-slate-400">Loading bill…</p>
//                     ) : loadError ? (
//                         <p className="text-sm text-red-600">{loadError}</p>
//                     ) : bill ? (
//                         <>
//                             <table className="w-full text-left text-sm">
//                                 <thead className="bg-slate-50 text-xs uppercase text-slate-500">
//                                     <tr>
//                                         <th className="px-3 py-2">Product</th>
//                                         <th className="px-3 py-2">Batch</th>
//                                         <th className="px-3 py-2">Sold Qty</th>
//                                         <th className="px-3 py-2">Return Qty</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="divide-y divide-slate-100">
//                                     {bill.billItems.map((item) => (
//                                         <tr key={item.id}>
//                                             <td className="px-3 py-2">{item.product?.name ?? `#${item.productId}`}</td>
//                                             <td className="px-3 py-2 text-slate-500">{item.batchNumber}</td>
//                                             <td className="px-3 py-2">{item.quantity}</td>
//                                             <td className="px-3 py-2">
//                                                 <input
//                                                     type="number"
//                                                     min={0}
//                                                     max={item.quantity}
//                                                     className="input h-8 w-20"
//                                                     value={qtyByItem[item.id] || ""}
//                                                     onChange={(e) => setQty(item.id, item.quantity, e.target.value)}
//                                                 />
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>

//                             <div className="mt-4">
//                                 <label className="label">Reason</label>
//                                 <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
//                                     {REASONS.map((r) => (
//                                         <option key={r} value={r}>
//                                             {r}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
//                                 <span className="text-slate-500">Estimated refund</span>
//                                 <span className="text-lg font-semibold text-slate-800">₹{totalRefundPreview.toFixed(2)}</span>
//                             </div>

//                             {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}
//                         </>
//                     ) : null}
//                 </div>

//                 <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
//                     <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm" onClick={onClose}>
//                         Cancel
//                     </button>
//                     <button
//                         className="btn-primary"
//                         disabled={submitting || loading || !!loadError}
//                         onClick={handleSubmit}
//                     >
//                         {submitting ? "Processing…" : "Submit Return"}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }
"use client";

import { useEffect, useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { Bill } from "@/types";

const REASONS = ["Wrong product", "Customer refusal", "Expired at sale", "Other"];

export default function SalesReturnModal({
    billId,
    onClose,
    onSuccess,
}: {
    billId: number;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [bill, setBill] = useState<Bill | null>(null);
    const [remaining, setRemaining] = useState<Record<number, number>>({});
    const [fullyReturned, setFullyReturned] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [qtyByItem, setQtyByItem] = useState<Record<number, number>>({});
    const [reason, setReason] = useState(REASONS[0]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            apiFetch<Bill>(`/api/bills/${billId}`),
            apiFetch<{ remainingByBillItemId: Record<number, number>; fullyReturned: boolean }>(
                `/api/bills/${billId}/returns`
            ),
        ])
            .then(([billData, returnData]) => {
                setBill(billData);
                setRemaining(returnData.remainingByBillItemId);
                setFullyReturned(returnData.fullyReturned);
            })
            .catch((err) => setLoadError(err instanceof ApiClientError ? err.message : "Could not load bill"))
            .finally(() => setLoading(false));
    }, [billId]);

    function setQty(billItemId: number, max: number, value: string) {
        const n = Math.max(0, Math.min(max, Number(value) || 0));
        setQtyByItem((prev) => ({ ...prev, [billItemId]: n }));
    }

    const totalRefundPreview =
        bill?.billItems.reduce((sum, item) => {
            const qty = qtyByItem[item.id] || 0;
            const perUnit = Number(item.totalAmount) / item.quantity;
            return sum + perUnit * qty;
        }, 0) ?? 0;

    async function handleSubmit() {
        setSubmitError(null);
        const items = Object.entries(qtyByItem)
            .filter(([, qty]) => qty > 0)
            .map(([billItemId, quantity]) => ({ billItemId: Number(billItemId), quantity }));

        if (items.length === 0) {
            setSubmitError("Enter a quantity to return for at least one item.");
            return;
        }

        setSubmitting(true);
        try {
            await apiFetch(`/api/bills/${billId}/returns`, {
                method: "POST",
                body: JSON.stringify({ reason, items }),
            });
            onSuccess();
            onClose();
        } catch (err) {
            setSubmitError(err instanceof ApiClientError ? err.message : "Failed to process return");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4 text-white">
                    <div className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">
                            {bill ? `Return items — ${bill.billNumber}` : "Sales Return"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-white/15">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <p className="text-sm text-slate-400">Loading bill…</p>
                    ) : loadError ? (
                        <p className="text-sm text-red-600">{loadError}</p>
                    ) : fullyReturned ? (
                        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                            Every item on this bill has already been fully returned. There's nothing left to return.
                        </div>
                    ) : bill ? (
                        <>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2">Product</th>
                                        <th className="px-3 py-2">Batch</th>
                                        <th className="px-3 py-2">Sold Qty</th>
                                        <th className="px-3 py-2">Already Returned</th>
                                        <th className="px-3 py-2">Return Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {bill.billItems.map((item) => {
                                        const remainingQty = remaining[item.id] ?? item.quantity;
                                        const alreadyReturnedQty = item.quantity - remainingQty;
                                        return (
                                            <tr key={item.id}>
                                                <td className="px-3 py-2">{item.product?.name ?? `#${item.productId}`}</td>
                                                <td className="px-3 py-2 text-slate-500">{item.batchNumber}</td>
                                                <td className="px-3 py-2">{item.quantity}</td>
                                                <td className="px-3 py-2 text-slate-500">{alreadyReturnedQty}</td>
                                                <td className="px-3 py-2">
                                                    {remainingQty === 0 ? (
                                                        <span className="text-xs text-slate-400">Fully returned</span>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={remainingQty}
                                                            className="input h-8 w-20"
                                                            value={qtyByItem[item.id] || ""}
                                                            onChange={(e) => setQty(item.id, remainingQty, e.target.value)}
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="mt-4">
                                <label className="label">Reason</label>
                                <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
                                    {REASONS.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                                <span className="text-slate-500">Estimated refund</span>
                                <span className="text-lg font-semibold text-slate-800">₹{totalRefundPreview.toFixed(2)}</span>
                            </div>

                            {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}
                        </>
                    ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        disabled={submitting || loading || !!loadError || fullyReturned}
                        onClick={handleSubmit}
                    >
                        {submitting ? "Processing…" : "Submit Return"}
                    </button>
                </div>
            </div>
        </div>
    );
}