'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import type { Batch } from '@/types';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

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
    <div className="">
      <PageHeader
        header={`Batches & Stock`}
        subheader="Monitor inventory batches, expiry dates and maintain FIFO stock
          movement."
      >
      </PageHeader>

      <Container>
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
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product or batch..."
            // className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <div className="absolute right-3 top-3 text-slate-400">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Selling Price</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <div />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div>
                    <EmptyIcon />
                    <p>No batches found</p>
                    <p>Try changing your filters or search.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((batch) => {
                const d = daysUntil(batch.expiryDate);
                const tone = expiryTone(d);

                return (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <Link href={`/products/${batch.productId}`}>
                        {batch.product?.name ?? `Product #${batch.productId}`}
                      </Link>
                    </TableCell>

                    <TableCell>
                      {batch.batchNumber}
                    </TableCell>

                    <TableCell>
                      <span>
                        <span />
                        {new Date(batch.expiryDate).toLocaleDateString()}
                        {d < 0
                          ? `(Expired ${Math.abs(d)}d ago)`
                          : `(${d}d left)`}
                      </span>
                    </TableCell>

                    <TableCell>
                      {batch.quantityAvailable}
                    </TableCell>

                    <TableCell>
                      ₹{batch.sellingPrice}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Container>
    </div>
  );
}