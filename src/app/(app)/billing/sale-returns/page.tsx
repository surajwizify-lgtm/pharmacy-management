'use client';
import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { RotateCcw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';


interface ReturnItemRow {
    id: number;
    quantity: number;
    refundAmount: string;
    batch: {
        batchNumber: string;
        product: { name: string } | null;
    };
}

interface ReturnRow {
    id: number;
    billId: number;
    reason: string | null;
    totalRefund: string;
    createdAt: string;
    bill: {
        id: number;
        billNumber: string;
        customerName: string | null;
        billDate: string;
    };
    returnItems: ReturnItemRow[];
}

export default function SalesReturnsPage() {
    const [returns, setReturns] = useState<ReturnRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (dateFrom) params.set('dateFrom', dateFrom,);
            if (dateTo) params.set('dateTo', dateTo);

            const data: any = await apiFetch<ReturnRow[]>(`/api/bills/returns?${params.toString()}`);
            setReturns(data.data);
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Failed to load returns');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [search, dateFrom, dateTo]);

    const totalRefunded = returns.reduce((sum, r) => sum + Number(r.totalRefund), 0);

    return (
        <div className="">
            <PageHeader
                header={`Sales Returns`}
                subheader="All returns processed against sales bills."
            >
                <span>Total refunded: </span>
                <span>{`₹${totalRefunded.toFixed(2)}`}</span>
            </PageHeader>

            <Container className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            // className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Search bill no., customer, or reason..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <DatePicker
                        value={dateFrom}
                        onChange={setDateFrom}
                    />
                    <span className="text-slate-400 text-sm">to</span>
                    <DatePicker
                        value={dateTo}
                        onChange={setDateTo}
                    />
                </div>

                {error && <p className="px-4 pt-3 text-sm text-red-600">{error}</p>}

                <div className="overflow-x-auto">
                    <Table>
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
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={8}>
                                            <div className="h-4 w-full animate-pulse rounded bg-muted" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : returns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <RotateCcw className="h-8 w-8" />
                                            <p>No sales returns found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                returns.map((r) => (
                                    <Fragment key={r.id}>
                                        <TableRow>
                                            <TableCell>#{r.id}</TableCell>

                                            <TableCell>
                                                <Link href={`/billing/${r.bill.id}`}>
                                                    {r.bill.billNumber}
                                                </Link>
                                            </TableCell>

                                            <TableCell>
                                                {r.bill.customerName || "Walk In"}
                                            </TableCell>

                                            <TableCell>
                                                {new Date(r.createdAt).toLocaleDateString()}
                                            </TableCell>

                                            <TableCell>
                                                {r.reason || "-"}
                                            </TableCell>

                                            <TableCell>
                                                {r.returnItems.length}
                                            </TableCell>

                                            <TableCell>
                                                ₹{Number(r.totalRefund).toFixed(2)}
                                            </TableCell>

                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setExpandedId(expandedId === r.id ? null : r.id)
                                                    }
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
                                                    <Table>
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
                                                                    <td className='text-center'>
                                                                        {item.batch.product?.name ?? "-"}
                                                                    </td>

                                                                    <td className='text-center'>
                                                                        {item.batch.batchNumber}
                                                                    </td>

                                                                    <td className='text-center'>
                                                                        {item.quantity}
                                                                    </td>

                                                                    <td className='text-center'>
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
            </Container>
        </div>
    );
}