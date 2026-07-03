'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { Bill, Medicine } from '@/types';

interface CartLine {
  medicineId: number;
  name: string;
  gstPercentage: string;
  quantity: number;
  batchId?: number;
  availableStock: number;
  sellingPrice: string;
}

export default function BillingPage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [isInterState, setIsInterState] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBill, setLastBill] = useState<Bill | null>(null);

  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [showCreateBill, setShowCreateBill] = useState(false);


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

  const estimatedSubtotal = cart.reduce((sum, l) => sum + Number(l.sellingPrice) * l.quantity, 0);
  const estimatedGst = cart.reduce(
    (sum, l) => sum + (Number(l.sellingPrice) * l.quantity * Number(l.gstPercentage)) / 100,
    0,
  );
  const filteredBills = bills.filter((bill) => {
    const query = search.toLowerCase();

    return (
      bill.billNumber?.toLowerCase().includes(query) ||
      bill.customerName?.toLowerCase().includes(query) ||
      bill.customerPhone?.toLowerCase().includes(query)
    );
  });

  async function submitBill() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const bill = await apiFetch<Bill>('/api/bills', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((l) => ({ medicineId: l.medicineId, quantity: l.quantity })),
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          customerGstin: customerGstin || undefined,
          isInterState,
        }),
      });
      setLastBill(bill);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerGstin('');
      setIsInterState(false);
      loadBills();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Billing
          </h1>
          <p className="text-sm text-slate-500">
            Manage all pharmacy bills.
          </p>
        </div>

        <button
          onClick={() => setShowCreateBill(true)}
          className="btn-primary"
        >
          + Create New Bill
        </button>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-3 h-5 w-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            type="text"
            placeholder="Search by bill no, customer name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="card overflow-hidden">

        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3 text-left">Bill No</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>

            {loadingBills ? (

              <tr>
                <td colSpan={6} className="p-6 text-center">
                  Loading...
                </td>
              </tr>

            ) : bills.length === 0 ? (

              <tr>
                <td colSpan={6} className="p-6 text-center">
                  No bills found.
                </td>
              </tr>

            ) : (

              bills.map((bill) => (
                <tr key={bill.id} className="border-b">

                  <td className="p-3 font-medium">
                    {bill.billNumber}
                  </td>

                  <td className="p-3">
                    {bill.customerName || "Walk In"}
                  </td>

                  <td className="p-3">
                    {new Date(bill.billDate).toLocaleDateString()}
                  </td>

                  <td className="p-3">
                    ₹{bill.totalAmount}
                  </td>

                  <td className="p-3">
                    {bill.paymentStatus}
                  </td>

                  <td className="p-3 text-right">

                    <Link
                      href={`/billing/${bill.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>

                  </td>

                </tr>
              ))

            )}

          </tbody>
        </table>

      </div>
      {/* <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 font-medium text-slate-800">New bill</h2>

          <div className="relative mb-4">
            <input
              className="input"
              placeholder="Search medicine by name, barcode, or HSN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                {results.map((m) => {
                  const stock = m.batches.reduce((s, b) => s + b.quantityAvailable, 0);
                  return (
                    <button
                      key={m.id}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => addToCart(m)}
                    >
                      <span>{m.name}</span>
                      <span className="text-xs text-slate-400">{stock} in stock</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Search and add medicines to start a bill.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">GST</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((l) => (
                  <tr key={l.medicineId}>
                    <td className="py-2">{l.name}</td>
                    <td className="py-2">
                      <input
                        className="input w-20"
                        type="number"
                        min={1}
                        max={l.availableStock}
                        value={l.quantity}
                        onChange={(e) => updateQty(l.medicineId, Number(e.target.value))}
                      />
                    </td>
                    <td className="py-2">₹{l.sellingPrice}</td>
                    <td className="py-2">{l.gstPercentage}%</td>
                    <td className="py-2 text-right">
                      <button className="text-xs font-medium text-red-600 hover:underline" onClick={() => removeLine(l.medicineId)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <div>
              <label className="label">Customer name</label>
              <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div>
              <label className="label">Customer phone</label>
              <input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div>
              <label className="label">Customer GSTIN (B2B, optional)</label>
              <input className="input" value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())} />
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isInterState} onChange={(e) => setIsInterState(e.target.checked)} />
              Inter-state sale (charges IGST instead of CGST+SGST)
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="text-sm text-slate-600">
              Subtotal ₹{estimatedSubtotal.toFixed(2)} + est. GST ₹{estimatedGst.toFixed(2)} ={' '}
              <span className="font-semibold text-slate-900">₹{(estimatedSubtotal + estimatedGst).toFixed(2)}</span>
              <span className="ml-1 text-xs text-slate-400">(final split computed server-side)</span>
            </div>
            <button className="btn-primary" disabled={cart.length === 0 || submitting} onClick={submitBill}>
              {submitting ? 'Creating…' : 'Create bill'}
            </button>
          </div>

          {lastBill && (
            <div className="mt-4 rounded-lg bg-brand-50 p-4 text-sm">
              Bill <span className="font-semibold">{lastBill.billNumber}</span> created — total ₹
              {lastBill.totalAmount}.{' '}
              <Link href={`/billing/${lastBill.id}`} className="font-medium text-brand-700 hover:underline">
                View / record payment →
              </Link>
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-medium text-slate-800">Recent bills</h2>
          {loadingBills ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : bills.length === 0 ? (
            <p className="text-sm text-slate-400">No bills yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {bills.slice(0, 15).map((b) => (
                <li key={b.id} className="py-2">
                  <Link href={`/billing/${b.id}`} className="flex items-center justify-between text-sm hover:text-brand-600">
                    <span>
                      <span className="font-medium text-slate-800">{b.billNumber}</span>
                      <br />
                      <span className="text-xs text-slate-400">{new Date(b.billDate).toLocaleString()}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-medium">₹{b.totalAmount}</span>
                      <span
                        className={`badge ${b.paymentStatus === 'PAID'
                          ? 'bg-brand-100 text-brand-700'
                          : b.paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div> */}
      {showCreateBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

          <div className="max-h-[90vh] w-[95%] max-w-6xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-xl font-semibold">
                Create New Bill
              </h2>

              <button
                onClick={() => setShowCreateBill(false)}
                className="rounded px-3 py-1 hover:bg-slate-100"
              >
                ✕
              </button>

            </div><div className="card p-5 lg:col-span-2">
              <h2 className="mb-3 font-medium text-slate-800">New bill</h2>

              <div className="relative mb-4">
                <input
                  className="input"
                  placeholder="Search medicine by name, barcode, or HSN…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {results.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    {results.map((m) => {
                      const stock = m.batches.reduce((s, b) => s + b.quantityAvailable, 0);
                      return (
                        <button
                          key={m.id}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                          onClick={() => addToCart(m)}
                        >
                          <span>{m.name}</span>
                          <span className="text-xs text-slate-400">{stock} in stock</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {cart.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Search and add medicines to start a bill.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2">Item</th>
                      <th className="py-2">Qty</th>
                      <th className="py-2">Price</th>
                      <th className="py-2">GST</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((l) => (
                      <tr key={l.medicineId}>
                        <td className="py-2">{l.name}</td>
                        <td className="py-2">
                          <input
                            className="input w-20"
                            type="number"
                            min={1}
                            max={l.availableStock}
                            value={l.quantity}
                            onChange={(e) => updateQty(l.medicineId, Number(e.target.value))}
                          />
                        </td>
                        <td className="py-2">₹{l.sellingPrice}</td>
                        <td className="py-2">{l.gstPercentage}%</td>
                        <td className="py-2 text-right">
                          <button className="text-xs font-medium text-red-600 hover:underline" onClick={() => removeLine(l.medicineId)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <div>
                  <label className="label">Customer name</label>
                  <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Customer phone</label>
                  <input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
                <div>
                  <label className="label">Customer GSTIN (B2B, optional)</label>
                  <input className="input" value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())} />
                </div>
                <label className="mt-6 flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={isInterState} onChange={(e) => setIsInterState(e.target.checked)} />
                  Inter-state sale (charges IGST instead of CGST+SGST)
                </label>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="text-sm text-slate-600">
                  Subtotal ₹{estimatedSubtotal.toFixed(2)} + est. GST ₹{estimatedGst.toFixed(2)} ={' '}
                  <span className="font-semibold text-slate-900">₹{(estimatedSubtotal + estimatedGst).toFixed(2)}</span>
                  <span className="ml-1 text-xs text-slate-400">(final split computed server-side)</span>
                </div>
                <button className="btn-primary" disabled={cart.length === 0 || submitting} onClick={submitBill}>
                  {submitting ? 'Creating…' : 'Create bill'}
                </button>
              </div>

              {lastBill && (
                <div className="mt-4 rounded-lg bg-brand-50 p-4 text-sm">
                  Bill <span className="font-semibold">{lastBill.billNumber}</span> created — total ₹
                  {lastBill.totalAmount}.{' '}
                  <Link href={`/billing/${lastBill.id}`} className="font-medium text-brand-700 hover:underline">
                    View / record payment →
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
