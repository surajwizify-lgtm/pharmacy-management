"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    Pencil,
    User,
    Mail,
    Phone,
    MapPin,
    Receipt,
    IndianRupee,
    Wallet,
    Undo2,
    AlertCircle,
    ClipboardList,
    Plus,
    CreditCard,
} from "lucide-react";

function statusBadgeClass(status: string) {
    return status === "ACTIVE"
        ? "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200"
        : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200";
}

function statusDotClass(status: string) {
    return status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400";
}

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

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl space-y-6">
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
    if (!supplier) return <p className="text-slate-400">No data found.</p>;

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
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/purchase-orders/suppliers"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to suppliers
                </Link>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                        <Building2 className="h-6 w-6 text-brand-600" />
                        {supplier.name}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(supplier.status)}`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(supplier.status)}`} />
                            {supplier.status}
                        </span>
                        <Link
                            href={`/purchase-orders/suppliers/${id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                        </Link>
                    </div>
                </div>
            </div>

            {/* Basic info */}
            <div className="card grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                <p className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-400">Contact person:</span> {supplier.contactPerson || "—"}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-400">Email:</span> {supplier.email || "—"}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-400">Phone:</span> {supplier.phone || "—"}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Receipt className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-400">GST number:</span> {supplier.gstNumber || "—"}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-400">Address:</span> {supplier.address || "—"}
                </p>
            </div>

            {/* Ledger summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                        <IndianRupee className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Total PO amount</p>
                        <p className="text-lg font-semibold text-slate-900">₹{totalPOAmount.toFixed(2)}</p>
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
                        <p className="text-xs uppercase tracking-wide text-slate-400">Total returns</p>
                        <p className="text-lg font-semibold text-orange-600">₹{totalReturns.toFixed(2)}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3 p-4">
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${balanceDue > 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}
                    >
                        <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Balance due</p>
                        <p className={`text-lg font-semibold ${balanceDue > 0 ? "text-red-600" : "text-slate-800"}`}>
                            ₹{balanceDue.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Purchase orders */}
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <h2 className="flex items-center gap-2 font-medium text-slate-800">
                        <ClipboardList className="h-4 w-4 text-brand-600" />
                        Purchase Orders
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {supplier.purchaseOrders?.length ?? 0}
                        </span>
                    </h2>
                    <Link
                        href={`/purchase-orders/new?supplierId=${id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New PO
                    </Link>
                </div>
                {supplier.purchaseOrders?.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="p-3">PO number</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Order date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {supplier.purchaseOrders.map((po: any) => (
                                    <tr key={po.id} className="hover:bg-slate-50/70">
                                        <td className="p-3">
                                            <Link href={`/purchase-orders/${po.id}`} className="font-medium text-brand-600 hover:underline">
                                                {po.poNumber}
                                            </Link>
                                        </td>
                                        <td className="p-3">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="p-3 font-medium text-slate-800">₹{Number(po.totalAmount).toFixed(2)}</td>
                                        <td className="p-3 text-slate-500">{new Date(po.orderDate).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <ClipboardList className="mb-2 h-8 w-8" />
                        <p className="text-sm">No purchase orders yet.</p>
                    </div>
                )}
            </div>

            {/* Supplier returns */}
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <h2 className="flex items-center gap-2 font-medium text-slate-800">
                        <Undo2 className="h-4 w-4 text-orange-600" />
                        Returns to Supplier
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {supplier.supplierReturns?.length ?? 0}
                        </span>
                    </h2>
                    <Link
                        href={`/supplier-returns/new?supplierId=${id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New Return
                    </Link>
                </div>
                {supplier.supplierReturns?.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="p-3">Return #</th>
                                    <th className="p-3">Reason</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {supplier.supplierReturns.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50/70">
                                        <td className="p-3">
                                            <Link href={`/supplier-returns/${r.id}`} className="font-medium text-brand-600 hover:underline">
                                                {r.returnNumber}
                                            </Link>
                                        </td>
                                        <td className="p-3 text-slate-600">{r.reason || "—"}</td>
                                        <td className="p-3 font-medium text-orange-600">₹{Number(r.totalAmount).toFixed(2)}</td>
                                        <td className="p-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <Undo2 className="mb-2 h-8 w-8" />
                        <p className="text-sm">No returns recorded yet.</p>
                    </div>
                )}
            </div>

            {/* Payments */}
            <div className="card overflow-hidden">
                <div className="border-b border-slate-100 p-4">
                    <h2 className="flex items-center gap-2 font-medium text-slate-800">
                        <CreditCard className="h-4 w-4 text-brand-600" />
                        Payments
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {supplier.payments?.length ?? 0}
                        </span>
                    </h2>
                </div>
                {supplier.payments?.length ? (
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
                                {supplier.payments.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-slate-50/70">
                                        <td className="p-3 text-slate-500">{new Date(p.paidAt).toLocaleDateString()}</td>
                                        <td className="p-3 font-medium text-emerald-600">₹{Number(p.amount).toFixed(2)}</td>
                                        <td className="p-3">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                {p.paymentMode}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-500">{p.referenceNo || "—"}</td>
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
        </div>
    );
}