'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ArrowLeft, ClipboardEdit, Hash, CalendarClock, Flag } from 'lucide-react';

export default function EditPurchaseOrderPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [form, setForm] = useState({ poNumber: '', expectedDate: '', status: 'PENDING' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        apiFetch<any>(`/api/purchase-orders/${id}`)
            .then((po) => {
                setForm({
                    poNumber: po.poNumber,
                    expectedDate: po.expectedDate ? po.expectedDate.slice(0, 10) : '',
                    status: po.status,
                });
            })
            .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Something went wrong'))
            .finally(() => setLoading(false));
    }, [id]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!form.poNumber.trim()) {
            setError('PO number is required');
            return;
        }

        setSaving(true);
        try {
            await apiFetch(`/api/purchase-orders/${id}`, {
                method: 'PUT',
                body: JSON.stringify(form),
            });
            router.push(`/purchase-orders/${id}`);
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-xl space-y-6">
                <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
                <div className="card h-72 animate-pulse p-5" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div>
                <Link
                    href={`/purchase-orders/${id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to purchase order
                </Link>
                <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
                    <ClipboardEdit className="h-6 w-6 text-brand-600" />
                    Edit Purchase Order
                </h1>
                <p className="text-sm text-slate-500">Update PO number, expected date, or status.</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="card space-y-4 p-6">
                <div>
                    <label className="label !flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" /> PO number
                    </label>
                    <input
                        className="input"
                        required
                        value={form.poNumber}
                        onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                    />
                </div>
                <div>
                    <label className="label !flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5" /> Expected date
                    </label>
                    <input
                        type="date"
                        className="input"
                        value={form.expectedDate}
                        onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                    />
                </div>
                <div>
                    <label className="label !flex items-center gap-1.5">
                        <Flag className="h-3.5 w-3.5" /> Status
                    </label>
                    <select
                        className="input"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="RECEIVED">Received</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <Link
                        href={`/purchase-orders/${id}`}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </Link>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}