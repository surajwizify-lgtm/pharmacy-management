"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/suppliers")
            .then((res) => res.json())
            .then(setSuppliers);
    }, []);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Suppliers</h1>
                <Link href="/suppliers/new" className="bg-blue-600 text-white px-4 py-2 rounded">
                    + Add Supplier
                </Link>
            </div>
            <table className="w-full border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Contact</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map((s) => (
                        <tr key={s.id} className="border-t">
                            <td className="p-2">{s.name}</td>
                            <td className="p-2">{s.phone || s.email}</td>
                            <td className="p-2">{s.status}</td>
                            <td className="p-2">
                                <Link href={`/suppliers/${s.id}`} className="text-blue-600">View</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}