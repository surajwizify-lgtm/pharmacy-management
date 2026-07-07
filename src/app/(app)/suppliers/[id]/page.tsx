"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SupplierDetailPage() {
    const { id } = useParams() as { id: string };

    const [supplier, setSupplier] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;

        async function loadSupplier() {
            try {
                const res = await fetch(`/api/suppliers/${id}`);

                if (!res.ok) throw new Error("Supplier not found");

                const data = await res.json();

                setSupplier(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadSupplier();
    }, [id]);

    const formatCurrency = (amount: any) =>
        `₹${Number(amount || 0).toFixed(2)}`;

    const formatDate = (date: any) =>
        date ? new Date(date).toLocaleDateString("en-IN") : "-";

    const totalPOAmount = useMemo(() => {
        return (
            supplier?.purchaseOrders?.reduce(
                (sum: number, po: any) =>
                    sum + Number(po.totalAmount ?? po.grandTotal ?? 0),
                0
            ) || 0
        );
    }, [supplier]);

    const totalPaid = useMemo(() => {
        return (
            supplier?.payments?.reduce(
                (sum: number, payment: any) =>
                    sum + Number(payment.amount ?? 0),
                0
            ) || 0
        );
    }, [supplier]);

    const totalReturns = useMemo(() => {
        return (
            supplier?.supplierReturns?.reduce(
                (sum: number, item: any) =>
                    sum + Number(item.totalAmount ?? item.totalGst ?? 0),
                0
            ) || 0
        );
    }, [supplier]);

    const balanceDue = totalPOAmount - totalPaid - totalReturns;

    if (loading)
        return (
            <div className="p-8 text-center text-gray-500">
                Loading supplier...
            </div>
        );

    if (error)
        return (
            <div className="p-8 text-center text-red-600">{error}</div>
        );

    if (!supplier)
        return (
            <div className="p-8 text-center">
                Supplier not found.
            </div>
        );

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">

            {/* Header */}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">
                        {supplier.name}
                    </h1>

                    <p className="text-gray-500">
                        Supplier Details
                    </p>
                </div>

                <div className="flex gap-3">
                    <Link
                        href={`/suppliers/${id}/edit`}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Edit
                    </Link>

                    <Link
                        href="/suppliers"
                        className="px-4 py-2 rounded border"
                    >
                        Back
                    </Link>
                </div>
            </div>

            {/* Supplier Information */}

            <div className="bg-white rounded-lg border shadow-sm p-6">

                <h2 className="font-semibold text-lg mb-4">
                    Supplier Information
                </h2>

                <div className="grid md:grid-cols-2 gap-4">

                    <p>
                        <strong>Contact Person:</strong>{" "}
                        {supplier.contactPerson || "-"}
                    </p>

                    <p>
                        <strong>Phone:</strong>{" "}
                        {supplier.phone || "-"}
                    </p>

                    <p>
                        <strong>Email:</strong>{" "}
                        {supplier.email || "-"}
                    </p>

                    <p>
                        <strong>GST Number:</strong>{" "}
                        {supplier.gstNumber || "-"}
                    </p>

                    <p className="md:col-span-2">
                        <strong>Address:</strong>{" "}
                        {supplier.address || "-"}
                    </p>

                    <p>
                        <strong>Status:</strong>{" "}
                        <span
                            className={`font-semibold ${supplier.status === "ACTIVE"
                                ? "text-green-600"
                                : "text-red-600"
                                }`}
                        >
                            {supplier.status}
                        </span>
                    </p>
                </div>
            </div>

            {/* Summary */}

            <div className="grid md:grid-cols-4 gap-4">

                <SummaryCard
                    title="Purchase Orders"
                    value={formatCurrency(totalPOAmount)}
                />

                <SummaryCard
                    title="Payments"
                    value={formatCurrency(totalPaid)}
                    color="text-green-600"
                />

                <SummaryCard
                    title="Returns"
                    value={formatCurrency(totalReturns)}
                    color="text-orange-600"
                />

                <SummaryCard
                    title="Balance Due"
                    value={formatCurrency(balanceDue)}
                    color={
                        balanceDue > 0
                            ? "text-red-600"
                            : "text-green-600"
                    }
                />
            </div>

            {/* Purchase Orders */}

            <SectionHeader
                title={`Purchase Orders (${supplier.purchaseOrders?.length || 0})`}
                href={`/purchase-orders/new?supplierId=${id}`}
                button="+ New Purchase Order"
            />

            {supplier.purchaseOrders?.length ? (
                <Table>
                    <thead>
                        <tr>
                            <Th>PO Number</Th>
                            <Th>Status</Th>
                            <Th>Amount</Th>
                            <Th>Date</Th>
                        </tr>
                    </thead>

                    <tbody>
                        {supplier.purchaseOrders.map((po: any) => (
                            <tr key={po.id}>
                                <Td>
                                    <Link
                                        href={`/purchase-orders/${po.id}`}
                                        className="text-blue-600"
                                    >
                                        {po.poNumber}
                                    </Link>
                                </Td>

                                <Td>{po.status}</Td>

                                <Td>
                                    {formatCurrency(
                                        po.totalAmount ?? po.grandTotal
                                    )}
                                </Td>

                                <Td>{formatDate(po.orderDate)}</Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <Empty text="No purchase orders found." />
            )}

            {/* Returns */}

            <SectionHeader
                title={`Supplier Returns (${supplier.supplierReturns?.length || 0})`}
                href={`/supplier-returns/new?supplierId=${id}`}
                button="+ New Return"
            />

            {supplier.supplierReturns?.length ? (
                <Table>
                    <thead>
                        <tr>
                            <Th>Return No.</Th>
                            <Th>Reason</Th>
                            <Th>Type</Th>
                            <Th>Amount</Th>
                            <Th>Date</Th>
                        </tr>
                    </thead>

                    <tbody>
                        {supplier.supplierReturns.map((r: any) => (
                            <tr key={r.id}>
                                <Td>
                                    <Link
                                        href={`/supplier-returns/${r.id}`}
                                        className="text-blue-600"
                                    >
                                        {r.returnNumber}
                                    </Link>
                                </Td>

                                <Td>{r.reason || "-"}</Td>

                                <Td>{r.refundType || "-"}</Td>

                                <Td className="text-orange-600">
                                    {formatCurrency(r.totalAmount)}
                                </Td>

                                <Td>{formatDate(r.createdAt)}</Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <Empty text="No supplier returns found." />
            )}

            {/* Payments */}

            <SectionHeader
                title={`Payments (${supplier.payments?.length || 0})`}
            />

            {supplier.payments?.length ? (
                <Table>
                    <thead>
                        <tr>
                            <Th>Date</Th>
                            <Th>Amount</Th>
                            <Th>Mode</Th>
                            <Th>Reference</Th>
                        </tr>
                    </thead>

                    <tbody>
                        {supplier.payments.map((payment: any) => (
                            <tr key={payment.id}>
                                <Td>{formatDate(payment.paidAt)}</Td>

                                <Td className="text-green-600">
                                    {formatCurrency(payment.amount)}
                                </Td>

                                <Td>{payment.paymentMode}</Td>

                                <Td>{payment.referenceNo || "-"}</Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <Empty text="No payments recorded." />
            )}
        </div>
    );
}

function SummaryCard({
    title,
    value,
    color = "",
}: {
    title: string;
    value: string;
    color?: string;
}) {
    return (
        <div className="border rounded-lg bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{title}</p>
            <p className={`text-2xl font-bold mt-2 ${color}`}>
                {value}
            </p>
        </div>
    );
}

function SectionHeader({
    title,
    href,
    button,
}: {
    title: string;
    href?: string;
    button?: string;
}) {
    return (
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
                {title}
            </h2>

            {href && (
                <Link
                    href={href}
                    className="text-blue-600 hover:underline"
                >
                    {button}
                </Link>
            )}
        </div>
    );
}

function Table({ children }: any) {
    return (
        <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
            <table className="w-full text-sm">
                {children}
            </table>
        </div>
    );
}

function Th({ children }: any) {
    return (
        <th className="bg-gray-100 text-left p-3 font-semibold">
            {children}
        </th>
    );
}

function Td({ children, className = "" }: any) {
    return (
        <td className={`p-3 border-t ${className}`}>
            {children}
        </td>
    );
}

function Empty({ text }: { text: string }) {
    return (
        <div className="border rounded-lg p-6 text-center text-gray-500 bg-white">
            {text}
        </div>
    );
}