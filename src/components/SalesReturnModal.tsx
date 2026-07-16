"use client";

import { useEffect, useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { Bill } from "@/types";

const REASONS = ["Wrong product", "Customer refusal", "Expired at sale", "Other"];


function returnLineAmounts(
    item: { totalAmount: number | string; quantity: number; gstPercentage?: number | string },
    returnQty: number,
    isInterState: boolean
) {
    const perUnitTotal = Number(item.totalAmount) / item.quantity;
    const gstPct = Number(item.gstPercentage ?? 0);
    const perUnitTaxable = perUnitTotal / (1 + gstPct / 100);
    const perUnitTax = perUnitTotal - perUnitTaxable;

    const taxable = perUnitTaxable * returnQty;
    const tax = perUnitTax * returnQty;
    const total = perUnitTotal * returnQty;

    return isInterState
        ? { taxable, cgst: 0, sgst: 0, igst: tax, total }
        : { taxable, cgst: tax / 2, sgst: tax / 2, igst: 0, total };
}

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

    const isInterState = Boolean((bill as any)?.isInterState);

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
            const { total } = returnLineAmounts(item, qty, isInterState);
            return sum + total;
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-black backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-neutral-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-primary-700 to-indigo-700 px-6 py-4 text-white">
                    <div className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">
                            {bill ? `Return items — ${bill.billNumber}` : "Sales Return"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-white/15">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center gap-3 py-8 text-neutral-500">
                            <svg className="h-5 w-5 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            <span className="text-sm font-medium">Loading bill...</span>
                        </div>
                    ) : loadError ? (
                        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
                            {loadError}
                        </div>
                    ) : fullyReturned ? (
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
                            Every item on this bill has already been fully returned. There's nothing left to return.
                        </div>
                    ) : bill ? (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-neutral-200">
                                <table className="w-full text-left text-[8px]">
                                    <thead>
                                        <tr className="divide-x divide-neutral-200 bg-neutral-50 text-[8px] uppercase tracking-wide text-neutral-500">
                                            <th className="px-3 py-2.5 font-medium">Product</th>
                                            <th className="px-3 py-2.5 font-medium">Batch</th>
                                            <th className="px-3 py-2.5 font-medium">Sold Qty</th>
                                            <th className="px-3 py-2.5 font-medium">Already Returned</th>
                                            <th className="px-3 py-2.5 font-medium">GST%</th>
                                            <th className="px-3 py-2.5 font-medium">Taxable Value</th>
                                            {isInterState ? (
                                                <th className="px-3 py-2.5 font-medium">IGST</th>
                                            ) : (
                                                <>
                                                    <th className="px-3 py-2.5 font-medium">CGST</th>
                                                    <th className="px-3 py-2.5 font-medium">SGST</th>
                                                </>
                                            )}
                                            <th className="px-3 py-2.5 font-medium">Return Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {bill.billItems.map((item) => {
                                            const remainingQty = remaining[item.id] ?? item.quantity;
                                            const alreadyReturnedQty = item.quantity - remainingQty;
                                            const returnQty = qtyByItem[item.id] || 0;
                                            const { taxable, cgst, sgst, igst } = returnLineAmounts(
                                                item,
                                                returnQty || 1,
                                                isInterState
                                            );

                                            return (
                                                <tr key={item.id} className="divide-x divide-neutral-100 transition-colors hover:bg-neutral-50">
                                                    <td className="px-3 py-2.5 font-medium text-neutral-900">
                                                        {item.product?.name ?? `#${item.productId}`}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-neutral-500">{item.batchNumber}</td>
                                                    <td className="px-3 py-2.5 text-neutral-700">{item.quantity}</td>
                                                    <td className="px-3 py-2.5 text-neutral-500">{alreadyReturnedQty}</td>
                                                    <td className="px-3 py-2.5 text-neutral-600">{item.gstPercentage ?? 0}%</td>
                                                    <td className="px-3 py-2.5 text-neutral-600">
                                                        ₹{returnQty > 0 ? taxable.toFixed(2) : "0.00"}
                                                    </td>
                                                    {isInterState ? (
                                                        <td className="px-3 py-2.5">
                                                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                                                ₹{returnQty > 0 ? igst.toFixed(2) : "0.00"}
                                                            </span>
                                                        </td>
                                                    ) : (
                                                        <>
                                                            <td className="px-3 py-2.5">
                                                                <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                                                                    ₹{returnQty > 0 ? cgst.toFixed(2) : "0.00"}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <span className="rounded-md bg-secondary-50 px-2 py-0.5 text-xs font-medium text-secondary-700">
                                                                    ₹{returnQty > 0 ? sgst.toFixed(2) : "0.00"}
                                                                </span>
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-3 py-2.5">
                                                        {remainingQty === 0 ? (
                                                            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">
                                                                Fully returned
                                                            </span>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={remainingQty}
                                                                className="h-8 w-20 rounded-md border border-neutral-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Reason</label>
                                <select
                                    className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                >
                                    {REASONS.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3">
                                <span className="text-sm font-medium text-neutral-600">Total refund (incl. GST)</span>
                                <span className="text-lg font-bold text-secondary-700">₹{totalRefundPreview.toFixed(2)}</span>
                            </div>

                            {submitError && (
                                <p className="mt-3 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                                    {submitError}
                                </p>
                            )}
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4">
                    <button
                        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
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