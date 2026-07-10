"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SupplierDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [supplier, setSupplier] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Payment modal state
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

    if (loading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
    if (!supplier) return <div className="p-6">No data found.</div>;

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

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{supplier.name}</h1>
                <div className="flex gap-3">
                    <Link href={`/purchase-orders/suppliers/${id}/edit`} className="text-blue-600">Edit</Link>
                    <Link href="/purchase-orders/suppliers" className="text-blue-600">Back to list</Link>
                </div>
            </div>

            {/* Basic info */}
            <div className="border rounded p-4 mb-6 space-y-1">
                <p><span className="font-medium">Contact Person:</span> {supplier.contactPerson || "-"}</p>
                <p><span className="font-medium">Email:</span> {supplier.email || "-"}</p>
                <p><span className="font-medium">Phone:</span> {supplier.phone || "-"}</p>
                <p><span className="font-medium">Address:</span> {supplier.address || "-"}</p>
                <p><span className="font-medium">GST Number:</span> {supplier.gstNumber || "-"}</p>
                <p><span className="font-medium">Status:</span> {supplier.status}</p>
            </div>

            {/* Ledger summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="border rounded p-4 text-center">
                    <p className="text-sm text-gray-500">Total PO Amount</p>
                    <p className="text-xl font-bold">₹{totalPOAmount.toFixed(2)}</p>
                </div>
                <div className="border rounded p-4 text-center">
                    <p className="text-sm text-gray-500">Total Paid</p>
                    <p className="text-xl font-bold text-green-600">₹{totalPaid.toFixed(2)}</p>
                </div>
                <div className="border rounded p-4 text-center">
                    <p className="text-sm text-gray-500">Total Returns (Debit Notes)</p>
                    <p className="text-xl font-bold text-orange-600">₹{totalReturns.toFixed(2)}</p>
                </div>
                <div className="border rounded p-4 text-center">
                    <p className="text-sm text-gray-500">Balance Due</p>
                    <p className={`text-xl font-bold ${balanceDue > 0 ? "text-red-600" : "text-gray-800"}`}>
                        ₹{balanceDue.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Purchase Orders */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold">Purchase Orders</h2>
                    <Link href={`/purchase-orders/new?supplierId=${id}`} className="text-sm text-blue-600">
                        + New PO
                    </Link>
                </div>
                {supplier.purchaseOrders?.length ? (
                    <table className="w-full border text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">PO Number</th>
                                <th className="p-2 text-left">Status</th>
                                <th className="p-2 text-left">Exp. Delivery Date</th>
                                <th className="p-2 text-left">Order Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplier.purchaseOrders.map((po: any) => (
                                <tr key={po.id} className="border-t">
                                    <td className="p-2">
                                        <Link href={`/purchase-orders/purchase-orders/${po.id}`} className="text-blue-600">
                                            {po.poNumber}
                                        </Link>
                                    </td>
                                    <td className="p-2">{po.status}</td>
                                    <td className="p-2">{new Date(po.expectedDate).toLocaleDateString("hi")}</td>
                                    <td className="p-2">{new Date(po.orderDate).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-500 text-sm">No purchase orders yet.</p>
                )}
            </div>

            {/* Purchase Invoices */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold">Purchase Invoices</h2>
                    <Link href={`/purchase-orders/new?supplierId=${id}`} className="text-sm text-blue-600">
                        + New Invoice
                    </Link>
                </div>
                {supplier.purchaseInvoices?.length ? (
                    <table className="w-full border text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">PO Number</th>
                                <th className="p-2 text-left">Payment Status</th>
                                <th className="p-2 text-left">Amount</th>
                                <th className="p-2 text-left">Invoice Date</th>
                                <th className="p-2 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplier.purchaseInvoices.map((po: any) => (
                                <tr key={po.id} className="border-t">
                                    <td className="p-2">
                                        <Link href={`/purchase-orders/${po.id}`} className="text-blue-600">
                                            {po.invoiceNumber}
                                        </Link>
                                    </td>
                                    <td className="p-2">{po.paymentStatus}</td>
                                    <td className="p-2">₹{Number(po.totalAmount).toFixed(2)}</td>
                                    <td className="p-2">{new Date(po.invoiceDate).toLocaleDateString()}</td>
                                    <td className="p-2">
                                        {po.paymentStatus !== "PAID" && (
                                            <button
                                                onClick={() => openPaymentModal(po.id, Number(po.totalAmount))}
                                                className="text-sm text-blue-600 underline"
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
                    <p className="text-gray-500 text-sm">No purchase orders yet.</p>
                )}
            </div>

            {/* Supplier Returns */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold">Returns to Supplier</h2>
                    <Link href={`/supplier-returns/new?supplierId=${id}`} className="text-sm text-blue-600">
                        + New Return
                    </Link>
                </div>
                {supplier.supplierReturns?.length ? (
                    <table className="w-full border text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">Return #</th>
                                <th className="p-2 text-left">Reason</th>
                                <th className="p-2 text-left">Amount</th>
                                <th className="p-2 text-left">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplier.supplierReturns.map((r: any) => (
                                <tr key={r.id} className="border-t">
                                    <td className="p-2">
                                        <Link href={`/supplier-returns/${r.id}`} className="text-blue-600">
                                            {r.returnNumber}
                                        </Link>
                                    </td>
                                    <td className="p-2">{r.reason || "-"}</td>
                                    <td className="p-2 text-orange-600">₹{Number(r.totalAmount).toFixed(2)}</td>
                                    <td className="p-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-500 text-sm">No returns recorded yet.</p>
                )}
            </div>

            {/* Payments */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold">Payments</h2>
                    <button
                        onClick={() => openPaymentModal(null)}
                        className="text-sm text-blue-600 underline"
                    >
                        + Add Payment
                    </button>
                </div>
                {supplier.payments?.length ? (
                    <table className="w-full border text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">Date</th>
                                <th className="p-2 text-left">Amount</th>
                                <th className="p-2 text-left">Mode</th>
                                <th className="p-2 text-left">Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplier.payments.map((p: any) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-2">{new Date(p.paidAt).toLocaleDateString()}</td>
                                    <td className="p-2">₹{Number(p.amount).toFixed(2)}</td>
                                    <td className="p-2">{p.paymentMode}</td>
                                    <td className="p-2">{p.referenceNo || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-500 text-sm">No payments recorded yet.</p>
                )}
            </div>

            {/* Add Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Add Payment</h3>
                            <button
                                onClick={closePaymentModal}
                                className="text-gray-500 hover:text-gray-800"
                            >
                                ✕
                            </button>
                        </div>

                        {selectedPOId && (
                            <p className="text-sm text-gray-500 mb-3">
                                Against invoice:{" "}
                                <span className="font-medium">
                                    {
                                        supplier.purchaseInvoices?.find(
                                            (po: any) => po.id === selectedPOId
                                        )?.invoiceNumber
                                    }
                                </span>
                            </p>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={paymentForm.amount}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, amount: e.target.value })
                                    }
                                    className="w-full border rounded p-2 text-sm"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Payment Mode</label>
                                <select
                                    value={paymentForm.paymentMode}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, paymentMode: e.target.value })
                                    }
                                    className="w-full border rounded p-2 text-sm"
                                >
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CASH">Cash</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="UPI">UPI</option>
                                    <option value="CARD">Card</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Reference No.</label>
                                <input
                                    type="text"
                                    value={paymentForm.referenceNo}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, referenceNo: e.target.value })
                                    }
                                    className="w-full border rounded p-2 text-sm"
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    value={paymentForm.notes}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, notes: e.target.value })
                                    }
                                    className="w-full border rounded p-2 text-sm"
                                    placeholder="Optional"
                                    rows={2}
                                />
                            </div>

                            {formError && (
                                <p className="text-sm text-red-600">{formError}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={closePaymentModal}
                                className="px-4 py-2 text-sm rounded border"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePaymentSubmit}
                                className="px-4 py-2 text-sm rounded bg-green-700 text-white disabled:opacity-50"
                                disabled={submitting}
                            >
                                {submitting ? "Saving..." : "Save Payment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}