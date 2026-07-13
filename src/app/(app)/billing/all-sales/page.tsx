// src/app/billing/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import SalesReturnModal from '@/components/SalesReturnModal';
import { RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { Bill, product, PaymentMethod } from '@/types';
import BillInvoice from '@/components/BillInvoice';
import InvoicePrintStyles from '@/components/InvoicePrintStyles';
import { downloadInvoicePdf } from '@/lib/invoice-pdf';
import {
  Plus,
  X,
  Search,
  Eye,
  Pencil,
  Trash2,
  Minus,
  ShoppingCart,
  User,
  Phone,
  Receipt,
  ArrowLeftRight,
  Clock,
  IndianRupee,
  Stethoscope,
  Building2,
  Upload,
  FileText,
  UserPlus,
  MapPin,
  CreditCard,
  Printer,
  Download,
} from 'lucide-react';

interface CartLine {
  productId: number;
  name: string;
  gstPercentage: string;
  quantity: number;
  batchId?: number;
  availableStock: number;
  sellingPrice: string;
}

interface DoctorOption {
  id: number;
  name: string;
  specialization?: string | null;
  phone?: string | null;
}

interface HospitalOption {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
}

type GstMode = 'EXCLUSIVE' | 'INCLUSIVE';

const STATUS_OPTIONS = ['ALL', 'PAID', 'PARTIALLY_PAID', 'UNPAID'] as const;

function statusBadgeClass(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200';
    case 'PARTIALLY_PAID':
      return 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200';
    default:
      return 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200';
  }
}

function statusDotClass(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-500';
    case 'PARTIALLY_PAID':
      return 'bg-amber-500';
    default:
      return 'bg-slate-400';
  }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-brand-100 text-brand-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Computes taxable value / GST amount for one cart line, depending on
// whether the selling price is treated as GST-inclusive or GST-exclusive.
function lineAmounts(l: CartLine, mode: GstMode) {
  const price = Number(l.sellingPrice);
  const gstPct = Number(l.gstPercentage);
  const lineTotal = price * l.quantity;

  if (mode === 'INCLUSIVE') {
    const base = lineTotal / (1 + gstPct / 100);
    const gst = lineTotal - base;
    return { base, gst, total: lineTotal };
  }

  const gst = (lineTotal * gstPct) / 100;
  return { base: lineTotal, gst, total: lineTotal + gst };
}

