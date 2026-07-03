'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { Medicine } from '@/types';

const EMPTY_FORM = {
  name: '',
  manufacturer: '',
  category: '',
  barcode: '',
  hsnCode: '',
  gstPercentage: '',
  prescriptionRequired: false,
};

export default function MedicinesPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canEdit = role === 'ADMIN' || role === 'PHARMACIST';

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await apiFetch<Medicine[]>(`/api/medicines${qs}`);
      setMedicines(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(m: Medicine) {
    setEditingId(m.id);
    setForm({
      name: m.name,
      manufacturer: m.manufacturer,
      category: m.category ?? '',
      barcode: m.barcode ?? '',
      hsnCode: m.hsnCode,
      gstPercentage: m.gstPercentage,
      prescriptionRequired: m.prescriptionRequired,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        manufacturer: form.manufacturer,
        category: form.category || undefined,
        barcode: form.barcode || undefined,
        hsnCode: form.hsnCode,
        gstPercentage: Number(form.gstPercentage),
        prescriptionRequired: form.prescriptionRequired,
      };
      if (editingId) {
        await apiFetch(`/api/medicines/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/api/medicines', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function discontinue(id: number) {
    if (!confirm('Mark this medicine as discontinued?')) return;
    await apiFetch(`/api/medicines/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Medicines</h1>
          <p className="text-sm text-slate-500">Catalog, GST slabs, and stock overview.</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={openCreate}>
            + Add medicine
          </button>
        )}
      </div>

      <input
        className="input max-w-sm"
        placeholder="Search by name, barcode, or HSN code…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Manufacturer</th>
              <th className="px-4 py-3">HSN</th>
              <th className="px-4 py-3">GST %</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : medicines.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No medicines found.
                </td>
              </tr>
            ) : (
              medicines.map((m) => {
                const stock = m.batches.reduce((s, b) => s + b.quantityAvailable, 0);
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/medicines/${m.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                        {m.name}
                      </Link>
                      {m.prescriptionRequired && (
                        <span className="badge ml-2 bg-purple-100 text-purple-700">Rx</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.manufacturer}</td>
                    <td className="px-4 py-3 text-slate-600">{m.hsnCode}</td>
                    <td className="px-4 py-3 text-slate-600">{m.gstPercentage}%</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${stock <= 20 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${m.status === 'ACTIVE' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'}`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <div className="flex justify-end gap-2">
                          <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => openEdit(m)}>
                            Edit
                          </button>
                          {m.status === 'ACTIVE' && role === 'ADMIN' && (
                            <button
                              className="text-xs font-medium text-red-600 hover:underline"
                              onClick={() => discontinue(m.id)}
                            >
                              Discontinue
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
          <div className="card w-full max-w-lg p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              {editingId ? 'Edit medicine' : 'Add medicine'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Name</label>
                  <input
                    className="input"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Manufacturer</label>
                  <input
                    className="input"
                    required
                    value={form.manufacturer}
                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Barcode</label>
                  <input
                    className="input"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">HSN code</label>
                  <input
                    className="input"
                    required
                    value={form.hsnCode}
                    onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">GST %</label>
                  <input
                    className="input"
                    required
                    type="number"
                    step="0.01"
                    min={0}
                    max={28}
                    value={form.gstPercentage}
                    onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })}
                  />
                </div>
                <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.prescriptionRequired}
                    onChange={(e) => setForm({ ...form, prescriptionRequired: e.target.checked })}
                  />
                  Prescription required
                </label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
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
