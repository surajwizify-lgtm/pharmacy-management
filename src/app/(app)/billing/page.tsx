// src/app/billing/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { Bill, Medicine } from '@/types';
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
  ClipboardList,
} from 'lucide-react';

interface CartLine {
  medicineId: number;
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
  const [results, setResults] = useState<Medicine[]>([]);
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
  const [loadingBills, setLoadingBills] = useState(true);
  const [showCreateBill, setShowCreateBill] = useState(false);

  const [billSearch, setBillSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('ALL');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [listError, setListError] = useState<string | null>(null);

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

  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  // ---- "Create new doctor" mini modal ----
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialization, setNewDoctorSpecialization] = useState('');
  const [newDoctorPhone, setNewDoctorPhone] = useState('');
  const [creatingDoctor, setCreatingDoctor] = useState(false);
  const [createDoctorError, setCreateDoctorError] = useState<string | null>(null);

  // ---- "Create new hospital" mini modal ----
  const [showCreateHospital, setShowCreateHospital] = useState(false);
  const [newHospitalName, setNewHospitalName] = useState('');
  const [newHospitalAddress, setNewHospitalAddress] = useState('');
  const [newHospitalPhone, setNewHospitalPhone] = useState('');
  const [creatingHospital, setCreatingHospital] = useState(false);
  const [createHospitalError, setCreateHospitalError] = useState<string | null>(null);

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

