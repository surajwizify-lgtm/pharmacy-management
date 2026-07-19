'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import type { Bill } from '@/types';
import BillInvoice from '@/components/BillInvoice';
import InvoicePrintStyles from '@/components/InvoicePrintStyles';
import { downloadInvoicePdf } from '@/lib/invoice-pdf';
import { ArrowLeft, Printer, Download, Pencil } from 'lucide-react';

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function load() {
    setBill(await apiFetch<Bill>(`/api/bills/${params.id}`));
  }

  useEffect(() => {
    load();
  }, [params.id]);

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPdf() {
    if (!bill) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(bill.billNumber);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate PDF. Make sure jspdf and html2canvas are installed (npm install jspdf html2canvas).');
    } finally {
      setDownloading(false);
    }
  }

  if (!bill) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/billing/all-sales" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/billing/${bill.id}?edit=1`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Preparing…' : 'Download PDF'}
          </button>
          <button onClick={handlePrint} className="btn-primary inline-flex items-center gap-1.5">
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>
      <BillInvoice bill={bill} />
      <InvoicePrintStyles />
    </div>
  );
}
