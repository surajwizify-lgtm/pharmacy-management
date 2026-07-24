'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import type { Bill } from '@/types';
import BillInvoice from '@/components/BillInvoice';
import InvoicePrintStyles from '@/components/InvoicePrintStyles';
import { downloadInvoicePdf } from '@/lib/invoice-pdf';
import { ArrowLeft, Printer, Download, Pencil, ArrowLeftIcon } from 'lucide-react';
import Container from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { Router } from 'next/router';
import { useRouter } from 'next/navigation';
import DetailPageHeader from '@/components/common/DetailPageHeader';

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
    <div>
      <DetailPageHeader
        backHref="/products"
        backLabel="Back to products"
        title={bill.billNumber}
        subtitle={
          <>
            Cashier: {bill.cashier?.fullName}
          </>
        }
        status={{
          label: 'status',
          active: true,
        }}
        actions={
          true && (
            <Button
              variant={'success'}
              onClick={handlePrint}
            // className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          )
        }
      />
      <Container>
        <div className="space-y-6">
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            {/*<Button variant={'destructive'} onClick={() => router.back()}
            // className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to billing
            </Button> */}

            <div className="flex items-center gap-2">
              {/* <Button style={{ color: "grey" }} variant={'secondary'}>
                <Link
                  href={`/billing/${bill.id}?edit=1`}
                  className='flex'
                // className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
              </Button> */}
              {/* <Button
                variant={'success'}
                onClick={handleDownloadPdf}
                disabled={downloading}
              // className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Preparing…' : 'Download PDF'}
              </Button> */}
              {/* <Button onClick={handlePrint}
                variant={'success'}
              // className="btn-primary inline-flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button> */}
            </div>
          </div>
          <BillInvoice bill={bill} />
          <InvoicePrintStyles />
        </div>
      </Container>
    </div>
  );
}
