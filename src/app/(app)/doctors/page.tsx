'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { Doctor } from '@/types';
import { Stethoscope, Plus, X, Search, Pencil, Trash2, Phone, BadgeCheck } from 'lucide-react';
import CreateHospital from '@/components/hospitals/CreateHospital';
import CreateDoctor from '@/components/doctor/CreateDoctor';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

type ModalMode = 'create' | 'edit';

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [mode, setMode] = useState<ModalMode>('create');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [registrationNo, setRegistrationNo] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    async function loadDoctors() {
        setLoading(true);
        setListError(null);
        try {
            setDoctors(await apiFetch<Doctor[]>('/api/doctors'));
        } catch (err) {
            setListError(err instanceof ApiClientError ? err.message : 'Could not load doctors');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDoctors();
    }, []);

    function openCreate() {
        setMode('create');
        setEditingId(null);
        setName('');
        setRegistrationNo('');
        setSpecialization('');
        setPhone('');
        setFormError(null);
        setShowModal(true);
    }

    function openEdit(d: Doctor) {
        setMode('edit');
        setEditingId(d.id);
        setName(d.name);
        setRegistrationNo(d.registrationNo ?? '');
        setSpecialization(d.specialization ?? '');
        setPhone(d.phone ?? '');
        setFormError(null);
        setShowModal(true);
    }

    function closeModal() {
        if (submitting) return;
        setShowModal(false);
    }

    async function submitForm() {
        if (!name.trim()) {
            setFormError('Doctor name is required.');
            return;
        }
        setSubmitting(true);
        setFormError(null);
        try {
            const payload = {
                name: name.trim(),
                registrationNo: registrationNo || undefined,
                specialization: specialization || undefined,
                phone: phone || undefined,
            };
            if (mode === 'create') {
                await apiFetch<Doctor>('/api/doctors', { method: 'POST', body: JSON.stringify(payload) });
            } else {
                await apiFetch<Doctor>(`/api/doctors/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
            }
            setShowModal(false);
            loadDoctors();
        } catch (err) {
            setFormError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    }

    async function deleteDoctor(id: number, doctorName: string) {
        if (!confirm(`Delete Dr. ${doctorName}? This cannot be undone.`)) return;
        setDeletingId(id);
        setListError(null);
        try {
            await apiFetch(`/api/doctors/${id}`, { method: 'DELETE' });
            setDoctors((prev) => prev.filter((d) => d.id !== id));
        } catch (err) {
            setListError(err instanceof ApiClientError ? err.message : 'Could not delete doctor');
        } finally {
            setDeletingId(null);
        }
    }

    const filtered = doctors.filter((d) => {
        const q = search.toLowerCase();
        return (
            !q ||
            d.name.toLowerCase().includes(q) ||
            (d.specialization ?? '').toLowerCase().includes(q) ||
            (d.registrationNo ?? '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6">
            <PageHeader
                header={`Doctors`}
                subheader="Manage referring doctors used across bills."
            >
                <HeaderButton text="New Return" onClick={openCreate} />
            </PageHeader>
            <Container>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 p-4">
                        <h2 className="flex items-center gap-2 font-medium text-neutral-800">
                            <Stethoscope className="h-4 w-4 text-primary-600" />
                            All Doctors
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">{filtered.length}</span>
                        </h2>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                            <input
                                className="w-56 rounded-lg border border-neutral-300 bg-white py-1.5 pl-8 pr-3 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                placeholder="Search name, specialization…"
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Registration No</TableHead>
                                    <TableHead>Specialization</TableHead>
                                    <TableHead>Phone</TableHead>
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
                                                <Stethoscope className="h-8 w-8" />
                                                <p>No doctors found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((d) => (
                                        <TableRow key={d.id}>
                                            <TableCell>
                                                Dr. {d.name}
                                            </TableCell>

                                            <TableCell>
                                                {d.registrationNo ? (
                                                    <div className="flex items-center gap-1">
                                                        <BadgeCheck className="h-4 w-4" />
                                                        {d.registrationNo}
                                                    </div>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {d.specialization || "—"}
                                            </TableCell>

                                            <TableCell>
                                                {d.phone ? (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-4 w-4" />
                                                        {d.phone}
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
                                                        onClick={() => openEdit(d)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Delete"
                                                        disabled={deletingId === d.id}
                                                        onClick={() => deleteDoctor(d.id, d.name)}
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
            </Container>

            {showModal && (
                <CreateDoctor
                    onClose={closeModal}
                    doctor={
                        mode === 'edit'
                            ? doctors.find((d) => d.id === editingId)
                            : undefined
                    }
                    onCreated={loadDoctors}
                />
            )}
        </div>
    );
}