  // Medicine search
  useEffect(() => {
    if (!search) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const data = await apiFetch<Medicine[]>(`/api/medicines?search=${encodeURIComponent(search)}&status=ACTIVE`);
      setResults(data);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  // Doctor suggestions (debounced)
  useEffect(() => {
    if (!doctorName.trim()) {
      setDoctorSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const data = await apiFetch<DoctorOption[]>(`/api/doctors?search=${encodeURIComponent(doctorName)}`);
        setDoctorSuggestions(data);
      } catch {
        setDoctorSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [doctorName]);

  // Hospital suggestions (debounced)
  useEffect(() => {
    if (!hospitalName.trim()) {
      setHospitalSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const data = await apiFetch<HospitalOption[]>(`/api/hospitals?search=${encodeURIComponent(hospitalName)}`);
        setHospitalSuggestions(data);
      } catch {
        setHospitalSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [hospitalName]);

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

  function handleDoctorNameChange(value: string) {
    setDoctorName(value);
    setDoctorId(null); // typing invalidates a previously selected doctor
    setShowDoctorSuggestions(true);
  }

  function selectDoctor(d: DoctorOption) {
    setDoctorId(d.id);
    setDoctorName(d.name);
    setShowDoctorSuggestions(false);
  }

  function handleHospitalNameChange(value: string) {
    setHospitalName(value);
    setHospitalId(null);
    setShowHospitalSuggestions(true);
  }

  function selectHospital(h: HospitalOption) {
    setHospitalId(h.id);
    setHospitalName(h.name);
    setShowHospitalSuggestions(false);
  }

  // ---- Create-new-doctor flow ----
  function openCreateDoctor() {
    setNewDoctorName(doctorName.trim());
    setNewDoctorSpecialization('');
    setNewDoctorPhone('');
    setCreateDoctorError(null);
    setShowDoctorSuggestions(false);
    setShowCreateDoctor(true);
  }

  async function submitCreateDoctor() {
    if (!newDoctorName.trim()) {
      setCreateDoctorError('Doctor name is required.');
      return;
    }
    setCreatingDoctor(true);
    setCreateDoctorError(null);
    try {
      const created = await apiFetch<DoctorOption>('/api/doctors', {
        method: 'POST',
        body: JSON.stringify({
          name: newDoctorName.trim(),
          specialization: newDoctorSpecialization || undefined,
          phone: newDoctorPhone || undefined,
        }),
      });
      selectDoctor(created);
      setShowCreateDoctor(false);
    } catch (err) {
      setCreateDoctorError(err instanceof ApiClientError ? err.message : 'Could not create doctor');
    } finally {
      setCreatingDoctor(false);
    }
  }

  // ---- Create-new-hospital flow ----
  function openCreateHospital() {
    setNewHospitalName(hospitalName.trim());
    setNewHospitalAddress('');
    setNewHospitalPhone('');
    setCreateHospitalError(null);
    setShowHospitalSuggestions(false);
    setShowCreateHospital(true);
  }

  async function submitCreateHospital() {
    if (!newHospitalName.trim()) {
      setCreateHospitalError('Hospital name is required.');
      return;
    }
    setCreatingHospital(true);
    setCreateHospitalError(null);
    try {
      const created = await apiFetch<HospitalOption>('/api/hospitals', {
        method: 'POST',
        body: JSON.stringify({
          name: newHospitalName.trim(),
          address: newHospitalAddress || undefined,
          phone: newHospitalPhone || undefined,
        }),
      });
      selectHospital(created);
      setShowCreateHospital(false);
    } catch (err) {
      setCreateHospitalError(err instanceof ApiClientError ? err.message : 'Could not create hospital');
    } finally {
      setCreatingHospital(false);
    }
  }

  function addToCart(m: Medicine) {
    const stock = m.batches.reduce((s, b) => s + b.quantityAvailable, 0);
    if (stock <= 0) {
      alert(`${m.name} has no available stock.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.medicineId === m.id);
      if (existing) {
        return prev.map((l) => (l.medicineId === m.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          medicineId: m.id,
          name: m.name,
          gstPercentage: m.gstPercentage,
          quantity: 1,
          availableStock: stock,
          sellingPrice: m.batches[0]?.sellingPrice ?? '0',
        },
      ];
    });
    setSearch('');
    setResults([]);
  }

  function updateQty(medicineId: number, quantity: number) {
    if (quantity < 1) return;
    setCart((prev) => prev.map((l) => (l.medicineId === medicineId ? { ...l, quantity } : l)));
  }

  function removeLine(medicineId: number) {
    setCart((prev) => prev.filter((l) => l.medicineId !== medicineId));
  }

  const estimatedSubtotal = cart.reduce((sum, l) => sum + lineAmounts(l, gstMode).base, 0);
  const estimatedGst = cart.reduce((sum, l) => sum + lineAmounts(l, gstMode).gst, 0);
  const estimatedCgst = isInterState ? 0 : estimatedGst / 2;
  const estimatedSgst = isInterState ? 0 : estimatedGst / 2;
  const estimatedIgst = isInterState ? estimatedGst : 0;

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
    setPrescriptionFile(null);
    setPrescriptionNotes('');
  }

  function closeModal() {
    setShowCreateBill(false);
    resetFormState();
  }

  async function submitBill() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const bill = await apiFetch<Bill>('/api/bills', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((l) => ({
            medicineId: l.medicineId,
            quantity: l.quantity,
          })),

          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          customerGstin: customerGstin || undefined,

          // If an existing doctor was picked from suggestions, send its id.
          // Otherwise send the free-typed name so the backend can create one.
          doctorId: doctorId || undefined,
          doctorName: !doctorId && doctorName.trim() ? doctorName.trim() : undefined,

          // Same find-or-create pattern for hospital.
          hospitalId: hospitalId || undefined,
          hospitalName: !hospitalId && hospitalName.trim() ? hospitalName.trim() : undefined,
          // Send this after uploading the file
          prescriptionFile: undefined,

          isInterState,
        }),
      });
      setLastBill(bill);
      setCart([]);
      resetFormState();
      loadBills();
      setShowCreateBill(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
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

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      !billSearch ||
      b.billNumber.toLowerCase().includes(billSearch.toLowerCase()) ||
      (b.customerName ?? '').toLowerCase().includes(billSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const recentBills = [...bills]
    .sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500">Manage all pharmacy bills.</p>
        </div>

        <button
          onClick={() => setShowCreateBill(true)}
          className="btn-primary inline-flex items-center gap-2 shadow-sm shadow-brand-600/20"
        >
          <Plus className="h-4 w-4" />
          Create New Bill
        </button>
      </div>

      {/* Main layout: bills table (left) + recent bills (right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  className="input w-68 pl-8 text-sm"
                  placeholder="Search bill no. or customer…"
                  value={billSearch}
                  onChange={(e) => setBillSearch(e.target.value)}
                />
              </div>
              <select
                className="input w-auto text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'ALL' ? 'All statuses' : s.replace('_', ' ')}
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
                            <Link
                              href={`/billing/${bill.id}`}
                              title="View"
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
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

        {/* Recent bills sidebar */}
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-medium text-slate-800">
            <Clock className="h-4 w-4 text-brand-600" />
            Recent Bills
          </h2>
          {loadingBills ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : recentBills.length === 0 ? (
            <p className="text-sm text-slate-400">No bills yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentBills.map((b) => (
                <li key={b.id} className="py-2.5">
                  <Link href={`/billing/${b.id}`} className="flex items-center justify-between text-sm hover:text-brand-600">
                    <span>
                      <span className="font-medium text-slate-800">{b.billNumber}</span>
                      <br />
                      <span className="text-xs text-slate-400">{new Date(b.billDate).toLocaleString()}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-medium">₹{b.totalAmount}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(b.paymentStatus)}`}>
                        {b.paymentStatus.replace('_', ' ')}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {lastBill && (
            <div className="mt-4 rounded-lg bg-brand-50 p-3 text-sm">
              Bill <span className="font-semibold">{lastBill.billNumber}</span> created — ₹{lastBill.totalAmount}.{' '}
              <Link href={`/billing/${lastBill.id}`} className="font-medium text-brand-700 hover:underline">
                View →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Create bill popup */}
      {showCreateBill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold leading-tight">Create New Bill</h2>
                  <p className="text-xs text-white/70">Patient & referral details, then medicines, then prescription</p>
                </div>
              </div>
              <button onClick={closeModal} className="rounded-full p-2 transition-colors hover:bg-white/15">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-3">
              {/* Left: patient/referral -> medicines/cart -> prescription */}
              <div className="space-y-6 lg:col-span-2">
                {/* 1. Patient & Referral Details */}
                <div className="rounded-xl border border-slate-100 p-4">
                  <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <User className="h-4 w-4 text-brand-600" />
                    Patient & Referral Details
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label !flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Patient name
                      </label>
                      <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    </div>
                    <div>
                      <label className="label !flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> Phone
                      </label>
                      <input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                    </div>

                    {/* Doctor autocomplete */}
                    <div className="relative sm:col-span-2" ref={doctorBoxRef}>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="label !flex m-0 items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5" /> Referring doctor
                        </label>
                        <button
                          type="button"
                          onClick={openCreateDoctor}
                          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> New doctor
                        </button>
                      </div>
                      <input
                        type="text"
                        className="input"
                        placeholder="Search doctor by name…"
                        value={doctorName}
                        onChange={(e) => handleDoctorNameChange(e.target.value)}
                        onFocus={() => doctorName.trim() && setShowDoctorSuggestions(true)}
                      />
                      {doctorId && <p className="mt-1 text-xs text-emerald-600">Existing doctor selected ✓</p>}
                      {showDoctorSuggestions && doctorSuggestions.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                          {doctorSuggestions.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50"
                              onClick={() => selectDoctor(d)}
                            >
                              <span className="font-medium text-slate-700">{d.name}</span>
                              {d.specialization && <span className="text-xs text-slate-400">{d.specialization}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {showDoctorSuggestions && doctorName.trim() && doctorSuggestions.length === 0 && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
                          <p className="mb-2 text-slate-400">No doctor named “{doctorName.trim()}” found.</p>
                          <button
                            type="button"
                            onClick={openCreateDoctor}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-50 py-1.5 font-medium text-brand-700 hover:bg-brand-100"
                          >
                            <UserPlus className="h-3.5 w-3.5" /> Create “{doctorName.trim()}” as new doctor
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hospital autocomplete */}
                    <div className="relative sm:col-span-2" ref={hospitalBoxRef}>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="label !flex m-0 items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" /> Referring hospital
                        </label>
                        <button
                          type="button"
                          onClick={openCreateHospital}
                          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                        >
                          <Plus className="h-3.5 w-3.5" /> New hospital
                        </button>
                      </div>
                      <input
                        type="text"
                        className="input"
                        placeholder="Search hospital by name…"
                        value={hospitalName}
                        onChange={(e) => handleHospitalNameChange(e.target.value)}
                        onFocus={() => hospitalName.trim() && setShowHospitalSuggestions(true)}
                      />
                      {hospitalId && <p className="mt-1 text-xs text-emerald-600">Existing hospital selected ✓</p>}
                      {showHospitalSuggestions && hospitalSuggestions.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                          {hospitalSuggestions.map((h) => (
                            <button
                              key={h.id}
                              type="button"
                              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50"
                              onClick={() => selectHospital(h)}
                            >
                              <span className="font-medium text-slate-700">{h.name}</span>
                              {h.address && <span className="text-xs text-slate-400">{h.address}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {showHospitalSuggestions && hospitalName.trim() && hospitalSuggestions.length === 0 && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
                          <p className="mb-2 text-slate-400">No hospital named “{hospitalName.trim()}” found.</p>
                          <button
                            type="button"
                            onClick={openCreateHospital}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-50 py-1.5 font-medium text-brand-700 hover:bg-brand-100"
                          >
                            <Plus className="h-3.5 w-3.5" /> Create “{hospitalName.trim()}” as new hospital
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="label !flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5" /> GSTIN (B2B, optional)
                      </label>
                      <input
                        className="input uppercase"
                        value={customerGstin}
                        onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                      />
                    </div>
                    <label className="mt-6 flex h-10 cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <ArrowLeftRight className="h-3.5 w-3.5" /> Inter-state (IGST)
                      </span>
                      <input
                        type="checkbox"
                        checked={isInterState}
                        onChange={(e) => setIsInterState(e.target.checked)}
                        className="h-4 w-4 accent-brand-600"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Medicine search + cart */}
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <ShoppingCart className="h-4 w-4 text-brand-600" />
                      Medicines
                    </h3>

                    {/* GST mode toggle — affects the per-item & summary breakdown only */}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setGstMode('EXCLUSIVE')}
                        className={`rounded-md px-2.5 py-1 transition-colors ${gstMode === 'EXCLUSIVE' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        Excl. GST
                      </button>
                      <button
                        type="button"
                        onClick={() => setGstMode('INCLUSIVE')}
                        className={`rounded-md px-2.5 py-1 transition-colors ${gstMode === 'INCLUSIVE' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        Incl. GST
                      </button>
                    </div>
                  </div>

                  <div className="relative mb-4">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="input pl-20"
                      placeholder="Search medicine by name, barcode, or HSN…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {results.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                        {results.map((m) => {
                          const stock = m.batches.reduce((s, b) => s + b.quantityAvailable, 0);
                          return (
                            <button
                              key={m.id}
                              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-brand-50"
                              onClick={() => addToCart(m)}
                            >
                              <span className="font-medium text-slate-700">{m.name}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{stock} in stock</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-14 text-slate-400">
                      <ShoppingCart className="mb-2 h-8 w-8" />
                      <p className="text-sm">Search and add medicines to start a bill.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <span>Cart · {cart.length} item{cart.length > 1 ? 's' : ''}</span>
                        <span className="normal-case tracking-normal text-slate-400">
                          Prices shown {gstMode === 'INCLUSIVE' ? 'inclusive' : 'exclusive'} of GST
                        </span>
                      </div>
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="py-2.5 px-3">Item</th>
                            <th className="py-2.5 px-3">Qty</th>
                            <th className="py-2.5 px-3">Unit Price</th>
                            <th className="py-2.5 px-3">GST%</th>
                            <th className="py-2.5 px-3">Taxable Value</th>
                            <th className="py-2.5 px-3">GST Amt</th>
                            <th className="py-2.5 px-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cart.map((l) => {
                            const { base, gst } = lineAmounts(l, gstMode);
                            return (
                              <tr key={l.medicineId}>
                                <td className="px-3 py-2.5 font-medium text-slate-700">{l.name}</td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => updateQty(l.medicineId, l.quantity - 1)}
                                      className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <input
                                      className="input h-8 w-14 text-center"
                                      type="number"
                                      min={1}
                                      max={l.availableStock}
                                      value={l.quantity}
                                      onChange={(e) => updateQty(l.medicineId, Number(e.target.value))}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateQty(l.medicineId, l.quantity + 1)}
                                      className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600">₹{l.sellingPrice}</td>
                                <td className="px-3 py-2.5 text-slate-600">{l.gstPercentage}%</td>
                                <td className="px-3 py-2.5 text-slate-600">₹{base.toFixed(2)}</td>
                                <td className="px-3 py-2.5 text-slate-600">₹{gst.toFixed(2)}</td>
                                <td className="px-3 py-2.5 text-right">
                                  <button
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                    onClick={() => removeLine(l.medicineId)}
                                    title="Remove"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. Prescription upload — last step */}
                <div className="rounded-xl border border-slate-100 p-4">
                  <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <FileText className="h-4 w-4 text-brand-600" />
                    Prescription
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="label !flex items-center gap-1.5">
                        <Upload className="h-3.5 w-3.5" /> Prescription (image/PDF)
                      </label>
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 transition-colors hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700">
                        <Upload className="h-4 w-4" />
                        {prescriptionFile ? prescriptionFile.name : 'Click to upload prescription'}
                        <input
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          onChange={(e) => setPrescriptionFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>

              {/* Right: bill summary — unchanged */}
              <div className="flex flex-col gap-4">
                <div className="sticky top-0 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Amount to collect</p>
                  <p className="mb-3 flex items-center gap-1 text-3xl font-semibold text-brand-700">
                    <IndianRupee className="h-6 w-6" />
                    {(estimatedSubtotal + estimatedGst).toFixed(2)}
                  </p>

                  <div className="space-y-1.5 border-t border-slate-200 pt-3 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{estimatedSubtotal.toFixed(2)}</span>
                    </div>
                    {isInterState ? (
                      <div className="flex justify-between">
                        <span>IGST</span>
                        <span>₹{estimatedIgst.toFixed(2)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>CGST</span>
                          <span>₹{estimatedCgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST</span>
                          <span>₹{estimatedSgst.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Final split is recomputed server-side.</p>

                  <button
                    className="btn-primary mt-4 w-full justify-center"
                    disabled={cart.length === 0 || submitting}
                    onClick={submitBill}
                  >
                    {submitting ? 'Creating…' : 'Create Bill'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create doctor mini modal */}
      {showCreateDoctor && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => !creatingDoctor && setShowCreateDoctor(false)}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                <h3 className="text-sm font-semibold">New Doctor</h3>
              </div>
              <button onClick={() => setShowCreateDoctor(false)} className="rounded-full p-1.5 hover:bg-white/15">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div>
                <label className="label">Doctor name *</label>
                <input className="input" value={newDoctorName} onChange={(e) => setNewDoctorName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label">Specialization</label>
                <input
                  className="input"
                  placeholder="e.g. General Physician"
                  value={newDoctorSpecialization}
                  onChange={(e) => setNewDoctorSpecialization(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={newDoctorPhone} onChange={(e) => setNewDoctorPhone(e.target.value)} />
              </div>
              {createDoctorError && <p className="text-sm text-red-600">{createDoctorError}</p>}
              <div className="flex items-center gap-2 pt-1">
                <button
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowCreateDoctor(false)}
                  disabled={creatingDoctor}
                >
                  Cancel
                </button>
                <button className="btn-primary flex-1 justify-center" onClick={submitCreateDoctor} disabled={creatingDoctor}>
                  {creatingDoctor ? 'Saving…' : 'Save doctor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create hospital mini modal */}
      {showCreateHospital && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => !creatingHospital && setShowCreateHospital(false)}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <h3 className="text-sm font-semibold">New Hospital</h3>
              </div>
              <button onClick={() => setShowCreateHospital(false)} className="rounded-full p-1.5 hover:bg-white/15">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div>
                <label className="label">Hospital name *</label>
                <input className="input" value={newHospitalName} onChange={(e) => setNewHospitalName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label !flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </label>
                <input className="input" value={newHospitalAddress} onChange={(e) => setNewHospitalAddress(e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={newHospitalPhone} onChange={(e) => setNewHospitalPhone(e.target.value)} />
              </div>
              {createHospitalError && <p className="text-sm text-red-600">{createHospitalError}</p>}
              <div className="flex items-center gap-2 pt-1">
                <button
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowCreateHospital(false)}
                  disabled={creatingHospital}
                >
                  Cancel
                </button>
                <button className="btn-primary flex-1 justify-center" onClick={submitCreateHospital} disabled={creatingHospital}>
                  {creatingHospital ? 'Saving…' : 'Save hospital'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}