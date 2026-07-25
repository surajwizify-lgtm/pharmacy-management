'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { Hospital } from '@/types';
import { Building2, Plus, X, Search, Pencil, Trash2, Phone, MapPin, Receipt } from 'lucide-react';
import CreateHospital from '@/components/hospitals/CreateHospital';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';

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
        <div className="">
            <PageHeader
                header={`Hospitals`}
                subheader="Manage referring hospitals used across bills."
            >
                <HeaderButton text="Add Hospital" onClick={openCreate} />
            </PageHeader>

            <Container>
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
                        <Table className="table-fixed">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>GSTIN</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5}>
                                                <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <div className="flex flex-col items-center justify-center">
                                                <Building2 className="h-8 w-8" />
                                                <p>No hospitals found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((h) => (
                                        <TableRow key={h.id}>
                                            <TableCell>
                                                {h.name}
                                            </TableCell>

                                            <TableCell>
                                                {h.address ? (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {h.address}
                                                    </div>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {h.phone ? (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-4 w-4" />
                                                        {h.phone}
                                                    </div>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {h.gstin ? (
                                                    <div className="flex items-center gap-1">
                                                        <Receipt className="h-4 w-4" />
                                                        {h.gstin}
                                                    </div>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Edit"
                                                        onClick={() => openEdit(h)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Delete"
                                                        disabled={deletingId === h.id}
                                                        onClick={() => deleteHospital(h.id, h.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </Container >

            {showModal && (
                <CreateHospital
                    onClose={closeModal}
                    hospital={editingHospital}
                    onCreated={() => {
                        loadHospitals();
                    }}
                />
            )
            }
        </div >
    );
}