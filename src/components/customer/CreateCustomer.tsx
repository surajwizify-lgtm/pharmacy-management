// src/components/customer/CreateCustomer.tsx
"use client";

import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";

interface CreateCustomerProps {
    onClose: () => void;
    initialName?: string;
}

export default function CreateCustomer({ onClose, initialName = "" }: CreateCustomerProps) {
    const [name, setName] = useState(initialName);
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [gstin, setGstin] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        if (!name.trim()) {
            setError("Name is required");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await apiFetch("/api/customers", {
                method: "POST",
                body: JSON.stringify({ name, phone, email, address, gstin }),
            });
            onClose();
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : "Failed to create customer");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-1.5 text-base font-semibold text-neutral-800">
                        <UserPlus className="h-4 w-4" /> New customer
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {error && (
                    <div className="mb-3 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-700">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <Input label="Name" id="custName" value={name} onChange={(e) => setName(e.target.value)} />
                    <Input label="Phone" id="custPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    <Input label="Email" id="custEmail" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Input label="Address" id="custAddress" value={address} onChange={(e) => setAddress(e.target.value)} />
                    <Input label="GSTIN" id="custGstin" value={gstin} onChange={(e) => setGstin(e.target.value)} />
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                    >
                        Cancel
                    </button>
                    <Button variant="success" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Saving…" : "Create"}
                    </Button>
                </div>
            </div>
        </div>
    );
}