"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CreatePurchaseOrderModal from '@/components/CreatePurchaseOrderModal';
import PageHeader from "@/components/common/Header";
import HeaderButton from "@/components/common/HeaderButton";

export default function SuppliersPage() {

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [showCreatePO, setShowCreatePO] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);


    function openCreatePurchaseOrder(supplier: any) {
        setSelectedSupplier(supplier);
        setShowCreatePO(true);
    }

    useEffect(() => {
        fetch("/api/suppliers")
            .then((res) => res.json())
            .then(setSuppliers);
    }, []);

    return (
        <div className="">
            <PageHeader
                header={`Suppliers`}
                subheader="Manage All Supplier Here"
            >
                <HeaderButton text="Add Supplier" href='/purchase-orders/suppliers/new' />
            </PageHeader>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full">
                    <thead className="border-b bg-slate-50">
                        <tr className="text-left text-sm font-semibold text-slate-700">
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {suppliers.map((s) => (
                            <tr
                                key={s.id}
                                className="border-b transition hover:bg-blue-50"
                            >
                                <td className="px-6 py-5">
                                    <div className="font-semibold text-slate-900">
                                        {s.name}
                                    </div>

                                    <div className="text-sm text-slate-500">
                                        {s.contactPerson || "-"}
                                    </div>
                                </td>

                                <td className="px-6">
                                    {s.email || "-"}
                                </td>

                                <td className="px-6">
                                    {s.phone || "-"}
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-3">

                                        <button
                                            onClick={() => openCreatePurchaseOrder(s)}
                                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                        >
                                            Create Purchase Order
                                        </button>

                                        <Link
                                            href={`/purchase-orders/suppliers/${s.id}`}
                                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                                        >
                                            View
                                        </Link>

                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <CreatePurchaseOrderModal
                open={showCreatePO}
                supplier={selectedSupplier}
                onClose={() => {
                    setShowCreatePO(false);
                    setSelectedSupplier(null);
                }}
                onSuccess={() => {
                    setShowCreatePO(false);
                    setSelectedSupplier(null);

                    // optional if you want to refresh suppliers
                    fetch("/api/suppliers")
                        .then((res) => res.json())
                        .then(setSuppliers);
                }}
            />
        </div>
    );
}