'use client'
import { useState } from 'react';
import Link from 'next/link';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import Container from '@/components/common/Container';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api-client';
import AppSelect from '@/components/common/AppSelect';
import { Card, CardContent } from '@/components/ui/card';


const PAYMENT_STATUS_COLORS: Record<string, string> = {
    DUE: 'bg-danger-100 text-danger-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    PAID: 'bg-secondary-100 text-secondary-700',
};

const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelClass = 'mb-2 block text-sm font-medium text-neutral-700';
type props = {
    invoices: any
    suppliers: any
}

export default function PurchaseInvoicesTable({ invoices, suppliers }: props) {
    const [invoiceList, setInvoiceList] = useState(invoices);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');



    const openPaymentModal = (invoice: any) => {
        setSelectedInvoice(invoice);
        setShowPaymentForm(true);
    };


    const filteredInvoices = invoiceList.filter((inv: any) => {
        const supplierMatch =
            !selectedSupplier || inv.supplierId == selectedSupplier;
        const statusMatch =
            !paymentStatus || inv.paymentStatus.toUpperCase() === paymentStatus.toUpperCase() || paymentStatus.toUpperCase() == 'ALL';

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
    const refreshInvoices = async () => {
        const updated = await apiFetch("/api/purchase-invoices");
        setInvoiceList(updated);
    };
    const supplierOptions = [
        { label: "All Suppliers", value: "" },
        ...suppliers.map((supplier: any) => ({
            label: supplier.name,
            value: supplier.id.toString(),
        })),
    ];
    return (
        <Container>
            <Card >
                <CardContent className="grid gap-5  place-content-center place-items-center md:grid-cols-6">
                    <div>
                        <label className={labelClass}>
                            Search
                        </label>

                        <Input
                            placeholder="Invoice / GRN"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>
                            Supplier
                        </label>
                        <AppSelect onChange={setSelectedSupplier} options={supplierOptions} value={selectedSupplier} placeholder='Filter Supplier' />
                    </div>
                    <div>
                        <label className={labelClass}>
                            Status
                        </label>
                        <AppSelect onChange={setPaymentStatus} options={[{ label: 'All', value: 'All' }, { label: 'Due', value: 'Due' }, { label: 'Partial', value: 'Partial' }, { label: 'Paid', value: 'Paid' },]} value={paymentStatus} placeholder='Status' />
                    </div>

                    <div>
                        <label className={labelClass}>
                            From
                        </label>
                        <DatePicker
                            value={fromDate}
                            onChange={setFromDate}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            To
                        </label>

                        <DatePicker
                            value={toDate}
                            onChange={setToDate}
                        />
                    </div>
                    <Button
                        onClick={() => {
                            setSearch('');
                            setSelectedSupplier('');
                            setPaymentStatus('');
                            setFromDate('');
                            setToDate('');
                        }}
                        variant={'outline'}
                        className={'mt-6'}
                    // className="rounded-lg border border-neutral-300 bg-white px-5 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                        Clear Filters
                    </Button>
                </CardContent>

            </Card>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">

                <Table className="table-fixed">
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
                            filteredInvoices.map((inv: any) => (
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
            <RecordPaymentModal
                open={showPaymentForm}
                invoice={selectedInvoice}
                onClose={() => {
                    setShowPaymentForm(false);
                    setSelectedInvoice(null);
                }}
                onSuccess={refreshInvoices}
            />
        </Container >
    )
}
