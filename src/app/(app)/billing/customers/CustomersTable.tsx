// app/billing/customers/CustomersTable.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import HeaderButton from '@/components/common/HeaderButton';

export type Customer = {
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

export default function CustomersTable({ data }: { data: Customer[] }) {
    const router = useRouter();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || "Failed to save customer");

            setModalOpen(false);
            router.refresh();
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
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || "Failed to delete customer");
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        }
    }

    const columns: ColumnDef<Customer>[] = useMemo(
        () => [
            {
                id: 'name',
                header: 'Name',
                accessorKey: 'name',
                cell: ({ row }) => (
                    <div>
                        <Link href={`/billing/customers/${row.original.id}`} className="text-brand-600 hover:underline">
                            {row.original.name}
                        </Link>
                        {row.original.address && (
                            <div className="text-xs text-neutral-500">{row.original.address}</div>
                        )}
                    </div>
                ),
            },
            {
                id: 'phone',
                header: 'Phone',
                accessorFn: (row) => row.phone ?? '—',
            },
            {
                id: 'email',
                header: 'Email',
                accessorFn: (row) => row.email ?? '—',
            },
            {
                id: 'gstin',
                header: 'GSTIN',
                accessorFn: (row) => row.gstin ?? '—',
            },
            {
                id: 'bills',
                header: 'Bills',
                accessorFn: (row) => row._count.bills,
            },
            {
                id: 'status',
                header: 'Status',
                accessorFn: (row) => (row.active ? 'Active' : 'Inactive'),
                cell: ({ row }) => (
                    <span
                        className={
                            row.original.active
                                ? "bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full text-xs"
                                : "bg-neutral-100 text-neutral-500 px-2 py-1 rounded-full text-xs"
                        }
                    >
                        {row.original.active ? "Active" : "Inactive"}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Button variant="link" onClick={() => openEditModal(row.original)}>
                            Edit
                        </Button>
                        <Button variant="link" onClick={() => handleDelete(row.original)}>
                            Delete
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <>
            <div className="mb-4 flex justify-end">
                <HeaderButton text="Customer" onClick={openCreateModal} />
            </div>

            <DataTable columns={columns} data={data} />

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
        </>
    );
}