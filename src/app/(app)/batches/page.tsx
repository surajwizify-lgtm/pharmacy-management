'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import type { Batch } from '@/types';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';

// Extend the shared Batch type for this page
type BatchWithProduct = Batch & {
  product?: {
    name: string;
  } | null;
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function expiryTone(days: number) {
  if (days < 0) {
    return {
      badge: 'bg-danger-100 text-danger-700',
      dot: 'bg-danger-500',
    };
  }

  if (days <= 30) {
    return {
      badge: 'bg-danger-100 text-danger-700',
      dot: 'bg-danger-500',
    };
  }

  if (days <= 90) {
    return {
      badge: 'bg-amber-100 text-amber-700',
      dot: 'bg-warning-500',
    };
  }

  return {
    badge: 'bg-neutral-100 text-neutral-700',
    dot: 'bg-neutral-500',
  };
}

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <circle cx="9" cy="9" r="6" />
      <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg
      className="h-10 w-10 text-slate-300"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path d="M24 6l16 8v16l-16 8-16-8V14l16-8z" />
      <path d="M8 14l16 8 16-8M24 22v18" />
    </svg>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
      <h3 className={`mt-2 text-2xl font-bold ${color}`}>{value}</h3>
    </div>
  );
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyExpiring, setOnlyExpiring] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);

    try {
      const data = onlyExpiring
        ? await apiFetch<BatchWithProduct[]>(
          '/api/products/expiring-soon?days=90'
        )
        : await apiFetch<BatchWithProduct[]>('/api/batches');

      setBatches(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyExpiring]);
  const sorted = useMemo(
    () =>
      [...batches].sort((a, b) => {
        const nameCompare = (a.product?.name ?? '').localeCompare(b.product?.name ?? '');
        if (nameCompare !== 0) return nameCompare;
        return daysUntil(a.expiryDate) - daysUntil(b.expiryDate);
      }),
    [batches]
  );


  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;

    const q = search.toLowerCase();

    return sorted.filter(
      (b) =>
        (b.product?.name ?? '').toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q)
    );
  }, [sorted, search]);

  const stats = useMemo(() => {
    const expired = batches.filter((b) => daysUntil(b.expiryDate) < 0).length;

    const critical = batches.filter((b) => {
      const d = daysUntil(b.expiryDate);
      return d >= 0 && d <= 30;
    }).length;

    const warning = batches.filter((b) => {
      const d = daysUntil(b.expiryDate);
      return d > 30 && d <= 90;
    }).length;

    const units = batches.reduce(
      (sum, batch) => sum + batch.quantityAvailable,
      0
    );

    return {
      expired,
      critical,
      warning,
      units,
    };
  }, [batches]);

  return (
    <div className="space-y-6">
      <PageHeader
        header={`Batches & Stock`}
        subheader="Monitor inventory batches, expiry dates and maintain FIFO stock
          movement."
      >
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Expired"
          value={stats.expired}
          color="text-danger-600"
        />

        <StatCard
          title="≤30 Days"
          value={stats.critical}
          color="text-danger-600"
        />

        <StatCard
          title="31-90 Days"
          value={stats.warning}
          color="text-warning-600"
        />

        <StatCard
          title="Units"
          value={stats.units}
          color="text-primary-600"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or batch..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="absolute left-3 top-3 text-slate-400">
            <SearchIcon />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={onlyExpiring}
            onChange={(e) => setOnlyExpiring(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Show only batches expiring within 90 days
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Batch</th>
              <th className="px-5 py-4">Expiry</th>
              <th className="px-5 py-4">Quantity</th>
              <th className="px-5 py-4">Selling Price</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16">
                  <div className="flex flex-col items-center gap-3">
                    <EmptyIcon />
                    <p className="font-medium text-slate-600">
                      No batches found
                    </p>
                    <p className="text-sm text-slate-400">
                      Try changing your filters or search.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((batch) => {
                const d = daysUntil(batch.expiryDate);
                const tone = expiryTone(d);

                return (
                  <tr
                    key={batch.id}
                    className="transition hover:bg-brand-50/30"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/products/${batch.productId}`}
                        className="font-semibold text-slate-800 transition hover:text-brand-600"
                      >
                        {batch.product?.name ??
                          `Product #${batch.productId}`}
                      </Link>
                    </td>

                    <td className="px-5 py-4 font-mono text-sm text-slate-600">
                      {batch.batchNumber}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${tone.dot}`}
                        />

                        {new Date(batch.expiryDate).toLocaleDateString()}

                        {d < 0
                          ? `(Expired ${Math.abs(d)}d ago)`
                          : `(${d}d left)`}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {batch.quantityAvailable}
                    </td>

                    <td className="px-5 py-4 font-semibold text-brand-700">
                      ₹{batch.sellingPrice}
                    </td>
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