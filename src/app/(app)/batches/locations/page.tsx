"use client";

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
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Locations</h1>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                >
                    + Create Location
                </button>
            </div>

            {loading && <p className="text-gray-500 text-sm">Loading locations...</p>}
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            {!loading && !error && (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 text-left">
                            <tr>
                                <th className="px-4 py-2 font-medium">Name</th>
                                <th className="px-4 py-2 font-medium">Code</th>
                                <th className="px-4 py-2 font-medium">Type</th>
                                <th className="px-4 py-2 font-medium">Batches</th>
                                <th className="px-4 py-2 font-medium">Status</th>
                                <th className="px-4 py-2 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {locations.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                                        No locations yet.
                                    </td>
                                </tr>
                            )}
                            {locations.map((loc) => (
                                <tr key={loc.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-900">
                                        {loc.name}
                                        {loc.description && (
                                            <div className="text-xs text-gray-400">{loc.description}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">{loc.code || "—"}</td>
                                    <td className="px-4 py-2 text-gray-600">{loc.type}</td>
                                    <td className="px-4 py-2 text-gray-600">{loc._count.batches}</td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${loc.active
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                                }`}
                                        >
                                            {loc.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right space-x-3">
                                        <button
                                            onClick={() => openEditModal(loc)}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(loc)}
                                            className="text-red-600 hover:underline text-sm"
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
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            {editingId ? "Edit Location" : "Create Location"}
                        </h2>

                        {formError && <p className="text-red-600 text-sm mb-3">{formError}</p>}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                    placeholder="e.g. Rack A1"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Code
                                </label>
                                <input
                                    type="text"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                    placeholder="e.g. A1-03"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Type
                                </label>
                                <select
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm({ ...form, type: e.target.value as LocationType })
                                    }
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                >
                                    {LOCATION_TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                    rows={2}
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                />
                                Active
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-sm rounded-md border text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
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