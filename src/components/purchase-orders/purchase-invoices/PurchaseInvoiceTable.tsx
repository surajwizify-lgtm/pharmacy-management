'use client'
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import Container from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api-client';
import AppSelect from '@/components/common/AppSelect';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/data-table/data-table';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    DUE: 'bg-danger-100 text-danger-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    PAID: 'bg-secondary-100 text-secondary-700',
};

const labelClass = 'mb-2 block text-sm font-medium text-neutral-700';

interface Invoice {
    id: number;
    invoiceNumber: string;
    grnNumber: string;
    invoiceDate: string;
    totalAmount: number;
    remainingAmount: number;
    paymentStatus: string;
    supplierId: number;
    supplier: { name: string };
}

type Props = {
    invoices: Invoice[];
    suppliers: any[];
};

export default function PurchaseInvoicesTable({ invoices, suppliers }: Props) {
    const [invoiceList, setInvoiceList] = useState<Invoice[]>(invoices);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const openPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentForm(true);
    };

    const filteredInvoices = useMemo(() => {
        return invoiceList.filter((inv) => {
            const supplierMatch = !selectedSupplier || inv.supplierId == (selectedSupplier as any);
            const statusMatch =
                !paymentStatus ||
                inv.paymentStatus.toUpperCase() === paymentStatus.toUpperCase() ||
                paymentStatus.toUpperCase() === 'ALL';

            const searchMatch =
                !search ||
                inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
                inv.grnNumber.toLowerCase().includes(search.toLowerCase());

            const invoiceDate = new Date(inv.invoiceDate);
            const fromMatch = !fromDate || invoiceDate >= new Date(fromDate);
            const toMatch = !toDate || invoiceDate <= new Date(toDate);

            return supplierMatch && statusMatch && searchMatch && fromMatch && toMatch;
        });
    }, [invoiceList, selectedSupplier, paymentStatus, search, fromDate, toDate]);

    const refreshInvoices = async () => {
        const updated = await apiFetch<Invoice[]>('/api/purchase-invoices');
        setInvoiceList(updated);
    };

    const supplierOptions = [
        { label: 'All Suppliers', value: '' },
        ...suppliers.map((supplier: any) => ({
            label: supplier.name,
            value: supplier.id.toString(),
        })),
    ];

    const columns: ColumnDef<Invoice>[] = [
        {
            accessorKey: 'paymentStatus',
            header: 'Status',
            cell: ({ row }) => (
                <span
                    className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_COLORS[row.original.paymentStatus]}`}
                >
                    {row.original.paymentStatus}
                </span>
            ),
        },
        {
            accessorKey: 'invoiceDate',
            header: 'Date',
            cell: ({ row }) => <span>{new Date(row.original.invoiceDate).toLocaleDateString()}</span>,
        },
        {
            accessorKey: 'invoiceNumber',
            header: 'Invoice #',
        },
        {
            id: 'supplier',
            header: 'Supplier',
            accessorFn: (row) => row.supplier?.name ?? '',
            cell: ({ row }) => (
                <div>
                    <div>{row.original.supplier?.name}</div>
                    <div className="text-xs text-neutral-400">Supplier</div>
                </div>
            ),
        },
        {
            accessorKey: 'grnNumber',
            header: 'GRN #',
            cell: ({ row }) => (
                <Link
                    href={`/purchase-orders/purchase-invoices/${row.original.id}`}
                    className="text-primary-600 hover:underline"
                >
                    {row.original.grnNumber}
                </Link>
            ),
        },
        {
            accessorKey: 'remainingAmount',
            header: 'Amount Due',
            cell: ({ row }) => (
                <div>
                    <div>₹{Number(row.original.remainingAmount).toFixed(2)}</div>
                    <div className="text-xs text-neutral-400">
                        Total ₹{Number(row.original.totalAmount).toFixed(2)}
                    </div>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Button variant="link" onClick={() => openPaymentModal(row.original)}>
                    Record Payment
                </Button>
            ),
        },
    ];

    return (
        <Container>
            <Card>
                <CardContent className="grid gap-5 place-content-center place-items-center md:grid-cols-6">
                    <div>
                        <label className={labelClass}>Search</label>
                        <Input
                            placeholder="Invoice / GRN"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Supplier</label>
                        <AppSelect
                            onChange={setSelectedSupplier}
                            options={supplierOptions}
                            value={selectedSupplier}
                            placeholder="Filter Supplier"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <AppSelect
                            onChange={setPaymentStatus}
                            options={[
                                { label: 'All', value: 'All' },
                                { label: 'Due', value: 'Due' },
                                { label: 'Partial', value: 'Partial' },
                                { label: 'Paid', value: 'Paid' },
                            ]}
                            value={paymentStatus}
                            placeholder="Status"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>From</label>
                        <DatePicker value={fromDate} onChange={setFromDate} />
                    </div>
                    <div>
                        <label className={labelClass}>To</label>
                        <DatePicker value={toDate} onChange={setToDate} />
                    </div>
                    <Button
                        onClick={() => {
                            setSearch('');
                            setSelectedSupplier('');
                            setPaymentStatus('');
                            setFromDate('');
                            setToDate('');
                        }}
                        variant="outline"
                        className="mt-6"
                    >
                        Clear Filters
                    </Button>
                </CardContent>
            </Card>

            <DataTable columns={columns} data={filteredInvoices} />

            <RecordPaymentModal
                open={showPaymentForm}
                invoice={selectedInvoice}
                onClose={() => {
                    setShowPaymentForm(false);
                    setSelectedInvoice(null);
                }}
                onSuccess={refreshInvoices}
            />
        </Container>
    );
}