'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { Bill, PaymentMethod } from '@/types';

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBill(await apiFetch<Bill>(`/api/bills/${params.id}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function recordPayment(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/bills/${params.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), method }),
      });
      setAmount('');
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (!bill) return <p className="text-slate-400">Loading…</p>;

  const totalPaid = (bill.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const balanceDue = Number(bill.totalAmount) - totalPaid;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/billing" className="text-xs font-medium text-brand-600 hover:underline">
          ← Back to billing
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{bill.billNumber}</h1>
            <p className="text-sm text-slate-500">
              {new Date(bill.billDate).toLocaleString()} · Cashier: {bill.cashier?.fullName ?? bill.cashierId}
            </p>
          </div>
          <span
            className={`badge ${
              bill.paymentStatus === 'PAID'
                ? 'bg-brand-100 text-brand-700'
                : bill.paymentStatus === 'PARTIALLY_PAID'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
            }`}
          >
            {bill.paymentStatus}
          </span>
        </div>
      </div>

      {(bill.customerName || bill.customerPhone || bill.customerGstin) && (
        <div className="card p-4 text-sm text-slate-600">
          {bill.customerName && <p>Customer: {bill.customerName}</p>}
          {bill.customerPhone && <p>Phone: {bill.customerPhone}</p>}
          {bill.customerGstin && <p>GSTIN: {bill.customerGstin}</p>}
          <p>{bill.isInterState ? 'Inter-state sale (IGST)' : 'Intra-state sale (CGST + SGST)'}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Medicine</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Unit price</th>
              <th className="px-4 py-3">GST</th>
              <th className="px-4 py-3">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bill.billItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.medicine?.name ?? `#${item.medicineId}`}</td>
                <td className="px-4 py-3 text-slate-500">{item.batchNumber}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">₹{item.unitPrice}</td>
                <td className="px-4 py-3 text-slate-500">
                  {bill.isInterState ? `IGST ₹${item.igstAmount}` : `CGST ₹${item.cgstAmount} + SGST ₹${item.sgstAmount}`}
                </td>
                <td className="px-4 py-3 font-medium">₹{item.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-medium text-slate-800">Totals</h2>
          <dl className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={bill.subtotal} />
            {bill.isInterState ? (
              <Row label="IGST" value={bill.totalIgst} />
            ) : (
              <>
                <Row label="CGST" value={bill.totalCgst} />
                <Row label="SGST" value={bill.totalSgst} />
              </>
            )}
            <Row label="Total GST" value={bill.totalGst} />
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
              <span>Total amount</span>
              <span>₹{bill.totalAmount}</span>
            </div>
            <Row label="Paid" value={totalPaid.toFixed(2)} />
            <div className="flex justify-between font-medium text-slate-800">
              <span>Balance due</span>
              <span>₹{balanceDue.toFixed(2)}</span>
            </div>
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-medium text-slate-800">Record payment</h2>
          {balanceDue <= 0 ? (
            <p className="text-sm text-slate-400">This bill is fully paid.</p>
          ) : (
            <form onSubmit={recordPayment} className="space-y-3">
              <div>
                <label className="label">Amount</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min={0.01}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Method</label>
                <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? 'Recording…' : 'Record payment'}
              </button>
            </form>
          )}

          {bill.payments && bill.payments.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Payment history</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                {bill.payments.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>
                      {p.method} · {new Date(p.paidAt).toLocaleString()}
                    </span>
                    <span>₹{p.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>₹{value}</span>
    </div>
  );
}
