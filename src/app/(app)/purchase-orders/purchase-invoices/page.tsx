'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import RecordPaymentModal from '@/components/RecordPaymentModal';

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
        <div className="mx-auto max-w-7xl space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-neutral-900">
                    Purchase Invoices
                </h1>
                <Link
                    href='/purchase-orders/purchase-invoices/new'
                    className='rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-secondary-700'
                >
                    Create Invoice
                </Link>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">

                <div className="grid gap-5 md:grid-cols-5">

                    <div>
                        <label className={labelClass}>
                            Search
                        </label>

                        <input
                            className={inputClass}
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

                        <input
                            type="date"
                            className={inputClass}
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            To
                        </label>

                        <input
                            type="date"
                            className={inputClass}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
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

                <table className="w-full text-left">

                    <thead className="border-b border-neutral-200 bg-neutral-50">
                        <tr className="text-left text-sm font-semibold text-neutral-700">
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Invoice #</th>
                            <th className="px-6 py-4">Supplier</th>
                            <th className="px-6 py-4">GRN #</th>
                            <th className="px-6 py-4 text-right">Amount Due</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-neutral-100">
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-sm text-neutral-400">
                                    No purchase invoices match these filters.
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <tr
                                    key={inv.id}
                                    className="hover:bg-neutral-50"
                                >
                                    <td className="px-6 py-5">
                                        <span
                                            className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_COLORS[inv.paymentStatus]}`}
                                        >
                                            {inv.paymentStatus}
                                        </span>
                                    </td>

                                    <td className="px-6 text-neutral-600">
                                        {new Date(inv.invoiceDate).toLocaleDateString()}
                                    </td>

                                    <td className="px-6 font-medium text-neutral-800">
                                        {inv.invoiceNumber}
                                    </td>

                                    <td className="px-6">
                                        <div className="font-medium text-neutral-800">
                                            {inv.supplier.name}
                                        </div>

                                        <div className="text-xs text-neutral-500">
                                            Supplier
                                        </div>
                                    </td>

                                    <td className="px-6">
                                        <Link
                                            href={`/purchase-orders/purchase-invoices/${inv.id}`}
                                            className="text-primary-600 hover:text-primary-700 hover:underline"
                                        >
                                            {inv.grnNumber}
                                        </Link>
                                    </td>

                                    <td className="px-6 text-right">
                                        <div className="text-lg font-semibold text-neutral-900">
                                            ₹{Number(inv.remainingAmount).toFixed(2)}
                                        </div>

                                        <div className="text-xs text-neutral-500">
                                            Total ₹{Number(inv.totalAmount).toFixed(2)}
                                        </div>
                                    </td>

                                    <td className="px-6 text-center">
                                        <button
                                            onClick={() => openPaymentModal(inv)}
                                            className="font-medium text-primary-600 hover:text-primary-700"
                                        >
                                            Record Payment
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>

                </table>
            </div>

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