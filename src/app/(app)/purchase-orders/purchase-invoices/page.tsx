'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import RecordPaymentModal from '@/components/RecordPaymentModal';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    DUE: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    PAID: 'bg-brand-100 text-brand-700',
};

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
        console.log(selectedSupplier, inv.supplierId)
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
                <h1 className="text-3xl font-bold text-slate-900">
                    Purchase Invoices
                </h1>
                <Link href='/purchase-orders/purchase-invoices/new' className='bg-green-700'>Create Invoice</Link>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="grid gap-5 md:grid-cols-5">

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Search
                        </label>

                        <input
                            className="input"
                            placeholder="Invoice / GRN"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Supplier
                        </label>

                        <select
                            className="input"
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
                        <label className="mb-2 block text-sm font-medium">
                            Status
                        </label>

                        <select
                            className="input"
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
                        <label className="mb-2 block text-sm font-medium">
                            From
                        </label>

                        <input
                            type="date"
                            className="input"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            To
                        </label>

                        <input
                            type="date"
                            className="input"
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
                        className="rounded-lg border px-5 py-2 text-sm font-medium hover:bg-slate-50"
                    >
                        Clear Filters
                    </button>

                </div>

            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                <table className="w-full">

                    <thead className="border-b bg-slate-50">
                        <tr className="text-left text-sm font-semibold text-slate-700">
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Invoice #</th>
                            <th className="px-6 py-4">Supplier</th>
                            <th className="px-6 py-4">GRN #</th>
                            <th className="px-6 py-4 text-right">Amount Due</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredInvoices.map((inv) => (
                            <tr
                                key={inv.id}
                                className="border-b hover:bg-slate-50"
                            >
                                <td className="px-6 py-5">
                                    <span
                                        className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_COLORS[inv.paymentStatus]}`}
                                    >
                                        {inv.paymentStatus}
                                    </span>
                                </td>

                                <td className="px-6">
                                    {new Date(inv.invoiceDate).toLocaleDateString()}
                                </td>

                                <td className="px-6 font-medium">
                                    {inv.invoiceNumber}
                                </td>

                                <td className="px-6">
                                    <div className="font-medium">
                                        {inv.supplier.name}
                                    </div>

                                    <div className="text-xs text-slate-500">
                                        Supplier
                                    </div>
                                </td>

                                <td className="px-6">
                                    <Link
                                        href={`/purchase-orders/purchase-invoices/${inv.id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {inv.grnNumber}
                                    </Link>
                                </td>

                                <td className="px-6 text-right">
                                    <div className="text-lg font-semibold">
                                        ₹{Number(inv.remainingAmount).toFixed(2)}
                                    </div>

                                    <div className="text-xs text-slate-500">
                                        Total ₹{Number(inv.totalAmount).toFixed(2)}
                                    </div>
                                </td>

                                <td className="px-6 text-center">
                                    <button
                                        onClick={() => openPaymentModal(inv)}
                                        className="font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Record Payment
                                    </button>
                                </td>
                            </tr>
                        ))}
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