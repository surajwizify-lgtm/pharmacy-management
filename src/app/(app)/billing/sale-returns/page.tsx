'use client';
import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { RotateCcw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';

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
            if (dateFrom) params.set('dateFrom', dateFrom);
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
        <div className="space-y-6">
            <PageHeader
                header={`Sales Returns`}
                subheader="All returns processed against sales bills."
            >
                <span>Total refunded: </span>
                <span>{`₹${totalRefunded.toFixed(2)}`}</span>
            </PageHeader>

            <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Search bill no., customer, or reason..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <input
                        type="date"
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <span className="text-slate-400 text-sm">to</span>
                    <input
                        type="date"
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>

                {error && <p className="px-4 pt-3 text-sm text-red-600">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="p-3 text-left">Return #</th>
                                <th className="p-3 text-left">Bill</th>
                                <th className="p-3 text-left">Customer</th>
                                <th className="p-3 text-left">Date</th>
                                <th className="p-3 text-left">Reason</th>
                                <th className="p-3 text-left">Items</th>
                                <th className="p-3 text-left">Refund</th>
                                <th className="p-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-3" colSpan={8}>
                                            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                                        </td>
                                    </tr>
                                ))
                            ) : returns.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-10">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <RotateCcw className="mb-2 h-8 w-8" />
                                            <p className="text-sm">No sales returns found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                returns.map((r) => (
                                    <Fragment key={r.id}>
                                        <tr key={r.id} className="hover:bg-slate-50/70">
                                            <td className="p-3 font-medium text-slate-800">#{r.id}</td>
                                            <td className="p-3">
                                                <Link href={`/billing/${r.bill.id}`} className="text-brand-600 hover:underline">
                                                    {r.bill.billNumber}
                                                </Link>
                                            </td>
                                            <td className="p-3 text-slate-600">{r.bill.customerName || 'Walk In'}</td>
                                            <td className="p-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                                            <td className="p-3 text-slate-600">{r.reason || '-'}</td>
                                            <td className="p-3 text-slate-600">{r.returnItems.length}</td>
                                            <td className="p-3 font-medium text-orange-600">₹{Number(r.totalRefund).toFixed(2)}</td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                                >
                                                    {expandedId === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedId === r.id && (
                                            <tr>
                                                <td colSpan={8} className="bg-slate-50 p-4">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="text-slate-400 uppercase">
                                                            <tr>
                                                                <th className="py-1">Product</th>
                                                                <th className="py-1">Batch</th>
                                                                <th className="py-1">Qty</th>
                                                                <th className="py-1">Refund</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200">
                                                            {r.returnItems.map((item) => (
                                                                <tr key={item.id}>
                                                                    <td className="py-1.5">{item.batch.product?.name ?? '-'}</td>
                                                                    <td className="py-1.5 text-slate-500">{item.batch.batchNumber}</td>
                                                                    <td className="py-1.5">{item.quantity}</td>
                                                                    <td className="py-1.5">₹{Number(item.refundAmount).toFixed(2)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}