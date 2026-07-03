'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import type { Batch } from '@/types';

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyExpiring, setOnlyExpiring] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = onlyExpiring
        ? await apiFetch<Batch[]>('/api/medicines/expiring-soon?days=90')
        : await apiFetch<Batch[]>('/api/batches');
      setBatches(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyExpiring]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Batches &amp; Stock</h1>
          <p className="text-sm text-slate-500">Every batch across the catalog, ordered by expiry (FIFO).</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={onlyExpiring} onChange={(e) => setOnlyExpiring(e.target.checked)} />
          Expiring within 90 days
        </label>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Medicine</th>
              <th className="px-4 py-3">Batch #</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Qty available</th>
              <th className="px-4 py-3">Selling price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No batches found.
                </td>
              </tr>
            ) : (
              batches.map((b) => {
                const d = daysUntil(b.expiryDate);
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/medicines/${b.medicineId}`} className="font-medium text-slate-800 hover:text-brand-600">
                        {b.medicine?.name ?? `Medicine #${b.medicineId}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.batchNumber}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${d <= 30 ? 'bg-red-100 text-red-700' : d <= 90 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {new Date(b.expiryDate).toLocaleDateString()} ({d}d)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.quantityAvailable}</td>
                    <td className="px-4 py-3 text-slate-600">₹{b.sellingPrice}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
