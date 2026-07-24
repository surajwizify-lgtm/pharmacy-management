'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    DUE: 'bg-danger-100 text-danger-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    PAID: 'bg-secondary-100 text-secondary-700',
};

const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelClass = 'mb-2 block text-sm font-medium text-neutral-700';

export default function PurchaseInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const loadInvoices = async () => {
        const data = await apiFetch<any[]>('/api/purchase-invoices');
        setInvoices(data);
    };


    useEffect(() => {
        loadInvoices();
    }, []);

    const openPaymentModal = (invoice: any) => {
        setSelectedInvoice(invoice);
        setShowPaymentForm(true);
    };
    useEffect(() => {
        loadInvoices();

        fetch('/api/suppliers')
            .then((res) => res.json())
            .then(setSuppliers);
    }, []);
    const filteredInvoices = invoices.filter((inv) => {
        const supplierMatch =
            !selectedSupplier || inv.supplierId == selectedSupplier;
        const statusMatch =
            !paymentStatus || inv.paymentStatus === paymentStatus;

        const searchMatch =
            !search ||
            inv.invoiceNumber
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            inv.grnNumber
                .toLowerCase()
                .includes(search.toLowerCase());

        const invoiceDate = new Date(inv.invoiceDate);

        const fromMatch =
            !fromDate || invoiceDate >= new Date(fromDate);

        const toMatch =
            !toDate || invoiceDate <= new Date(toDate);

        return (
            supplierMatch &&
            statusMatch &&
            searchMatch &&
            fromMatch &&
            toMatch
        );
    });

    return (
        <div className="">
            <PageHeader
                header={`Purchase Invoices`}
                subheader="View All Purchase Invoices"
            >
                <HeaderButton text="Create Invoice" href='/purchase-orders/purchase-invoices/new' />
            </PageHeader>


            <Container>
                {/* Filters */}
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">

                    <div className="grid gap-5 md:grid-cols-5">

                        <div>
                            <label className={labelClass}>
                                Search
                            </label>

                            <Input
                                // className={inputClass}
                                placeholder="Invoice / GRN"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Supplier
                            </label>

                            <select
                                className={inputClass}
                                value={selectedSupplier}
                                onChange={(e) =>
                                    setSelectedSupplier(e.target.value)
                                }
                            >
                                <option value="">All Suppliers</option>

                                {suppliers.map((supplier) => (
                                    <option
                                        key={supplier.id}
                                        value={supplier.id}
                                    >
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>
                                Status
                            </label>

                            <select
                                className={inputClass}
                                value={paymentStatus}
                                onChange={(e) =>
                                    setPaymentStatus(e.target.value)
                                }
                            >
                                <option value="">All</option>
                                <option value="DUE">Due</option>
                                <option value="PARTIAL">Partial</option>
                                <option value="PAID">Paid</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>
                                From
                            </label>
                            <DatePicker
                                value={fromDate}
                                onChange={setFromDate}
                            />

                            {/* <input
                                type="date"
                                className={inputClass}
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            /> */}
                        </div>

                        <div>
                            <label className={labelClass}>
                                To
                            </label>

                            <DatePicker
                                value={toDate}
                                onChange={setToDate}
                            />

                            {/* <input
                                type="date"
                                className={inputClass}
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            /> */}
                        </div>

                    </div>

                    <div className="mt-5 flex justify-end">

                        <button
                            onClick={() => {
                                setSearch('');
                                setSelectedSupplier('');
                                setPaymentStatus('');
                                setFromDate('');
                                setToDate('');
                            }}
                            className="rounded-lg border border-neutral-300 bg-white px-5 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                        >
                            Clear Filters
                        </button>

                    </div>

                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>GRN #</TableHead>
                                <TableHead>Amount Due</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        No purchase invoices match these filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell>
                                            <span
                                                className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_COLORS[inv.paymentStatus]}`}
                                            >
                                                {inv.paymentStatus}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            {new Date(inv.invoiceDate).toLocaleDateString()}
                                        </TableCell>

                                        <TableCell>
                                            {inv.invoiceNumber}
                                        </TableCell>

                                        <TableCell>
                                            <div>{inv.supplier.name}</div>
                                            <div>Supplier</div>
                                        </TableCell>

                                        <TableCell>
                                            <Link href={`/purchase-orders/purchase-invoices/${inv.id}`}>
                                                {inv.grnNumber}
                                            </Link>
                                        </TableCell>

                                        <TableCell>
                                            <div>
                                                ₹{Number(inv.remainingAmount).toFixed(2)}
                                            </div>
                                            <div>
                                                Total ₹{Number(inv.totalAmount).toFixed(2)}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <Button
                                                variant="link"
                                                onClick={() => openPaymentModal(inv)}
                                            >
                                                Record Payment
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Container>

            <RecordPaymentModal
                open={showPaymentForm}
                invoice={selectedInvoice}
                onClose={() => {
                    setShowPaymentForm(false);
                    setSelectedInvoice(null);
                }}
                onSuccess={loadInvoices}
            />

        </div>
    );
}