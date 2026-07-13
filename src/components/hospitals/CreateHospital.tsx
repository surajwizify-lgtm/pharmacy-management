import { ApiClientError, apiFetch } from '@/lib/api-client';
import { Building2, MapPin, Phone, X } from 'lucide-react';
import React, { useState } from 'react'
import Button from '../Button';
import Input from '../Input';

interface HospitalOption {
    id: number;
    name: string;
    address?: string | null;
    phone?: string | null;
}
type props = {
    onClose: () => void;
    onCreated?: (hospital: HospitalOption) => void;
}

export default function CreateHospital({ onClose, onCreated }: props) {
    const [newHospitalName, setNewHospitalName] = useState('');
    const [newHospitalAddress, setNewHospitalAddress] = useState('');
    const [newHospitalPhone, setNewHospitalPhone] = useState('');
    const [creatingHospital, setCreatingHospital] = useState(false);
    const [createHospitalError, setCreateHospitalError] = useState<string | null>(null);

    async function submitCreateHospital() {
        if (!newHospitalName.trim()) {
            setCreateHospitalError('Hospital name is required.');
            return;
        }
        setCreatingHospital(true);
        setCreateHospitalError(null);
        try {
            const created = await apiFetch<HospitalOption>('/api/hospitals', {
                method: 'POST',
                body: JSON.stringify({
                    name: newHospitalName.trim(),
                    address: newHospitalAddress || undefined,
                    phone: newHospitalPhone || undefined,
                }),
            });
            onCreated?.(created);
            onClose();
        } catch (err) {
            setCreateHospitalError(err instanceof ApiClientError ? err.message : 'Could not create hospital');
        } finally {
            setCreatingHospital(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm"
            onClick={() => !creatingHospital && onClose()}
        >
            <div
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between bg-gradient-to-r from-primary-700 to-indigo-700 px-5 py-3.5 text-white">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-overlay-white">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold">New Hospital</h3>
                    </div>
                    <button
                        onClick={() => !creatingHospital && onClose()}
                        className="rounded-full p-1.5 transition-colors hover:bg-overlay-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-3 p-5">
                    <div>
                        <label className="label">Hospital name *</label>
                        <Input
                            className="input"
                            value={newHospitalName}
                            onChange={(e) => setNewHospitalName(e.target.value)}
                            placeholder="e.g. City Care Hospital"
                            // autoFocus
                            id=''
                            label=''
                        />
                    </div>
                    <div>
                        <label className="label !flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-neutral-400" /> Address
                        </label>
                        <Input
                            className="input"
                            value={newHospitalAddress}
                            onChange={(e) => setNewHospitalAddress(e.target.value)}
                            placeholder="Street, city"
                            id=''
                            label=''
                        />
                    </div>
                    <div>
                        <label className="label !flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-neutral-400" /> Phone
                        </label>
                        <Input
                            className="input"
                            value={newHospitalPhone}
                            onChange={(e) => setNewHospitalPhone(e.target.value)}
                            placeholder="10-digit mobile number"
                            id=''
                            label=''
                        />
                    </div>

                    {createHospitalError && (
                        <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">
                            {createHospitalError}
                        </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            variant='secondary'
                            className="flex-1 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={onClose}
                            disabled={creatingHospital}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='success'
                            className="btn-primary flex-1 justify-center"
                            onClick={submitCreateHospital}
                            disabled={creatingHospital}
                        >
                            {creatingHospital ? 'Saving…' : 'Save hospital'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}