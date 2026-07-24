import type { Bill } from '@/types';
import { Pill } from 'lucide-react';

// TODO: replace with your real pharmacy details (or load from settings/env).
const PHARMACY = {
  name: 'Formacy Pharmacy',
  tagline: 'Licensed Medical Store · GST Invoice',
  gstin: '27ABCDE1234F1Z5',
  dlNo: 'XX-YY-ZZ',
};

// The base `Bill` type (in src/types.ts) may not yet include doctor / hospital /
// prescription fields. This extends it loosely so the invoice can render them
// when present, without requiring you to touch the shared type immediately.
export interface InvoiceBill extends Bill {
  // doctor?: { name: string, id: number, } | null;
  // hospital?: { name: string; address?: string | null } | null;
  prescriptionNotes?: string | null;
}

function paymentStatusClass(status: string) {
  switch (status) {
    case 'PAID':
      return 'text-emerald-600';
    case 'PARTIALLY_PAID':
      return 'text-amber-600';
    default:
      return 'text-slate-500';
  }
}

export default function BillInvoice({ bill, className = '' }: { bill: InvoiceBill; className?: string }) {
  const lastPaymentMethod = bill.payments?.[bill.payments.length - 1]?.method;

  return (
    <div id="invoice-print-area" className={`rounded-2xl border border-slate-200 bg-white p-8 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold leading-tight text-slate-900">{PHARMACY.name}</h1>
            <p className="text-xs uppercase tracking-wide text-slate-500">{PHARMACY.tagline}</p>
            <p className="text-xs text-slate-400">
              GSTIN: {PHARMACY.gstin} · DL No: {PHARMACY.dlNo}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">Invoice</p>
          <p className="text-lg font-bold text-slate-900">{bill.billNumber}</p>
          <p className="text-xs text-slate-400">{new Date(bill.billDate).toLocaleString()}</p>
        </div>
      </div>

      <div className="my-5 h-px bg-slate-900" />

      {/* Bill to / Doctor / Payment */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Bill to</p>
          <p className="font-semibold text-slate-900">{bill?.customer?.name || 'Walk In'}</p>
          {bill?.customer?.phone && <p className="text-sm text-slate-500">{bill?.customer?.phone}</p>}
          {bill?.customer?.gstin && <p className="text-sm text-slate-500">{bill?.customer?.gstin}</p>}
        </div>
        <div className="sm:text-right">
          {bill.doctor?.name && (
            <>
              <p className="text-xs uppercase tracking-wide text-slate-400">Doctor</p>
              <p className="font-semibold text-slate-900">{bill.doctor.name}</p>
            </>
          )}
          {bill.hospital?.name && <p className="text-sm text-slate-500">{bill.hospital.name}</p>}
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">Payment</p>
          <p className={`font-semibold ${paymentStatusClass(bill.paymentStatus)}`}>
            {lastPaymentMethod ? `${lastPaymentMethod} · ` : ''}
            {bill.paymentStatus.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Items */}
      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">Item</th>
            <th className="py-2 pr-2">Batch/HSN</th>
            <th className="py-2 pr-2 text-right">Qty</th>
            <th className="py-2 pr-2 text-right">MRP</th>
            <th className="py-2 pr-2 text-right">GST%</th>
            <th className="py-2 pl-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bill.billItems.map((item, i) => (
            <tr key={item.id}>
              <td className="py-2.5 pr-2 text-slate-400">{i + 1}</td>
              <td className="py-2.5 pr-2 font-medium text-slate-800">{item.product?.name ?? `#${item.productId}`}</td>
              <td className="py-2.5 pr-2 text-slate-400">{item.batchNumber ?? '—'}</td>
              <td className="py-2.5 pr-2 text-right text-slate-600">{item.quantity}</td>
              <td className="py-2.5 pr-2 text-right text-slate-600">₹{item.unitPrice}</td>
              <td className="py-2.5 pr-2 text-right text-slate-600">
                {/* If your BillItem includes a stored gstPercentage, prefer that instead: */}
                {/* {item.gstPercentage}% */}
                {(() => {
                  const base = Number(item.unitPrice) * item.quantity;
                  if (!base) return '—';
                  const gstAmount = bill.isInterState ? Number(item.igstAmount ?? 0) : Number(item.cgstAmount ?? 0) * 2;
                  return `${((gstAmount / base) * 100).toFixed(0)}%`;
                })()}
              </td>
              <td className="py-2.5 pl-2 text-right font-medium text-slate-800">₹{item.totalAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Notes + totals */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          {bill.prescriptionNotes && (
            <>
              <p className="text-xs uppercase tracking-wide text-slate-400">Rx notes</p>
              <p className="text-sm text-slate-600">{bill.prescriptionNotes}</p>
            </>
          )}
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>₹{bill.subtotal}</span>
          </div>
          {bill.isInterState ? (
            <div className="flex justify-between text-slate-600">
              <span>IGST</span>
              <span>₹{bill.totalIgst}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-slate-600">
                <span>CGST</span>
                <span>₹{bill.totalCgst}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST</span>
                <span>₹{bill.totalSgst}</span>
              </div>
            </>
          )}
          <div className="mt-2 flex justify-between border-t border-slate-900 pt-2 text-lg font-bold text-slate-900">
            <span>Grand Total</span>
            <span>₹{bill.totalAmount}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
        <span>Thank you for shopping with {PHARMACY.name} · Get well soon.</span>
        <span>Issued by {bill.cashier?.fullName ?? bill.cashierId}</span>
      </div>
    </div>
  );
}