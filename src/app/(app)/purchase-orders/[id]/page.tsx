'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import {
  ArrowLeft,
  ClipboardList,
  Building2,
  IndianRupee,
  CalendarClock,
  Package,
  Receipt,
  PackageCheck,
  Calendar,
} from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  APPROVED: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200',
  RECEIVED: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200',
};

const STATUS_DOT: Record<string, string> = {
  PENDING: 'bg-amber-500',
  APPROVED: 'bg-blue-500',
  RECEIVED: 'bg-emerald-500',
  CANCELLED: 'bg-slate-400',
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [po, setPo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/purchase-orders/${id}`)
      .then(setPo)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse p-4" />
          ))}
        </div>
        <div className="card h-48 animate-pulse p-5" />
      </div>
    );
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!po) return <p className="text-slate-400">No data found.</p>;

  const estimatedTotal = po.items.reduce((sum: number, it: any) => sum + it.quantity * Number(it.expectedRate), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/purchase-orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to purchase orders
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <ClipboardList className="h-6 w-6 text-brand-600" />
            PO #{po.poNumber}
          </h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[po.status] || 'bg-slate-100 text-slate-600'}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[po.status] || 'bg-slate-400'}`} />
            {po.status.replace('_', ' ')}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          {po.supplier.name}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <IndianRupee className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Estimated total</p>
            <p className="text-lg font-semibold text-slate-900">₹{estimatedTotal.toFixed(2)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Expected date</p>
            <p className="text-lg font-semibold text-slate-900">
              {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Requested items */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="flex items-center gap-2 font-medium text-slate-800">
            <Package className="h-4 w-4 text-brand-600" />
            Requested Items
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {po.items.length}
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Qty requested</th>
                <th className="p-3">Expected rate</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {po.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="p-3 font-medium text-slate-800">{item.product.name}</td>
                  <td className="p-3 text-slate-600">{item.quantity}</td>
                  <td className="p-3 text-slate-600">₹{Number(item.expectedRate).toFixed(2)}</td>
                  <td className="p-3 text-right font-medium text-slate-800">
                    ₹{(item.quantity * Number(item.expectedRate)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
          <div className="flex justify-end border-t border-slate-100 p-4">
            <Link href={`/purchase-orders/${id}/receive`} className="btn-primary inline-flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4" />
              Receive this Purchase Order
            </Link>
          </div>
        )}
      </div>

      {/* Linked purchase invoices */}
      {po.purchaseInvoices?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="flex items-center gap-2 font-medium text-slate-800">
              <Receipt className="h-4 w-4 text-brand-600" />
              Linked Purchase Invoices (GRNs)
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {po.purchaseInvoices.length}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3">GRN #</th>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Payment status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {po.purchaseInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <Link href={`/purchase-orders/purchase-invoices/${inv.id}`} className="font-medium text-brand-600 hover:underline">
                        {inv.grnNumber}
                      </Link>
                    </td>
                    <td className="p-3 text-slate-600">{inv.invoiceNumber}</td>
                    <td className="p-3 font-medium text-slate-800">₹{Number(inv.totalAmount).toFixed(2)}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}