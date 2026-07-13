import { ApiClientError, apiFetch } from '@/lib/api-client';
import { Phone, Stethoscope, X } from 'lucide-react';
import React, { useState } from 'react'
import Input from '../Input';
import Button from '../Button';

type props = {
    onClose: () => void;
    onCreated?: (doctor: DoctorOption) => void;
}

interface DoctorOption {
    id: number;
    name: string;
    specialization?: string | null;
    phone?: string | null;
}

export default function CreateDoctor({ onClose, onCreated }: props) {
    const [newDoctorName, setNewDoctorName] = useState('');
    const [newDoctorSpecialization, setNewDoctorSpecialization] = useState('');
    const [newDoctorPhone, setNewDoctorPhone] = useState('');
    const [creatingDoctor, setCreatingDoctor] = useState(false);
    const [createDoctorError, setCreateDoctorError] = useState<string | null>(null);

    async function submitCreateDoctor() {
        if (!newDoctorName.trim()) {
            setCreateDoctorError('Doctor name is required.');
            return;
        }
        setCreatingDoctor(true);
        setCreateDoctorError(null);
        try {
            const created = await apiFetch<DoctorOption>('/api/doctors', {
                method: 'POST',
                body: JSON.stringify({
                    name: newDoctorName.trim(),
                    specialization: newDoctorSpecialization || undefined,
                    phone: newDoctorPhone || undefined,
                }),
            });
            onCreated?.(created);
            onClose();
        } catch (err) {
            setCreateDoctorError(err instanceof ApiClientError ? err.message : 'Could not create doctor');
        } finally {
            setCreatingDoctor(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm"
            onClick={() => !creatingDoctor && onClose()}
        >
            <div
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between bg-gradient-to-r from-primary-700 to-indigo-700 px-5 py-3.5 text-white">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-overlay-white">
                            <Stethoscope className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold">New Doctor</h3>
                    </div>
                    <button
                        onClick={() => !creatingDoctor && onClose()}
                        className="rounded-full p-1.5 transition-colors hover:bg-overlay-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-3 p-5">
                    <div>
                        <label className="label">Doctor name *</label>
                        <Input
                            id=''
                            label=''
                            className="Input"
                            value={newDoctorName}
                            onChange={(e) => setNewDoctorName(e.target.value)}
                            placeholder="e.g. Dr. Anjali Sharma"
                        // autoFocus
                        />
                    </div>
                    <div>
                        <label className="label">Specialization</label>
                        <Input
                            id=''
                            label=''
                            className="Input"
                            placeholder="e.g. General Physician"
                            value={newDoctorSpecialization}
                            onChange={(e) => setNewDoctorSpecialization(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label !flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-neutral-400" /> Phone
                        </label>
                        <Input
                            id=''
                            label=''
                            className="Input"
                            value={newDoctorPhone}
                            onChange={(e) => setNewDoctorPhone(e.target.value)}
                            placeholder="10-digit mobile number"
                        />
                    </div>

                    {createDoctorError && (
                        <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">
                            {createDoctorError}
                        </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            variant='secondary'
                            className="flex-1 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={onClose}
                            disabled={creatingDoctor}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='success'
                            className="btn-primary flex-1 justify-center"
                            onClick={submitCreateDoctor}
                            disabled={creatingDoctor}
                        >
                            {creatingDoctor ? 'Saving…' : 'Save doctor'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}