// app/billing/returns/SalesReturnsTable.tsx
'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Customer } from '@prisma/client';

export interface ReturnItemRow {
    id: number;
    quantity: number;
    refundAmount: string;
    batch: {
        batchNumber: string;
        product: { name: string } | null;
    };
}


export interface ReturnRow {
    id: number;
    billId: number;
    reason: string | null;
    totalRefund: string;
    createdAt: string;
    bill: {
        id: number;
        billNumber: string;
        customer: Customer | null;   // ✅ nullable
        billDate: string;
    };
    returnItems: ReturnItemRow[];
}

export default function SalesReturnsTable({ data }: { data: ReturnRow[] }) {
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const from = dateFrom ? new Date(dateFrom).getTime() : null;
        const to = dateTo ? new Date(dateTo).getTime() : null;

        return data.filter((r) => {
            const matchesSearch =
                !q ||
                r.bill.billNumber.toLowerCase().includes(q) ||
                (r.bill?.customer?.name ?? '').toLowerCase().includes(q) ||
                (r.reason ?? '').toLowerCase().includes(q);

            const created = new Date(r.createdAt).getTime();
            const matchesFrom = from === null || created >= from;
            const matchesTo = to === null || created <= to;

            return matchesSearch && matchesFrom && matchesTo;
        });
    }, [data, search, dateFrom, dateTo]);

    const totalRefunded = filtered.reduce((sum, r) => sum + Number(r.totalRefund), 0);

    return (
        <>
            <div className="mb-4 flex items-center justify-end gap-2 text-sm">
                <span>Total refunded: </span>
                <span className="font-medium">{`₹${totalRefunded.toFixed(2)}`}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search bill no., customer, or reason..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <DatePicker value={dateFrom} onChange={setDateFrom} />
                <span className="text-slate-400 text-sm">to</span>
                <DatePicker value={dateTo} onChange={setDateTo} />
            </div>

            <div className="overflow-x-auto">
                <Table className="table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Return #</TableHead>
                            <TableHead>Bill</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Refund</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8}>
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <RotateCcw className="h-8 w-8" />
                                        <p>No sales returns found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((r) => (
                                <Fragment key={r.id}>
                                    <TableRow>
                                        <TableCell>#{r.id}</TableCell>

                                        <TableCell>
                                            <Link href={`/billing/${r.bill.id}`}>{r.bill.billNumber}</Link>
                                        </TableCell>

                                        <TableCell>{r.bill.customer?.name || 'Walk In'}</TableCell>

                                        <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>

                                        <TableCell>{r.reason || '-'}</TableCell>

                                        <TableCell>{r.returnItems.length}</TableCell>

                                        <TableCell>₹{Number(r.totalRefund).toFixed(2)}</TableCell>

                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                                            >
                                                {expandedId === r.id ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>

                                    {expandedId === r.id && (
                                        <TableRow>
                                            <TableCell colSpan={8}>
                                                <Table className="table-fixed">
                                                    <thead>
                                                        <tr>
                                                            <th>Product</th>
                                                            <th>Batch</th>
                                                            <th>Qty</th>
                                                            <th>Refund</th>
                                                        </tr>
                                                    </thead>

                                                    <TableBody>
                                                        {r.returnItems.map((item) => (
                                                            <tr key={item.id}>
                                                                <td className="text-center">
                                                                    {item.batch.product?.name ?? '-'}
                                                                </td>
                                                                <td className="text-center">{item.batch.batchNumber}</td>
                                                                <td className="text-center">{item.quantity}</td>
                                                                <td className="text-center">
                                                                    ₹{Number(item.refundAmount).toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}