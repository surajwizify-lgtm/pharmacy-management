'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Supplier {
    id: number;
    name: string;
}

interface PurchaseInvoice {
    id: number;
    invoiceNumber?: string;
    grnNumber?: string;
}

interface SupplierReturnItem {
    id: number;
    supplierReturnId: number;
    batchId: number;
}

interface SupplierReturn {
    id: number;
    returnNumber: string;
    supplierId: number;
    supplier: Supplier;
    purchaseInvoiceId: number | null;
    purchaseInvoice: PurchaseInvoice | null;
    reason: string | null;
    refundType: string;
    totalAmount: string;
    totalGst: string;
    createdAt: string;
    items: SupplierReturnItem[];
}

export default function SupplierReturnsPage() {
    const [returns, setReturns] = useState<SupplierReturn[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/supplier-returns')
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setReturns(data);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-6">
                Loading...
            </div>
        );
    }

    return (
        <div className="p-6">

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">
                    Supplier Returns
                </h1>

                <Link
                    href="/purchase-orders/return/new"
                    className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                    + New Return
                </Link>
            </div>

            <div className="overflow-x-auto rounded border">

                <table className="min-w-full border-collapse">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="border px-4 py-2 text-left">
                                Return No
                            </th>

                            <th className="border px-4 py-2 text-left">
                                Supplier
                            </th>

                            <th className="border px-4 py-2 text-left">
                                Invoice
                            </th>

                            <th className="border px-4 py-2 text-left">
                                Reason
                            </th>

                            <th className="border px-4 py-2 text-left">
                                Refund Type
                            </th>

                            <th className="border px-4 py-2 text-right">
                                GST
                            </th>

                            <th className="border px-4 py-2 text-right">
                                Amount
                            </th>

                            <th className="border px-4 py-2 text-center">
                                Items
                            </th>

                            <th className="border px-4 py-2 text-left">
                                Date
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {returns.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="border px-4 py-6 text-center text-gray-500"
                                >
                                    No supplier returns found.
                                </td>
                            </tr>
                        ) : (
                            returns.map((ret) => (
                                <tr key={ret.id} className="hover:bg-gray-50">

                                    <td className="border px-4 py-2">
                                        {ret.returnNumber}
                                    </td>

                                    <td className="border px-4 py-2">
                                        {ret.supplier?.name ?? '-'}
                                    </td>

                                    <td className="border px-4 py-2">
                                        {ret.purchaseInvoice?.invoiceNumber ??
                                            ret.purchaseInvoice?.grnNumber ??
                                            '-'}
                                    </td>

                                    <td className="border px-4 py-2">
                                        {ret.reason ?? '-'}
                                    </td>

                                    <td className="border px-4 py-2 capitalize">
                                        {ret.refundType.replace('_', ' ')}
                                    </td>

                                    <td className="border px-4 py-2 text-right">
                                        ₹{Number(ret.totalGst).toFixed(2)}
                                    </td>

                                    <td className="border px-4 py-2 text-right font-medium">
                                        ₹{Number(ret.totalAmount).toFixed(2)}
                                    </td>

                                    <td className="border px-4 py-2 text-center">
                                        {ret.items.length}
                                    </td>

                                    <td className="border px-4 py-2">
                                        {new Date(ret.createdAt).toLocaleDateString()}
                                    </td>

                                </tr>
                            ))
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}