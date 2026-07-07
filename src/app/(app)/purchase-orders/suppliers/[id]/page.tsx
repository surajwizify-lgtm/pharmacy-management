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

    useEffect(() => {
        if (!id) return;

        fetch(`/api/suppliers/${id}`)
            .then(async (res) => {
                if (!res.ok) throw new Error("Supplier not found");
                return res.json();
            })
            .then(setSupplier)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
    if (!supplier) return <div className="p-6">No data found.</div>;

    const totalPOAmount = supplier.purchaseOrders?.reduce(
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
                    <Link href={`/suppliers/${id}/edit`} className="text-blue-600">Edit</Link>
                    <Link href="/suppliers" className="text-blue-600">Back to list</Link>
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
                                <th className="p-2 text-left">Amount</th>
                                <th className="p-2 text-left">Order Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplier.purchaseOrders.map((po: any) => (
                                <tr key={po.id} className="border-t">
                                    <td className="p-2">
                                        <Link href={`/purchase-orders/${po.id}`} className="text-blue-600">
                                            {po.poNumber}
                                        </Link>
                                    </td>
                                    <td className="p-2">{po.status}</td>
                                    <td className="p-2">₹{Number(po.totalAmount).toFixed(2)}</td>
                                    <td className="p-2">{new Date(po.orderDate).toLocaleDateString()}</td>
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
                <h2 className="text-lg font-semibold mb-2">Payments</h2>
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
        </div>
    );
}