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
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [gstin, setGstin] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

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

    function openCreate() {
        setMode('create');
        setEditingId(null);
        setName('');
        setAddress('');
        setPhone('');
        setGstin('');
        setFormError(null);
        setShowModal(true);
    }

    function openEdit(h: Hospital) {
        setMode('edit');
        setEditingId(h.id);
        setName(h.name);
        setAddress(h.address ?? '');
        setPhone(h.phone ?? '');
        setGstin(h.gstin ?? '');
        setFormError(null);
        setShowModal(true);
    }

    function closeModal() {
        if (submitting) return;
        setShowModal(false);
    }

    async function submitForm() {
        if (!name.trim()) {
            setFormError('Hospital name is required.');
            return;
        }
        setSubmitting(true);
        setFormError(null);
        try {
            const payload = {
                name: name.trim(),
                address: address || undefined,
                phone: phone || undefined,
                gstin: gstin || undefined,
            };
            if (mode === 'create') {
                await apiFetch<Hospital>('/api/hospitals', { method: 'POST', body: JSON.stringify(payload) });
            } else {
                await apiFetch<Hospital>(`/api/hospitals/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
            }
            setShowModal(false);
            loadHospitals();
        } catch (err) {
            setFormError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
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

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Hospitals</h1>
                    <p className="text-sm text-slate-500">Manage referring hospitals used across bills.</p>
                </div>
                <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Hospital
                </button>
            </div>

            <div className="card overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
                    <h2 className="flex items-center gap-2 font-medium text-slate-800">
                        <Building2 className="h-4 w-4 text-brand-600" />
                        All Hospitals
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{filtered.length}</span>
                    </h2>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            className="input w-56 pl-8 text-sm"
                            placeholder="Search name, address, GSTIN…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {listError && <p className="px-4 pt-3 text-sm text-red-600">{listError}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Address</th>
                                <th className="p-3 text-left">Phone</th>
                                <th className="p-3 text-left">GSTIN</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-3" colSpan={5}>
                                            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Building2 className="mb-2 h-8 w-8" />
                                            <p className="text-sm">No hospitals found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((h) => (
                                    <tr key={h.id} className="group transition-colors hover:bg-slate-50/70">
                                        <td className="p-3 font-medium text-slate-800">{h.name}</td>
                                        <td className="p-3 text-slate-500">
                                            {h.address ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5" /> {h.address}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="p-3 text-slate-600">
                                            {h.phone ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Phone className="h-3.5 w-3.5" /> {h.phone}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="p-3 text-slate-600">
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
                                                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="Delete"
                                                    disabled={deletingId === h.id}
                                                    onClick={() => deleteHospital(h.id, h.name)}
                                                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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

            {showModal && <CreateHospital onClose={closeModal} />}
        </div>
    );
}
