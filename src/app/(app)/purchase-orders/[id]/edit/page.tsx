'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';

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

    if (loading) return <p className="text-slate-400">Loading…</p>;

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div>
                <Link href={`/purchase-orders/${id}`} className="text-xs font-medium text-brand-600 hover:underline">
                    ← Back to purchase order
                </Link>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">Edit Purchase Order</h1>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="card space-y-4 p-5">
                <div>
                    <label className="label">PO Number</label>
                    <input
                        className="input"
                        required
                        value={form.poNumber}
                        onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                    />
                </div>
                <div>
                    <label className="label">Expected Date</label>
                    <input
                        type="date"
                        className="input"
                        value={form.expectedDate}
                        onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                    />
                </div>
                <div>
                    <label className="label">Status</label>
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

                <div className="flex justify-end gap-2 pt-2">
                    <Link href={`/purchase-orders/${id}`} className="btn-secondary">Cancel</Link>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}