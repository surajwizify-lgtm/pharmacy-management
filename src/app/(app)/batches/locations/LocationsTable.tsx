// app/locations/LocationsTable.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import HeaderButton from '@/components/common/HeaderButton';

type LocationType = "RACK" | "SHELF" | "BIN" | "COLD_STORAGE" | "WAREHOUSE" | "OTHER";

export type Location = {
    id: number;
    name: string;
    code: string | null;
    type: LocationType;
    description: string | null;
    active: boolean;
    _count: { batches: number };
};

const LOCATION_TYPES: LocationType[] = ["RACK", "SHELF", "BIN", "COLD_STORAGE", "WAREHOUSE", "OTHER"];

const emptyForm = {
    name: "",
    code: "",
    type: "RACK" as LocationType,
    description: "",
    active: true,
};

const inputClass =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";
const labelClass = "mb-1 block text-xs font-medium text-neutral-600";

export default function LocationsTable({ data }: { data: Location[] }) {
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

    function openEditModal(loc: Location) {
        setEditingId(loc.id);
        setForm({
            name: loc.name,
            code: loc.code ?? "",
            type: loc.type,
            description: loc.description ?? "",
            active: loc.active,
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

        const url = editingId ? `/api/locations/${editingId}` : "/api/locations";
        const method = editingId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || "Failed to save location");

            setModalOpen(false);
            router.refresh();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(loc: Location) {
        if (!confirm(`Delete location "${loc.name}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/locations/${loc.id}`, { method: "DELETE" });
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || "Failed to delete location");
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        }
    }

    const columns: ColumnDef<Location>[] = useMemo(
        () => [
            {
                id: 'name',
                header: 'Name',
                accessorKey: 'name',
                cell: ({ row }) => (
                    <div>
                        {row.original.name}
                        {row.original.description && (
                            <div className="text-xs text-neutral-500">{row.original.description}</div>
                        )}
                    </div>
                ),
            },
            {
                id: 'code',
                header: 'Code',
                accessorFn: (row) => row.code ?? '—',
            },
            {
                header: 'Type',
                accessorKey: 'type',
            },
            {
                id: 'batches',
                header: 'Batches',
                accessorFn: (row) => row._count.batches,
            },
            {
                id: 'status',
                header: 'Status',
                accessorFn: (row) => (row.active ? 'Active' : 'Inactive'),
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className="flex justify-center gap-2">
                        <Button variant="outline" onClick={() => openEditModal(row.original)}>
                            Edit
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(row.original)}>
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
                <HeaderButton text="Add Location" onClick={openCreateModal} />
            </div>

            <DataTable columns={columns} data={data} />

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="mb-4 text-lg font-semibold text-neutral-800">
                            {editingId ? "Edit Location" : "Create Location"}
                        </h2>

                        {formError && (
                            <div className="mb-3 flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2">
                                <span className="text-sm font-medium text-danger-700">{formError}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className={labelClass}>Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className={inputClass}
                                    placeholder="e.g. Rack A1"
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Code</label>
                                <input
                                    type="text"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    className={inputClass}
                                    placeholder="e.g. A1-03"
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Type</label>
                                <select
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm({ ...form, type: e.target.value as LocationType })
                                    }
                                    className={inputClass}
                                >
                                    {LOCATION_TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className={inputClass}
                                    rows={2}
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-neutral-700">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                    className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                />
                                Active
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
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