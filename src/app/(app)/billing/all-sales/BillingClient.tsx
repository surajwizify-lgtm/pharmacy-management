// app/billing/BillingClient.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SalesReturnModal from '@/components/SalesReturnModal';
import { RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { Bill, product, PaymentMethod } from '@/types';
import BillInvoice from '@/components/BillInvoice';
import InvoicePrintStyles from '@/components/InvoicePrintStyles';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { downloadInvoicePdf } from '@/lib/invoice-pdf';
import {
    X,
    Search,
    Receipt,
    CreditCard,
    Printer,
    Download,
    FileText,
} from 'lucide-react';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import { CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/data-table/data-table';
import { getColumns } from './column';

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

export default function BillingClient({ initialBills }: { initialBills: Bill[] }) {
    const router = useRouter();

    const [bills, setBills] = useState<Bill[]>(initialBills);

    useEffect(() => {
        setBills(initialBills);
    }, [initialBills]);

    const [returningBillId, setReturningBillId] = useState<number | null>(null);

    const [billSearch, setBillSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('ALL');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [listError, setListError] = useState<string | null>(null);

    const [viewingBill, setViewingBill] = useState<Bill | null>(null);
    const [loadingViewBill, setLoadingViewBill] = useState(false);
    const [viewError, setViewError] = useState<string | null>(null);
    const [showViewBill, setShowViewBill] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const [showInvoicePopup, setShowInvoicePopup] = useState(false);

    async function deleteBill(id: number, billNumber: string) {
        if (!confirm(`Delete bill ${billNumber}? This cannot be undone.`)) return;
        setDeletingId(id);
        setListError(null);
        try {
            await apiFetch(`/api/bills/${id}`, { method: 'DELETE' });
            setBills((prev) => prev.filter((b) => b.id !== id)); // optimistic
            router.refresh(); // sync server-fetched data too
        } catch (err) {
            setListError(err instanceof ApiClientError ? err.message : 'Could not delete bill');
        } finally {
            setDeletingId(null);
        }
    }

    async function openViewBill(id: number) {
        setShowInvoicePopup(false);
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

    async function openInvoicePopup(id: number) {
        setShowViewBill(false);
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
            (b.customer?.name ?? '').toLowerCase().includes(billSearch.toLowerCase());
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
            setReturningBillId(billId);
        }
    }

    const viewingTotalPaid = viewingBill ? (viewingBill.payments ?? []).reduce((s, p) => s + Number(p.amount), 0) : 0;
    const viewingBalanceDue = viewingBill ? Number(viewingBill.totalAmount) - viewingTotalPaid : 0;

    const columns = getColumns({
        handleReturnClick,
        openViewBill,
        openInvoicePopup,
        deleteBill,
        deletingId,
    });

    return (
        <div className="space-y-6">
            <PageHeader header={`Invoices`} subheader="Manage all pharmacy bills.">
                <HeaderButton text="Costomer Bill" href="/billing/all-sales/new" />
            </PageHeader>
            <Container>
                <div className="w-full">
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
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
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

                        <DataTable columns={columns} data={filteredBills} />
                    </div>
                </div>

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
                                {(viewingBill.customer?.name || viewingBill.customer?.phone || viewingBill.customer?.gstin) && (
                                    <div className="rounded-xl border border-slate-100 p-4 text-sm text-slate-600">
                                        {viewingBill.customer?.name && <p>Customer: {viewingBill.customer.name}</p>}
                                        {viewingBill.ipOp && <p>Ip/Op: {viewingBill.ipOp}</p>}
                                        {viewingBill.customer?.phone && <p>Phone: {viewingBill.customer.phone}</p>}
                                        {viewingBill.customer?.gstin && <p>GSTIN: {viewingBill.customer.gstin}</p>}
                                        <p>{viewingBill.isInterState ? 'Inter-state sale (IGST)' : 'Intra-state sale (CGST + SGST)'}</p>
                                    </div>
                                )}

                                <Table className="table-fixed">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Batch</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Unit Price</TableHead>
                                            <TableHead>GST</TableHead>
                                            <TableHead>Line Total</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {viewingBill.billItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.product?.name ?? `#${item.productId}`}</TableCell>
                                                <TableCell>{item.batchNumber}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>₹{item.unitPrice}</TableCell>
                                                <TableCell>
                                                    {viewingBill.isInterState
                                                        ? `IGST ₹${item.igstAmount}`
                                                        : `CGST ₹${item.cgstAmount} + SGST ₹${item.sgstAmount}`}
                                                </TableCell>
                                                <TableCell>₹{item.totalAmount}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <CardContent className="rounded-xl border border-slate-100 p-5">
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
                                    </CardContent>

                                    <CardContent className="rounded-xl border border-slate-100 p-5">
                                        <h2 className="mb-3 flex items-center gap-1.5 font-medium text-slate-800">
                                            <CreditCard className="h-4 w-4 text-brand-600" />
                                            Payment
                                        </h2>

                                        <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                                            <span className="text-slate-500">Status</span>
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(viewingBill.paymentStatus)}`}>
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
                                    </CardContent>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
            </Container>

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
                    onSuccess={() => router.refresh()}
                />
            )}

            <InvoicePrintStyles />
        </div>
    );
}