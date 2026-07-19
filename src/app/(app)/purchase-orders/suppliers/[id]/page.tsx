"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SupplierLedgerPrint from "@/components/print/SupplierLedgerPrint";


export default function SupplierDetailPage() {
    const [showPrint, setShowPrint] = useState(false);
    const params = useParams();
    const id = params?.id as string;

    const [supplier, setSupplier] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        paymentMode: "BANK_TRANSFER",
        referenceNo: "",
        notes: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const fetchSupplier = () => {
        setLoading(true);
        fetch(`/api/suppliers/${id}`)
            .then(async (res) => {
                if (!res.ok) throw new Error("Supplier not found");
                return res.json();
            })
            .then(setSupplier)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!id) return;
        fetchSupplier();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    useEffect(() => {
        if (!showPrint) return;

        const timer = setTimeout(() => {
            window.print();
        }, 150);

        return () => clearTimeout(timer);
    }, [showPrint]);

    useEffect(() => {
        const afterPrint = () => setShowPrint(false);

        window.addEventListener("afterprint", afterPrint);

        return () =>
            window.removeEventListener(
                "afterprint",
                afterPrint
            );
    }, []);

    const openPaymentModal = (purchaseOrderId: string | null = null, amount?: number) => {
        setSelectedPOId(purchaseOrderId);
        setPaymentForm({
            amount: amount ? amount.toFixed(2) : "",
            paymentMode: "BANK_TRANSFER",
            referenceNo: "",
            notes: "",
        });
        setFormError("");
        setShowPaymentModal(true);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedPOId(null);
        setFormError("");
    };

    const handlePaymentSubmit = async () => {
        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
            setFormError("Enter a valid amount.");
            return;
        }
        setSubmitting(true);
        setFormError("");
        try {
            const res = await fetch(`/api/suppliers/${id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    purchaseOrderId: selectedPOId ? Number(selectedPOId) : null,
                    amount: Number(paymentForm.amount),
                    paymentMode: paymentForm.paymentMode,
                    referenceNo: paymentForm.referenceNo || null,
                    notes: paymentForm.notes || null,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to add payment");
            }
            closePaymentModal();
            fetchSupplier();
        } catch (err: any) {
            setFormError(err.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="flex items-center gap-3 text-neutral-500">
                    <svg className="animate-spin h-5 w-5 text-primary-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-sm font-medium">Loading supplier...</span>
                </div>
            </div>
        );

    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-6 py-4 rounded-lg text-sm font-medium">
                    {error}
                </div>
            </div>
        );

    if (!supplier)
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <p className="text-neutral-500 text-sm">No data found.</p>
            </div>
        );

    const totalPOAmount = supplier.purchaseInvoices?.reduce(
        (sum: number, po: any) => sum + Number(po.totalAmount),
        0
    ) ?? 0;

    const totalPaid = supplier.payments?.reduce(
        (sum: number, p: any) => sum + Number(p.amount),
        0
    ) ?? 0;

    const totalReturns = supplier.supplierReturns?.reduce(
        (sum: number, r: any) => sum + Number(r.totalAmount),
        0
    ) ?? 0;

    const balanceDue = totalPOAmount - totalPaid - totalReturns;

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            PAID: "bg-secondary-50 text-secondary-700 border-secondary-200",
            PENDING: "bg-amber-50 text-amber-700 border-amber-200",
            PARTIAL: "bg-sky-50 text-sky-700 border-sky-200",
            CANCELLED: "bg-danger-50 text-danger-700 border-danger-200",
            ACTIVE: "bg-secondary-50 text-secondary-700 border-secondary-200",
            INACTIVE: "bg-neutral-100 text-neutral-600 border-neutral-200",
        };
        return map[status] || "bg-neutral-100 text-neutral-600 border-neutral-200";
    };
    console.log("supplier", supplier);

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-primary-600 uppercase mb-1">Supplier</p>
                        <h1 className="text-2xl font-bold text-neutral-900">{supplier.name}</h1>
                        <span className={`inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge(supplier.status)}`}>
                            {supplier.status}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowPrint(true)}
                            className="px-4 py-2 rounded-md bg-primary-600 text-white"
                        >
                            🖨 Print
                        </button>
                        <Link
                            href={`/purchase-orders/suppliers/${id}/edit`}
                            className="px-4 py-2 text-sm font-medium rounded-md border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-100 transition-colors"
                        >
                            Edit
                        </Link>
                        <Link
                            href="/purchase-orders/suppliers"
                            className="px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>

                {/* Basic info */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Contact Details</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div className="flex justify-between border-b border-neutral-100 pb-2">
                            <span className="text-neutral-500">Contact Person</span>
                            <span className="text-neutral-900 font-medium">{supplier.contactPerson || "-"}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-100 pb-2">
                            <span className="text-neutral-500">Email</span>
                            <span className="text-neutral-900 font-medium">{supplier.email || "-"}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-100 pb-2">
                            <span className="text-neutral-500">Phone</span>
                            <span className="text-neutral-900 font-medium">{supplier.phone || "-"}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-100 pb-2">
                            <span className="text-neutral-500">GST Number</span>
                            <span className="text-neutral-900 font-medium">{supplier.gstin || "-"}</span>
                        </div>
                        <div className="flex justify-between pb-1">
                            <span className="text-neutral-500">Address</span>
                            <span className="text-neutral-900 font-medium text-right">{supplier.address || "-"}</span>
                        </div>
                        <div className="flex justify-between pb-1">
                            <span className="text-neutral-500">Gst Drug License No </span>
                            <span className="text-neutral-900 font-medium text-right">{supplier.drugLicenseNo || "-"}</span>
                        </div>
                    </div>
                </div>

                {/* Ledger summary */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Total PO Amount</p>
                        <p className="text-xl font-bold text-neutral-900">₹{totalPOAmount.toFixed(2)}</p>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Total Paid</p>
                        <p className="text-xl font-bold text-secondary-600">₹{totalPaid.toFixed(2)}</p>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Total Returns</p>
                        <p className="text-xl font-bold text-amber-600">₹{totalReturns.toFixed(2)}</p>
                    </div>
                    <div className={`rounded-xl p-5 shadow-sm border ${balanceDue > 0 ? "bg-danger-50 border-danger-200" : "bg-white border-neutral-200"}`}>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Balance Due</p>
                        <p className={`text-xl font-bold ${balanceDue > 0 ? "text-danger-600" : "text-neutral-900"}`}>
                            ₹{balanceDue.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Purchase Orders */}
                <div className="bg-white border border-neutral-200 rounded-xl mb-6 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
                        <h2 className="text-base font-semibold text-neutral-900">Purchase Orders</h2>
                        <Link href={`/purchase-orders/new?supplierId=${id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                            + New PO
                        </Link>
                    </div>
                    {supplier.purchaseOrders?.length ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                                    <th className="p-3 text-left font-medium">PO Number</th>
                                    <th className="p-3 text-left font-medium">Status</th>
                                    <th className="p-3 text-left font-medium">Exp. Delivery Date</th>
                                    <th className="p-3 text-left font-medium">Order Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplier.purchaseOrders.map((po: any) => (
                                    <tr key={po.id} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                                        <td className="p-3">
                                            <Link href={`/purchase-orders/purchase-orders/${po.id}`} className="text-primary-600 font-medium hover:underline">
                                                {po.poNumber}
                                            </Link>
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadge(po.status)}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-neutral-700">{new Date(po.expectedDate).toLocaleDateString("hi")}</td>
                                        <td className="p-3 text-neutral-700">{new Date(po.orderDate).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-neutral-500 text-sm px-6 py-6">No purchase orders yet.</p>
                    )}
                </div>

                {/* Purchase Invoices */}
                <div className="bg-white border border-neutral-200 rounded-xl mb-6 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
                        <h2 className="text-base font-semibold text-neutral-900">Purchase Invoices</h2>
                        <Link href={`/purchase-orders/new?supplierId=${id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                            + New Invoice
                        </Link>
                    </div>
                    {supplier.purchaseInvoices?.length ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                                    <th className="p-3 text-left font-medium">Invoice Number</th>
                                    <th className="p-3 text-left font-medium">Payment Status</th>
                                    <th className="p-3 text-left font-medium">Amount</th>
                                    <th className="p-3 text-left font-medium">Invoice Date</th>
                                    <th className="p-3 text-left font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplier.purchaseInvoices.map((po: any) => (
                                    <tr key={po.id} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                                        <td className="p-3">
                                            <Link href={`/purchase-orders/${po.id}`} className="text-primary-600 font-medium hover:underline">
                                                {po.invoiceNumber}
                                            </Link>
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadge(po.paymentStatus)}`}>
                                                {po.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="p-3 text-neutral-900 font-medium">₹{Number(po.totalAmount).toFixed(2)}</td>
                                        <td className="p-3 text-neutral-700">{new Date(po.invoiceDate).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            {po.paymentStatus !== "PAID" && (
                                                <button
                                                    onClick={() => openPaymentModal(po.id, Number(po.totalAmount))}
                                                    className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                                >
                                                    + Add Payment
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-neutral-500 text-sm px-6 py-6">No purchase invoices yet.</p>
                    )}
                </div>

                {/* Supplier Returns */}
                <div className="bg-white border border-neutral-200 rounded-xl mb-6 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
                        <h2 className="text-base font-semibold text-neutral-900">Returns to Supplier</h2>
                        <Link href={`/supplier-returns/new?supplierId=${id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                            + New Return
                        </Link>
                    </div>
                    {supplier.supplierReturns?.length ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                                    <th className="p-3 text-left font-medium">Return #</th>
                                    <th className="p-3 text-left font-medium">Reason</th>
                                    <th className="p-3 text-left font-medium">Amount</th>
                                    <th className="p-3 text-left font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplier.supplierReturns.map((r: any) => (
                                    <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                                        <td className="p-3">
                                            <Link href={`/supplier-returns/${r.id}`} className="text-primary-600 font-medium hover:underline">
                                                {r.returnNumber}
                                            </Link>
                                        </td>
                                        <td className="p-3 text-neutral-700">{r.reason || "-"}</td>
                                        <td className="p-3 text-amber-600 font-medium">₹{Number(r.totalAmount).toFixed(2)}</td>
                                        <td className="p-3 text-neutral-700">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-neutral-500 text-sm px-6 py-6">No returns recorded yet.</p>
                    )}
                </div>

                {/* Payments */}
                <div className="bg-white border border-neutral-200 rounded-xl mb-8 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
                        <h2 className="text-base font-semibold text-neutral-900">Payments</h2>
                        <button
                            onClick={() => openPaymentModal(null)}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                            + Add Payment
                        </button>
                    </div>
                    {supplier.payments?.length ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                                    <th className="p-3 text-left font-medium">Date</th>
                                    <th className="p-3 text-left font-medium">Amount</th>
                                    <th className="p-3 text-left font-medium">Mode</th>
                                    <th className="p-3 text-left font-medium">Reference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplier.payments.map((p: any) => (
                                    <tr key={p.id} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                                        <td className="p-3 text-neutral-700">{new Date(p.paidAt).toLocaleDateString()}</td>
                                        <td className="p-3 text-secondary-600 font-medium">₹{Number(p.amount).toFixed(2)}</td>
                                        <td className="p-3 text-neutral-700">{p.paymentMode}</td>
                                        <td className="p-3 text-neutral-700">{p.referenceNo || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-neutral-500 text-sm px-6 py-6">No payments recorded yet.</p>
                    )}
                </div>
            </div>

            {/* Add Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-overlay-black backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-neutral-200">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-semibold text-neutral-900">Add Payment</h3>
                            <button
                                onClick={closePaymentModal}
                                className="text-neutral-400 hover:text-neutral-700 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {selectedPOId && (
                            <p className="text-sm text-neutral-500 mb-4 bg-primary-50 border border-primary-100 rounded-md px-3 py-2">
                                Against invoice:{" "}
                                <span className="font-semibold text-primary-700">
                                    {
                                        supplier.purchaseInvoices?.find(
                                            (po: any) => po.id === selectedPOId
                                        )?.invoiceNumber
                                    }
                                </span>
                            </p>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={paymentForm.amount}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, amount: e.target.value })
                                    }
                                    className="w-full border border-neutral-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Payment Mode</label>
                                <select
                                    value={paymentForm.paymentMode}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, paymentMode: e.target.value })
                                    }
                                    className="w-full border border-neutral-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CASH">Cash</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="UPI">UPI</option>
                                    <option value="CARD">Card</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Reference No.</label>
                                <input
                                    type="text"
                                    value={paymentForm.referenceNo}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, referenceNo: e.target.value })
                                    }
                                    className="w-full border border-neutral-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notes</label>
                                <textarea
                                    value={paymentForm.notes}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, notes: e.target.value })
                                    }
                                    className="w-full border border-neutral-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Optional"
                                    rows={2}
                                />
                            </div>

                            {formError && (
                                <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-md px-3 py-2">
                                    {formError}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={closePaymentModal}
                                className="px-4 py-2 text-sm font-medium rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePaymentSubmit}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-secondary-600 text-white hover:bg-secondary-700 transition-colors disabled:opacity-50"
                                disabled={submitting}
                            >
                                {submitting ? "Saving..." : "Save Payment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showPrint && (
                <SupplierLedgerPrint
                    supplier={supplier}
                    totalPOAmount={totalPOAmount}
                    totalPaid={totalPaid}
                    totalReturns={totalReturns}
                    balanceDue={balanceDue}
                />
            )}
        </div>
    );
}