export default function BillingPage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [isInterState, setIsInterState] = useState(false);
  const [gstMode, setGstMode] = useState<GstMode>('EXCLUSIVE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBill, setLastBill] = useState<Bill | null>(null);

  const [bills, setBills] = useState<Bill[]>([]);
  const [returningBillId, setReturningBillId] = useState<number | null>(null);
  const [loadingBills, setLoadingBills] = useState(true);
  const [showCreateBill, setShowCreateBill] = useState(false);

  const [billSearch, setBillSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('ALL');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // ---- View bill (inline, shown below the lists) — read-only ----
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);
  const [loadingViewBill, setLoadingViewBill] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [showViewBill, setShowViewBill] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // ---- Invoice popup (separate from inline view, opened via the Invoice icon) — read-only ----
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);

  // ---- Doctor autocomplete ----
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [doctorSuggestions, setDoctorSuggestions] = useState<DoctorOption[]>([]);
  const [showDoctorSuggestions, setShowDoctorSuggestions] = useState(false);
  const doctorBoxRef = useRef<HTMLDivElement>(null);

  // ---- Hospital autocomplete ----
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalSuggestions, setHospitalSuggestions] = useState<HospitalOption[]>([]);
  const [showHospitalSuggestions, setShowHospitalSuggestions] = useState(false);
  const hospitalBoxRef = useRef<HTMLDivElement>(null);



  async function loadBills() {
    setLoadingBills(true);
    try {
      setBills(await apiFetch<Bill[]>('/api/bills'));
    } finally {
      setLoadingBills(false);
    }
  }

  useEffect(() => {
    loadBills();
  }, []);

  // product search
  useEffect(() => {
    if (!search) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const data = await apiFetch<product[]>(`/api/products?search=${encodeURIComponent(search)}&status=ACTIVE`);
      setResults(data);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  // Doctor suggestions (debounced
  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (doctorBoxRef.current && !doctorBoxRef.current.contains(e.target as Node)) {
        setShowDoctorSuggestions(false);
      }
      if (hospitalBoxRef.current && !hospitalBoxRef.current.contains(e.target as Node)) {
        setShowHospitalSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  function resetFormState() {
    setSearch('');
    setResults([]);
    setError(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerGstin('');
    setIsInterState(false);
    setGstMode('EXCLUSIVE');
    setDoctorId(null);
    setDoctorName('');
    setDoctorSuggestions([]);
    setHospitalId(null);
    setHospitalName('');
    setHospitalSuggestions([]);
  }



  async function deleteBill(id: number, billNumber: string) {
    if (!confirm(`Delete bill ${billNumber}? This cannot be undone.`)) return;
    setDeletingId(id);
    setListError(null);
    try {
      await apiFetch(`/api/bills/${id}`, { method: 'DELETE' });
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setListError(err instanceof ApiClientError ? err.message : 'Could not delete bill');
    } finally {
      setDeletingId(null);
    }
  }

  // ---- Inline view (below the lists) — read-only ----
  async function openViewBill(id: number) {
    setShowInvoicePopup(false); // ensure the popup isn't also open at the same time
    setShowViewBill(true);
    setViewError(null);
    setLoadingViewBill(true);
    setViewingBill(null);
    try {
      const full = await apiFetch<Bill>(`/api/bills/${id}`);
      setViewingBill(full);
    } catch (err) {
      setViewError(err instanceof ApiClientError ? err.message : 'Could not load this bill');
    } finally {
      setLoadingViewBill(false);
    }
  }

  function closeViewBill() {
    setShowViewBill(false);
    setViewingBill(null);
    setViewError(null);
  }

  // ---- Invoice popup (separate from inline view) — read-only ----
  async function openInvoicePopup(id: number) {
    setShowViewBill(false); // ensure the inline view isn't also open at the same time
    setShowInvoicePopup(true);
    setViewError(null);
    setLoadingViewBill(true);
    setViewingBill(null);
    try {
      const full = await apiFetch<Bill>(`/api/bills/${id}`);
      setViewingBill(full);
    } catch (err) {
      setViewError(err instanceof ApiClientError ? err.message : 'Could not load this bill');
    } finally {
      setLoadingViewBill(false);
    }
  }

  function closeInvoicePopup() {
    setShowInvoicePopup(false);
    setViewingBill(null);
    setViewError(null);
  }

  function handlePrintViewingBill() {
    window.print();
  }

  async function handleDownloadViewingBillPdf() {
    if (!viewingBill) return;
    setDownloadingPdf(true);
    try {
      await downloadInvoicePdf(viewingBill.billNumber);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate PDF. Make sure jspdf and html2canvas are installed (npm install jspdf html2canvas).');
    } finally {
      setDownloadingPdf(false);
    }
  }

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      !billSearch ||
      b.billNumber.toLowerCase().includes(billSearch.toLowerCase()) ||
      (b.customerName ?? '').toLowerCase().includes(billSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });
  async function handleReturnClick(billId: number) {
    try {
      const status = await apiFetch<{ fullyReturned: boolean }>(`/api/bills/${billId}/returns`);
      if (status.fullyReturned) {
        alert('This bill has already been fully returned.');
        return;
      }
      setReturningBillId(billId);
    } catch {
      setReturningBillId(billId); // fall back to opening the modal, which will show its own message
    }
  }

  const recentBills = [...bills]
    .sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())
    .slice(0, 8);

  const viewingTotalPaid = viewingBill ? (viewingBill.payments ?? []).reduce((s, p) => s + Number(p.amount), 0) : 0;
  const viewingBalanceDue = viewingBill ? Number(viewingBill.totalAmount) - viewingTotalPaid : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500">Manage all pharmacy bills.</p>
        </div>

        <Link href={'/billing/all-sales/new'}
          // onClick={() => setShowCreateBill(true)}
          className="rounded-md py-2 my-auto font-medium  transition-colors disabled:cursor-not-allowed px-5 disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700"
        >
          + Create New Bill
        </Link>
      </div>

      {/* Main layout: bills table (left) + recent bills (right) */}
      <div className="w-full">
        {/* All bills */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <h2 className="flex items-center gap-2 font-medium text-slate-800">
              <Receipt className="h-4 w-4 text-brand-600" />
              All Bills
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {filteredBills.length}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                />

                <input
                  className="w-68 rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Search bill no. or customer..."
                  value={billSearch}
                  onChange={(e) => setBillSearch(e.target.value)}
                />
              </div>

              <select
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as (typeof STATUS_OPTIONS)[number]
                  )
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL" ? "All statuses" : s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {listError && <p className="px-4 pt-3 text-sm text-red-600">{listError}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3 text-left">Bill</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingBills ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="p-3" colSpan={6}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Receipt className="mb-2 h-8 w-8" />
                        <p className="text-sm">No bills found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => {
                    const name = bill.customerName || 'Walk In';
                    return (
                      <tr key={bill.id} className="group transition-colors hover:bg-slate-50/70">
                        <td className="p-3">
                          <span className="font-medium text-slate-800">{bill.billNumber}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarColor(name)}`}
                            >
                              {initials(name)}
                            </span>
                            <span className="text-slate-600">{name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(bill.billDate).toLocaleDateString()}</td>
                        <td className="p-3 font-medium text-slate-800">₹{bill.totalAmount}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(bill.paymentStatus)}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(bill.paymentStatus)}`} />
                            {bill.paymentStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                            {/* <Link
                              title="Return"
                              onClick={() => setReturningBillId(bill.id)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button> */}
                            <button
                              title="Return"
                              onClick={() => handleReturnClick(bill.id)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                            <button
                              title="View"
                              onClick={() => openViewBill(bill.id)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              title="Invoice"
                              onClick={() => openInvoicePopup(bill.id)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-purple-50 hover:text-purple-600"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/billing/${bill.id}?edit=1`}
                              title="Edit"
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              title="Delete"
                              disabled={deletingId === bill.id}
                              onClick={() => deleteBill(bill.id, bill.billNumber)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bill detail — inline, All Bills list ke niche, jab koi bill select ho (Eye icon).
          READ-ONLY: sirf totals + payment status/history, koi payment record karne ka form nahi. */}
      {showViewBill && (
        <div className="card space-y-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {viewingBill ? viewingBill.billNumber : 'Loading bill…'}
              </h1>
              {viewingBill && (
                <p className="text-sm text-slate-500">
                  {new Date(viewingBill.billDate).toLocaleString()} · Cashier:{' '}
                  {viewingBill.cashier?.fullName ?? viewingBill.cashierId}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {viewingBill && (
                <span
                  className={`badge ${viewingBill.paymentStatus === 'PAID'
                    ? 'bg-brand-100 text-brand-700'
                    : viewingBill.paymentStatus === 'PARTIALLY_PAID'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {viewingBill.paymentStatus}
                </span>
              )}
              <button
                onClick={closeViewBill}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {loadingViewBill ? (
            <div className="flex h-40 items-center justify-center text-slate-400">Loading bill…</div>
          ) : viewError ? (
            <p className="text-sm text-red-600">{viewError}</p>
          ) : viewingBill ? (
            <>
              {(viewingBill.customerName || viewingBill.customerPhone || viewingBill.customerGstin) && (
                <div className="rounded-xl border border-slate-100 p-4 text-sm text-slate-600">
                  {viewingBill.customerName && <p>Customer: {viewingBill.customerName}</p>}
                  {viewingBill.customerPhone && <p>Phone: {viewingBill.customerPhone}</p>}
                  {viewingBill.customerGstin && <p>GSTIN: {viewingBill.customerGstin}</p>}
                  <p>{viewingBill.isInterState ? 'Inter-state sale (IGST)' : 'Intra-state sale (CGST + SGST)'}</p>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">product</th>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Unit price</th>
                      <th className="px-4 py-3">GST</th>
                      <th className="px-4 py-3">Line total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingBill.billItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">{item.product?.name ?? `#${item.productId}`}</td>
                        <td className="px-4 py-3 text-slate-500">{item.batchNumber}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">₹{item.unitPrice}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {viewingBill.isInterState
                            ? `IGST ₹${item.igstAmount}`
                            : `CGST ₹${item.cgstAmount} + SGST ₹${item.sgstAmount}`}
                        </td>
                        <td className="px-4 py-3 font-medium">₹{item.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-100 p-5">
                  <h2 className="mb-3 font-medium text-slate-800">Totals</h2>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>₹{viewingBill.subtotal}</span>
                    </div>
                    {viewingBill.isInterState ? (
                      <div className="flex justify-between text-slate-600">
                        <span>IGST</span>
                        <span>₹{viewingBill.totalIgst}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>CGST</span>
                          <span>₹{viewingBill.totalCgst}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SGST</span>
                          <span>₹{viewingBill.totalSgst}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Total GST</span>
                      <span>₹{viewingBill.totalGst}</span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
                      <span>Total amount</span>
                      <span>₹{viewingBill.totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Paid</span>
                      <span>₹{viewingTotalPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-800">
                      <span>Balance due</span>
                      <span>₹{viewingBalanceDue.toFixed(2)}</span>
                    </div>
                  </dl>
                </div>

                {/* Read-only payment status/history — no recording form */}
                <div className="rounded-xl border border-slate-100 p-5">
                  <h2 className="mb-3 flex items-center gap-1.5 font-medium text-slate-800">
                    <CreditCard className="h-4 w-4 text-brand-600" />
                    Payment
                  </h2>

                  <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                    <span className="text-slate-500">Status</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(viewingBill.paymentStatus)}`}
                    >
                      {viewingBill.paymentStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {viewingBill.payments && viewingBill.payments.length > 0 ? (
                    <div>
                      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Payment history</h3>
                      <ul className="space-y-1 text-sm text-slate-600">
                        {viewingBill.payments.map((p) => (
                          <li key={p.id} className="flex justify-between">
                            <span>
                              {p.method} · {new Date(p.paidAt).toLocaleString()}
                            </span>
                            <span>₹{p.amount}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No payments recorded for this bill yet.</p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}


      {/* Invoice popup — READ-ONLY, sirf invoice. Koi payment card/form nahi. */}
      {showInvoicePopup && (
        <div
          id="view-bill-overlay"
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={closeInvoicePopup}
        >
          <div
            id="view-bill-modal"
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="no-print flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold leading-tight">
                    {viewingBill ? viewingBill.billNumber : 'Loading bill…'}
                  </h2>
                  <p className="text-xs text-white/70">Invoice preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewingBill && (
                  <>
                    <button
                      onClick={handleDownloadViewingBillPdf}
                      disabled={downloadingPdf}
                      title="Download PDF"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/25 disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {downloadingPdf ? 'Preparing…' : 'PDF'}
                    </button>
                    <button
                      onClick={handlePrintViewingBill}
                      title="Print"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/25"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </button>
                    <Link
                      href={`/billing/${viewingBill.id}`}
                      className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/25"
                    >
                      Open full page →
                    </Link>
                  </>
                )}
                <button onClick={closeInvoicePopup} className="rounded-full p-2 transition-colors hover:bg-white/15">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
              {loadingViewBill ? (
                <div className="flex h-64 items-center justify-center text-slate-400">Loading invoice…</div>
              ) : viewError ? (
                <p className="text-sm text-red-600">{viewError}</p>
              ) : viewingBill ? (
                <BillInvoice bill={viewingBill} />
              ) : null}
            </div>
          </div>
        </div>
      )}
      {returningBillId !== null && (
        <SalesReturnModal
          billId={returningBillId}
          onClose={() => setReturningBillId(null)}
          onSuccess={loadBills}
        />
      )}

      <InvoicePrintStyles />
    </div>
  );
}
