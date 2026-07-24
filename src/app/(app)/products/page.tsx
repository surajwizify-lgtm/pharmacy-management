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
import Container from '@/components/common/Container';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card>
      <CardContent className="">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
        <p className={clsx(`mt-1 inline-flex rounded-md px-1.5 text-xl font-semibold `, toneClasses[tone])}>
          {value}
        </p>
      </CardContent>
    </Card>
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
          <Button onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className={` ${isActive ? 'bg-danger-600 hover:bg-danger-700' : 'bg-success-600 hover:bg-success-700'
              }`}
            onClick={onConfirm}
          >
            {actionLabel}
          </Button>
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
        <Separator orientation="horizontal"></Separator>
      </PageHeader>
      <Container>
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
              placeholder="Search by name, barcode, or HSN code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5">
            {filterPills.map((pill) => (
              <Button
                variant={'secondary'}
                key={pill.key}
                onClick={() => setStatusFilter(pill.key)}
                className={` ${statusFilter === pill.key
                  ? 'bg-gray-400'
                  : ''
                  }`}
              >
                {pill.label}
              </Button>
            ))}
          </div>
        </div>

        <div
        >

          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Name</TableHead>
                <TableHead className="w-[15%]">Manufacturer</TableHead>
                <TableHead className="w-[8%]">HSN</TableHead>
                <TableHead className="w-[8%]">GST %</TableHead>
                <TableHead className="w-[10%]">GST Type</TableHead>
                <TableHead className="w-[7%]">Stock</TableHead>
                <TableHead className="w-[7%]">Status</TableHead>
                <TableHead className="w-[25%] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='w-full'>
              {loading
                ?
                (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j} className="px-4 py-3.5">
                          <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-neutral-100" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )
                :
                filtered.length === 0
                  ?
                  (
                    <TableRow className=''>
                      <TableCell colSpan={8} className='' >
                        <div className="flex flex-col items-center gap-2 text-center">
                          <EmptyIcon />
                          <p className="text-sm font-medium text-neutral-600">No products found</p>
                          <p className="text-xs text-neutral-400">
                            {search ? 'Try a different name, barcode, or HSN code.' : 'Add a product to get started.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                  :
                  (
                    filtered.map((m) => {
                      const stock = getStock(m);
                      const gstType = getGstType(m);
                      const badge = stockBadge(stock);
                      return (
                        <TableRow className='' key={m.id}>
                          <TableCell className='  whitespace-normal'>
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
                          </TableCell>
                          <TableCell >{m.manufacturer}</TableCell>
                          <TableCell>{m.hsnCode}</TableCell>
                          <TableCell>{m.gstPercentage}%</TableCell>
                          <TableCell>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${gstTypeBadgeClass(gstType)}`}>
                              {gstType === 'EXCLUSIVE' ? 'Exclusive' : 'Inclusive'}
                            </span>
                          </TableCell>
                          <TableCell >
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </TableCell>
                          <TableCell >
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
                          </TableCell>
                          <TableCell>
                            {canEdit && (
                              <div className="grid grid-cols-2 gap-1">
                                <Button
                                  onClick={() => openEdit(m)}
                                  variant='ghost'
                                >
                                  <EditIcon />
                                </Button>
                                {role === 'ADMIN' && (
                                  <Button
                                    variant={m.status === 'ACTIVE' ? "destructive" : "default"}
                                    onClick={() => setPendingDiscontinue(m)}
                                  >
                                    {m.status === 'ACTIVE' && <BanIcon />}
                                    {m.status === 'ACTIVE' ? "Discontinue" : "Activate"}

                                  </Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
            </TableBody>
          </Table>
        </div>
      </Container>
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