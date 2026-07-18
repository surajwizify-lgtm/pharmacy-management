"use client";

import PageHeader from "@/components/common/Header";
import HeaderButton from "@/components/common/HeaderButton";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

type Customer = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    gstin: string | null;
    active: boolean;
    _count: { bills: number };
};

const emptyForm = {
    name: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    active: true,
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchCustomers = useCallback(async (q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = q ? `/api/customers?search=${encodeURIComponent(q)}` : "/api/customers";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load customers");
            setCustomers(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        const t = setTimeout(() => fetchCustomers(search), 300);
        return () => clearTimeout(t);
    }, [search, fetchCustomers]);

    function openCreateModal() {
        setEditingId(null);
        setForm(emptyForm);
        setFormError(null);
        setModalOpen(true);
    }

    function openEditModal(c: Customer) {
        setEditingId(c.id);
        setForm({
            name: c.name,
            phone: c.phone ?? "",
            email: c.email ?? "",
            address: c.address ?? "",
            gstin: c.gstin ?? "",
            active: c.active,
        });
        setFormError(null);
        setModalOpen(true);
    }

    async function handleSave() {
        if (!form.name.trim()) {
            setFormError("Name is required");
            return;
        }
        setSaving(true);
        setFormError(null);

        const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
        const method = editingId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save customer");

            setModalOpen(false);
            fetchCustomers(search);
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(c: Customer) {
        if (!confirm(`Delete customer "${c.name}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete customer");
            fetchCustomers(search);
        } catch (err: any) {
            alert(err.message);
        }
    }

    return (
        <div className="">
            <PageHeader
                header={`Customers`}
                subheader="Manage customer records used across billing."
            >
                <HeaderButton text="Add Location" onClick={openCreateModal} />
            </PageHeader>

            <div className="mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full max-w-sm border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                />
            </div>

            {loading && <p className="text-neutral-500 text-sm">Loading customers...</p>}
            {error && (
                <p className="text-danger-700 bg-danger-50 border border-danger-200 rounded-md px-3 py-2 text-sm mb-4">
                    {error}
                </p>
            )}

            {!loading && !error && (
                <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-100 text-neutral-600 text-left">
                            <tr>
                                <th className="px-4 py-2 font-medium">Name</th>
                                <th className="px-4 py-2 font-medium">Phone</th>
                                <th className="px-4 py-2 font-medium">Email</th>
                                <th className="px-4 py-2 font-medium">GSTIN</th>
                                <th className="px-4 py-2 font-medium">Bills</th>
                                <th className="px-4 py-2 font-medium">Status</th>
                                <th className="px-4 py-2 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                                        No customers found.
                                    </td>
                                </tr>
                            )}
                            {customers.map((c) => (
                                <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                                    <td className="px-4 py-2 font-medium text-neutral-900">
                                        <Link
                                            href={`/billing/customers/${c.id}`}
                                            className="hover:underline text-primary-700"
                                        >
                                            {c.name}
                                        </Link>
                                        {c.address && (
                                            <div className="text-xs text-neutral-400">{c.address}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-neutral-600">{c.phone || "—"}</td>
                                    <td className="px-4 py-2 text-neutral-600">{c.email || "—"}</td>
                                    <td className="px-4 py-2 text-neutral-600">{c.gstin || "—"}</td>
                                    <td className="px-4 py-2 text-neutral-600">{c._count.bills}</td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.active
                                                ? "bg-secondary-100 text-secondary-800"
                                                : "bg-neutral-100 text-neutral-500"
                                                }`}
                                        >
                                            {c.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right space-x-3">
                                        <button
                                            onClick={() => openEditModal(c)}
                                            className="text-primary-600 hover:underline text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c)}
                                            className="text-danger-600 hover:underline text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 bg-overlay-black flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 border border-neutral-200">
                        <h2 className="text-lg font-semibold mb-4 text-neutral-900">
                            {editingId ? "Edit Customer" : "Add Customer"}
                        </h2>

                        {formError && (
                            <p className="text-danger-700 bg-danger-50 border border-danger-200 rounded-md px-3 py-2 text-sm mb-3">
                                {formError}
                            </p>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                    Address
                                </label>
                                <textarea
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                    GSTIN
                                </label>
                                <input
                                    type="text"
                                    value={form.gstin}
                                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-neutral-700">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                    className="accent-primary-600"
                                />
                                Active
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-sm rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {saving ? "Saving..." : editingId ? "Save Changes" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}