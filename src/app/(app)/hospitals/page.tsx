'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { Hospital } from '@/types';
import { Building2, Plus, X, Search, Pencil, Trash2, Phone, MapPin, Receipt } from 'lucide-react';
import CreateHospital from '@/components/hospitals/CreateHospital';

type ModalMode = 'create' | 'edit';

export default function HospitalsPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [mode, setMode] = useState<ModalMode>('create');
    const [editingId, setEditingId] = useState<number | null>(null);

    function openCreate() {
        setMode('create');
        setEditingId(null);
        setShowModal(true);
    }

    async function loadHospitals() {
        setLoading(true);
        setListError(null);
        try {
            setHospitals(await apiFetch<Hospital[]>('/api/hospitals'));
        } catch (err) {
            setListError(err instanceof ApiClientError ? err.message : 'Could not load hospitals');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadHospitals();
    }, []);

    function openEdit(h: Hospital) {
        setMode('edit');
        setEditingId(h.id);
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
    }

    async function deleteHospital(id: number, hospitalName: string) {
        if (!confirm(`Delete ${hospitalName}? This cannot be undone.`)) return;
        setDeletingId(id);
        setListError(null);
        try {
            await apiFetch(`/api/hospitals/${id}`, { method: 'DELETE' });
            setHospitals((prev) => prev.filter((h) => h.id !== id));
        } catch (err) {
            setListError(err instanceof ApiClientError ? err.message : 'Could not delete hospital');
        } finally {
            setDeletingId(null);
        }
    }

    const filtered = hospitals.filter((h) => {
        const q = search.toLowerCase();
        return (
            !q ||
            h.name.toLowerCase().includes(q) ||
            (h.address ?? '').toLowerCase().includes(q) ||
            (h.gstin ?? '').toLowerCase().includes(q)
        );
    });
    const editingHospital =
        mode === 'edit'
            ? hospitals.find((h) => h.id === editingId)
            : undefined;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900">Hospitals</h1>
                    <p className="text-sm text-neutral-500">Manage referring hospitals used across bills.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
                >
                    <Plus className="h-4 w-4" />
                    Add Hospital
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-100 p-4">
                    <h2 className="flex items-center gap-2 font-medium text-neutral-800">
                        <Building2 className="h-4 w-4 text-primary-600" />
                        All Hospitals
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">{filtered.length}</span>
                    </h2>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                        <input
                            className="w-56 rounded-lg border border-neutral-300 bg-white py-1.5 pl-8 pr-3 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            placeholder="Search name, address, GSTIN…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {listError && (
                    <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
                        <span className="text-sm font-medium text-danger-700">{listError}</span>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                            <tr>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Address</th>
                                <th className="p-3 text-left">Phone</th>
                                <th className="p-3 text-left">GSTIN</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-3" colSpan={5}>
                                            <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10">
                                        <div className="flex flex-col items-center justify-center text-neutral-400">
                                            <Building2 className="mb-2 h-8 w-8" />
                                            <p className="text-sm">No hospitals found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((h) => (
                                    <tr key={h.id} className="group transition-colors hover:bg-neutral-50/70">
                                        <td className="p-3 font-medium text-neutral-800">{h.name}</td>
                                        <td className="p-3 text-neutral-500">
                                            {h.address ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5" /> {h.address}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="p-3 text-neutral-600">
                                            {h.phone ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Phone className="h-3.5 w-3.5" /> {h.phone}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="p-3 text-neutral-600">
                                            {h.gstin ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Receipt className="h-3.5 w-3.5" /> {h.gstin}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                                                <button
                                                    title="Edit"
                                                    onClick={() => openEdit(h)}
                                                    className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="Delete"
                                                    disabled={deletingId === h.id}
                                                    onClick={() => deleteHospital(h.id, h.name)}
                                                    className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <CreateHospital
                    onClose={closeModal}
                    hospital={editingHospital}
                    onCreated={() => {
                        loadHospitals();
                    }}
                />
            )}
        </div>
    );
}