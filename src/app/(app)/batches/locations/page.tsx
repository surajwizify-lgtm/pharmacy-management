"use client";

import Container from "@/components/common/Container";
import PageHeader from "@/components/common/Header";
import HeaderButton from "@/components/common/HeaderButton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
            <Container>

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
                    <Table className="w-full table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[20%]">Name</TableHead>
                                <TableHead className="w-[10%]">Code</TableHead>
                                <TableHead className="w-[15%]">Type</TableHead>
                                <TableHead className="w-[10%]">Batches</TableHead>
                                <TableHead className="w-[10%]">Status</TableHead>
                                <TableHead className="w-[20%] text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {locations.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        No locations yet.
                                    </TableCell>
                                </TableRow>
                            )}

                            {locations.map((loc) => (
                                <TableRow key={loc.id}>
                                    <TableCell>
                                        {loc.name}
                                        {loc.description && (
                                            <div>{loc.description}</div>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {loc.code || "—"}
                                    </TableCell>

                                    <TableCell>
                                        {loc.type}
                                    </TableCell>

                                    <TableCell>
                                        {loc._count.batches}
                                    </TableCell>

                                    <TableCell>
                                        <span>
                                            {loc.active ? "Active" : "Inactive"}
                                        </span>
                                    </TableCell>

                                    <TableCell className="gap-2 flex justify-center">
                                        <Button
                                            variant="outline"
                                            onClick={() => openEditModal(loc)}
                                        >
                                            Edit
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            onClick={() => handleDelete(loc)}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Container>

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