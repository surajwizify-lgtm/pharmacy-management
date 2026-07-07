'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { product } from '@/types';

const EMPTY_BATCH = { batchNumber: '', expiryDate: '', purchasePrice: '', sellingPrice: '', quantityAvailable: '' };

export default function productDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canEdit = role === 'ADMIN' || role === 'PHARMACIST';

  const [product, setproduct] = useState<product | null>(null);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState(EMPTY_BATCH);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [location, setLocation] = useState('');

  async function load() {
    const data = await apiFetch<product>(`/api/products/${params.id}`);
    setproduct(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleAddBatch(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/batches', {
        method: 'POST',
        body: JSON.stringify({
          productId: Number(params.id),
          batchNumber: batchForm.batchNumber,
          expiryDate: batchForm.expiryDate,
          purchasePrice: Number(batchForm.purchasePrice),
          sellingPrice: Number(batchForm.sellingPrice),
          quantityAvailable: Number(batchForm.quantityAvailable),
          location: location || undefined,
        }),
      });
      setShowBatchForm(false);
      setBatchForm(EMPTY_BATCH);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function adjustStock(batchId: number, version: number, delta: number) {
    setAdjusting(batchId);
    try {
      await apiFetch(`/api/batches/${batchId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ quantityDelta: delta, version }),
      });
      load();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setAdjusting(null);
    }
  }

  if (!product) return <p className="text-slate-400">Loading…</p>;

  const totalStock = product.batches.reduce((s, b) => s + b.quantityAvailable, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/products" className="text-xs font-medium text-brand-600 hover:underline">
          ← Back to products
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{product.name}</h1>
            <p className="text-sm text-slate-500">
              {product.manufacturer} · HSN {product.hsnCode} · GST {product.gstPercentage}%
            </p>
          </div>
          <span className={`badge ${product.status === 'ACTIVE' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'}`}>
            {product.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="label mb-1">Total stock</p>
          <p className="text-xl font-semibold text-slate-900">{totalStock}</p>
        </div>
        <div className="card p-4">
          <p className="label mb-1">Batches</p>
          <p className="text-xl font-semibold text-slate-900">{product.batches.length}</p>
        </div>
        <div className="card p-4">
          <p className="label mb-1">Prescription</p>
          <p className="text-xl font-semibold text-slate-900">{product.prescriptionRequired ? 'Required' : 'Not required'}</p>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-slate-800">Batches (FIFO by expiry)</h2>
          {canEdit && (
            <button className="btn-primary text-sm" onClick={() => setShowBatchForm(true)}>
              + Add batch
            </button>
          )}
        </div>

        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Batch #</th>
              <th className="py-2">Expiry</th>
              <th className="py-2">Location</th>
              <th className="py-2">Purchase price</th>
              <th className="py-2">Selling price</th>
              <th className="py-2">Qty available</th>
              {canEdit && <th className="py-2">Adjust</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {product.batches.map((b) => (
              <tr key={b.id}>
                <td className="py-2">{b.batchNumber}</td>
                <td className="py-2">{new Date(b.expiryDate).toLocaleDateString()}</td>
                <td className="py-2">{(b.location) ? b.location : ""}</td>
                <td className="py-2">₹{b.purchasePrice}</td>
                <td className="py-2">₹{b.sellingPrice}</td>
                <td className="py-2">{b.quantityAvailable}</td>
                {canEdit && (
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-secondary px-2 py-1 text-xs"
                        disabled={adjusting === b.id}
                        onClick={() => adjustStock(b.id, b.version, -1)}
                      >
                        −1
                      </button>
                      <button
                        className="btn-secondary px-2 py-1 text-xs"
                        disabled={adjusting === b.id}
                        onClick={() => adjustStock(b.id, b.version, 1)}
                      >
                        +1
                      </button>
                      <button
                        className="btn-secondary px-2 py-1 text-xs"
                        disabled={adjusting === b.id}
                        onClick={() => {
                          const n = Number(prompt('Add/remove how many units? (negative to remove)', '0'));
                          if (!Number.isNaN(n) && n !== 0) adjustStock(b.id, b.version, n);
                        }}
                      >
                        Custom
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBatchForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Add batch</h2>
            <form onSubmit={handleAddBatch} className="space-y-3">
              <div>
                <label className="label">Batch number</label>
                <input
                  className="input"
                  required
                  value={batchForm.batchNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Expiry date</label>
                <input
                  className="input"
                  type="date"
                  required
                  value={batchForm.expiryDate}
                  onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Purchase price</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.purchasePrice}
                    onChange={(e) => setBatchForm({ ...batchForm, purchasePrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Location (optional)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. R3-S2"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Selling price</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.sellingPrice}
                    onChange={(e) => setBatchForm({ ...batchForm, sellingPrice: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Quantity available</label>
                <input
                  className="input"
                  type="number"
                  required
                  value={batchForm.quantityAvailable}
                  onChange={(e) => setBatchForm({ ...batchForm, quantityAvailable: e.target.value })}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowBatchForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
