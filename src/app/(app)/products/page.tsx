'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import type { product } from '@/types';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Input from '@/components/Input';
import Button from '@/components/Button';

type GstType = 'INCLUSIVE' | 'EXCLUSIVE';
type StatusFilter = 'ALL' | 'ACTIVE' | 'DISCONTINUED';


function gstTypeBadgeClass(type?: GstType) {
  return type === 'EXCLUSIVE'
    ? 'bg-sky-100 text-sky-700'
    : 'bg-secondary-100 text-secondary-700';
}

function stockBadge(qty: number) {
  if (qty <= 0) return { label: '0', cls: 'bg-danger-100 text-danger-700' };
  if (qty <= 20) return { label: `${qty} left`, cls: 'bg-amber-100 text-amber-700' };
  return { label: `${qty}`, cls: 'bg-secondary-100 text-secondary-700' };
}

function getGstType(m: product): GstType {
  return (m as unknown as { gstType?: GstType }).gstType ?? 'INCLUSIVE';
}

function getStock(m: product) {
  return m.batches.reduce((s, b) => s + b.quantityAvailable, 0);
}


const SearchIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.75">
    <circle cx="9" cy="9" r="6" />
    <path d="M17 17l-3.8-3.8" strokeLinecap="round" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.75">
    <path d="M11.5 3.5l5 5L6 19H1v-5l10.5-10.5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BanIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.75">
    <circle cx="10" cy="10" r="7.5" />
    <path d="M5 15l10-10" strokeLinecap="round" />
  </svg>
);

const EmptyIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10 text-neutral-300" stroke="currentColor" strokeWidth="1.5">
    <rect x="8" y="14" width="32" height="26" rx="2" />
    <path d="M8 20h32M17 14v-4h14v4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'primary' | 'secondary' | 'amber' | 'purple';
}) {
  const toneClasses: Record<string, string> = {
    primary: 'text-primary-700 bg-primary-50',
    secondary: 'text-secondary-700 bg-secondary-50',
    amber: 'text-amber-700 bg-amber-50',
    purple: 'text-purple-700 bg-purple-50',
  };
  return (
    <div className="flex-1 min-w-[140px] rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className={`mt-1 inline-flex rounded-md px-1.5 text-xl font-semibold ${toneClasses[tone]}`}>
        {value}
      </p>
    </div>
  );
}


function ConfirmDialog({
  open,
  productName,
  isActive,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  productName: string;
  isActive: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  const actionLabel = isActive ? 'Discontinue' : 'Activate';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-neutral-900">
          {isActive ? 'Discontinue product' : 'Activate product'}
        </h3>
        <p className="mt-1.5 text-sm text-neutral-500">
          {isActive
            ? `${productName} will be marked discontinued and hidden from new sales. This can be reversed later from the product record.`
            : `${productName} will be marked active again and available for new sales.`}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${isActive ? 'bg-danger-600 hover:bg-danger-700' : 'bg-success-600 hover:bg-success-700'
              }`}
            onClick={onConfirm}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canEdit = role === 'ADMIN' || role === 'PHARMACIST';

  const [products, setProducts] = useState<product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<product | null>(null);
  const [pendingDiscontinue, setPendingDiscontinue] = useState<product | null>(null);

  async function load() {
    setLoading(true);
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await apiFetch<product[]>(`/api/products${qs}`);
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(
    () => (statusFilter === 'ALL' ? products : products.filter((p) => p.status === statusFilter)),
    [products, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.status === 'ACTIVE').length,
      lowStock: products.filter((p) => getStock(p) <= 20).length,
      rx: products.filter((p) => p.prescriptionRequired).length,
    }),
    [products]
  );

  function openCreate() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function openEdit(m: product) {
    setEditingProduct(m);
    setShowForm(true);
  }

  async function confirmDiscontinue() {
    if (!pendingDiscontinue) return;
    await apiFetch(`/api/products/${pendingDiscontinue.id}`, { method: 'DELETE' });
    setPendingDiscontinue(null);
    load();
  }

  const filterPills: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'DISCONTINUED', label: 'Discontinued' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        header={`Products`}
        subheader="Catalog, GST slabs, and stock overview."
      >
        <HeaderButton text="Add product" onClick={openCreate} />
      </PageHeader>
      <div className="flex flex-wrap gap-3">
        <StatCard label="Total products" value={stats.total} tone="primary" />
        <StatCard label="Active" value={stats.active} tone="secondary" />
        <StatCard label="Low / out of stock" value={stats.lowStock} tone="amber" />
        <StatCard label="Prescription only" value={stats.rx} tone="purple" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400">
            <SearchIcon />
          </span>
          <Input
            // className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Search by name, barcode, or HSN code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1.5">
          {filterPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setStatusFilter(pill.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === pill.key
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Manufacturer</th>
              <th className="px-4 py-3 font-medium">HSN</th>
              <th className="px-4 py-3 font-medium">GST %</th>
              <th className="px-4 py-3 font-medium">GST type</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-neutral-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <EmptyIcon />
                    <p className="text-sm font-medium text-neutral-600">No products found</p>
                    <p className="text-xs text-neutral-400">
                      {search ? 'Try a different name, barcode, or HSN code.' : 'Add a product to get started.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const stock = getStock(m);
                const gstType = getGstType(m);
                const badge = stockBadge(stock);
                return (
                  <tr key={m.id} className="transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/products/${m.id}`}
                        className="font-medium text-neutral-900 hover:text-primary-600"
                      >
                        {m.name}
                      </Link>
                      {m.prescriptionRequired && (
                        <span className="ml-2 rounded-full bg-purple-100 px-1.5 py-0.5 text-[11px] font-medium text-purple-700">
                          Rx
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-neutral-600">{m.manufacturer}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-neutral-500">{m.hsnCode}</td>
                    <td className="px-4 py-3.5 font-medium text-neutral-700">{m.gstPercentage}%</td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${gstTypeBadgeClass(gstType)}`}>
                        {gstType === 'EXCLUSIVE' ? 'Exclusive' : 'Inclusive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${m.status === 'ACTIVE'
                          ? 'bg-secondary-100 text-secondary-700'
                          : 'bg-neutral-200 text-neutral-500'
                          }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-secondary-500' : 'bg-neutral-400'
                            }`}
                        />
                        {m.status === 'ACTIVE' ? 'Active' : 'Discontinued'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {canEdit && (
                        <div className="grid grid-cols-3 gap-1">
                          <Button
                            onClick={() => openEdit(m)}
                            variant='ghost'
                          >
                            <EditIcon />
                          </Button>
                          {role === 'ADMIN' && (
                            <button
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium  hover:bg-danger-50 col-span-2 ${m.status === 'ACTIVE' ? "text-danger-600" : "text-success-600"}`}
                              onClick={() => setPendingDiscontinue(m)}
                            >
                              {m.status === 'ACTIVE' && <BanIcon />}
                              {m.status === 'ACTIVE' ? "Discontinue" : "Activate"}

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
      <ProductFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        product={editingProduct}
        onSuccess={load}
      />
      <ConfirmDialog
        open={!!pendingDiscontinue}
        productName={pendingDiscontinue?.name ?? ''}
        isActive={pendingDiscontinue?.status === 'ACTIVE'}
        onCancel={() => setPendingDiscontinue(null)}
        onConfirm={confirmDiscontinue}
      />
    </div>
  );
}