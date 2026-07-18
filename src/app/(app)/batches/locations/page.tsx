"use client";

import PageHeader from "@/components/common/Header";
import HeaderButton from "@/components/common/HeaderButton";
import { useEffect, useState, useCallback } from "react";

type LocationType = "RACK" | "SHELF" | "BIN" | "COLD_STORAGE" | "WAREHOUSE" | "OTHER";

type Location = {
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

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/locations");
            if (!res.ok) throw new Error("Failed to load locations");
            setLocations(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

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
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save location");

            setModalOpen(false);
            fetchLocations();
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
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete location");
            fetchLocations();
        } catch (err: any) {
            alert(err.message);
        }
    }

    return (
        <div className="">

            <PageHeader
                header={`Locations`}
                subheader="Add rack, shelves, coldstorage"
            >
                <HeaderButton text="Add Location" onClick={openCreateModal} />
            </PageHeader>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-300" />
                    Loading locations...
                </div>
            )}
            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
                    <span className="text-sm font-medium text-danger-700">{error}</span>
                </div>
            )}

            {!loading && !error && (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-neutral-600">
                            <tr>
                                <th className="px-4 py-2 font-medium">Name</th>
                                <th className="px-4 py-2 font-medium">Code</th>
                                <th className="px-4 py-2 font-medium">Type</th>
                                <th className="px-4 py-2 font-medium">Batches</th>
                                <th className="px-4 py-2 font-medium">Status</th>
                                <th className="px-4 py-2 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {locations.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                                        No locations yet.
                                    </td>
                                </tr>
                            )}
                            {locations.map((loc) => (
                                <tr key={loc.id} className="hover:bg-neutral-50">
                                    <td className="px-4 py-2 font-medium text-neutral-900">
                                        {loc.name}
                                        {loc.description && (
                                            <div className="text-xs text-neutral-400">{loc.description}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-neutral-600">{loc.code || "—"}</td>
                                    <td className="px-4 py-2 text-neutral-600">{loc.type}</td>
                                    <td className="px-4 py-2 text-neutral-600">{loc._count.batches}</td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${loc.active
                                                ? "bg-secondary-100 text-secondary-700"
                                                : "bg-neutral-100 text-neutral-500"
                                                }`}
                                        >
                                            {loc.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right space-x-3">
                                        <button
                                            onClick={() => openEditModal(loc)}
                                            className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(loc)}
                                            className="text-sm text-danger-600 hover:text-danger-700 hover:underline"
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
                                <label className={labelClass}>
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className={inputClass}
                                    placeholder="e.g. Rack A1"
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Code
                                </label>
                                <input
                                    type="text"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    className={inputClass}
                                    placeholder="e.g. A1-03"
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Type
                                </label>
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
                                <label className={labelClass}>
                                    Description
                                </label>
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
        </div>
    );
}