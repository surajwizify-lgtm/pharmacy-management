// app/gst-summary/GstSummaryClient.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import GstSummaryPrint from "@/components/print/GstSummaryPrint";
import Button from '@/components/Button';
import HeaderButton from '@/components/common/HeaderButton';
import { DataTable } from '@/components/data-table/data-table';

type GstSummary = {
    from: string;
    to: string;
    totalOutputGst: number;
    totalInputGst: number;
    netPayable: number;
    breakdown: {
        output: { cgst: number; sgst: number; igst: number; taxableValue: number };
        input: { cgst: number; sgst: number; igst: number; taxableValue: number };
    };
};
const EMPTY_SUMMARY: GstSummary = {
    from: '',
    to: '',
    totalOutputGst: 0,
    totalInputGst: 0,
    netPayable: 0,
    breakdown: {
        output: { cgst: 0, sgst: 0, igst: 0, taxableValue: 0 },
        input: { cgst: 0, sgst: 0, igst: 0, taxableValue: 0 },
    },
};

type FilingPeriod = {
    id: number;
    periodStart: string;
    periodEnd: string;
    totalOutputGst: number;
    totalInputGst: number;
    netPayable: number;
    amountPaid: number;
    filed: boolean;
    filedAt: string | null;
};

const inputClass =
    'rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelClass = 'mb-1 block text-xs font-medium text-neutral-600';

function formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

export default function GstSummaryClient({
    initialFrom,
    initialTo,
    // initialSummary,
    initialPeriods,
}: {
    initialFrom: string;
    initialTo: string;
    // initialSummary: GstSummary | null;
    initialPeriods: FilingPeriod[];
}) {
    const [from, setFrom] = useState(initialFrom);
    const [to, setTo] = useState(initialTo);
    const [summary, setSummary] = useState<GstSummary | null>(EMPTY_SUMMARY);
    const [periods, setPeriods] = useState<FilingPeriod[]>(initialPeriods);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPrint, setShowPrint] = useState(false);

    const fetchSummary = useCallback(async (f: string, t: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/gst/summary?from=${f}&to=${t}`);
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to load summary');
            const data: GstSummary = await res.json();
            setSummary(data);
        } catch (err: any) {
            setError(err.message);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPeriods = useCallback(async () => {
        try {
            const res = await fetch('/api/gst/filing-periods');
            if (!res.ok) throw new Error('Failed to load filing periods');
            setPeriods(await res.json());
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    // Note: no fetch-on-mount — initial data comes from the server component as props.

    async function handleSnapshot() {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/gst/filing-periods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ periodStart: from, periodEnd: to }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to save period');
            await fetchPeriods();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function markFiled(id: number, filed: boolean) {
        setError(null);
        try {
            const res = await fetch(`/api/gst/filing-periods/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filed }),
            });
            if (!res.ok) throw new Error('Failed to update period');
            await fetchPeriods();
        } catch (err: any) {
            setError(err.message);
        }
    }

    async function updateAmountPaid(id: number, amountPaid: number) {
        setError(null);
        try {
            const res = await fetch(`/api/gst/filing-periods/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amountPaid }),
            });
            if (!res.ok) throw new Error('Failed to update amount paid');
            await fetchPeriods();
        } catch (err: any) {
            setError(err.message);
        }
    }

    useEffect(() => {
        if (!showPrint) return;
        const timer = setTimeout(() => {
            window.print();
        }, 150);
        return () => clearTimeout(timer);
    }, [showPrint]);

    useEffect(() => {
        const afterPrint = () => setShowPrint(false);
        window.addEventListener("afterprint", afterPrint);
        return () => window.removeEventListener("afterprint", afterPrint);
    }, []);

    const periodColumns: ColumnDef<FilingPeriod>[] = useMemo(
        () => [
            {
                id: 'period',
                header: 'Period',
                accessorFn: (p) => `${p.periodStart.slice(0, 10)} → ${p.periodEnd.slice(0, 10)}`,
            },
            {
                id: 'output',
                header: 'Output',
                accessorFn: (p) => p.totalOutputGst,
                cell: ({ row }) => formatCurrency(row.original.totalOutputGst),
            },
            {
                id: 'input',
                header: 'Input',
                accessorFn: (p) => p.totalInputGst,
                cell: ({ row }) => formatCurrency(row.original.totalInputGst),
            },
            {
                id: 'netPayable',
                header: 'Net Payable',
                accessorFn: (p) => p.netPayable,
                cell: ({ row }) => (
                    <span className="font-medium text-neutral-900">{formatCurrency(row.original.netPayable)}</span>
                ),
            },
            {
                id: 'amountPaid',
                header: 'Amount Paid',
                cell: ({ row }) => (
                    <input
                        type="number"
                        defaultValue={row.original.amountPaid}
                        onBlur={(e) => updateAmountPaid(row.original.id, Number(e.target.value))}
                        className={`${inputClass} w-24`}
                    />
                ),
            },
            {
                id: 'status',
                header: 'Status',
                accessorFn: (p) => (p.filed ? 'Filed' : 'Pending'),
                cell: ({ row }) =>
                    row.original.filed ? (
                        <span className="inline-flex rounded-md bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">
                            Filed {row.original.filedAt?.slice(0, 10)}
                        </span>
                    ) : (
                        <span className="inline-flex rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Pending
                        </span>
                    ),
            },
            {
                id: 'actions',
                header: '',
                cell: ({ row }) =>
                    !row.original.filed && (
                        <button
                            onClick={() => markFiled(row.original.id, true)}
                            className="rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
                        >
                            Mark filed
                        </button>
                    ),
            },
        ],
        []
    );

    return (
        <>
            <div className="flex w-full items-end justify-between">
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className={labelClass}>From</label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>To</label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <button
                        onClick={() => fetchSummary(from, to)}
                        disabled={loading}
                        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Loading…' : 'Refresh'}
                    </button>
                    <button
                        onClick={handleSnapshot}
                        disabled={saving || !summary}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? 'Saving…' : 'Snapshot as filing period'}
                    </button>
                </div>

                <Button onClick={() => setShowPrint(true)} variant="success" size="sm">
                    Print summary
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
                    <span className="text-sm font-medium text-danger-700">{error}</span>
                </div>
            )}

            {summary && (
                <div className="grid grid-cols-3 gap-4">
                    <SummaryCard label="Total Output GST" value={summary.totalOutputGst} sub="Collected from sales" />
                    <SummaryCard label="Total Input GST" value={summary.totalInputGst} sub="Paid on purchases" />
                    <SummaryCard
                        label="Net Payable"
                        value={summary.netPayable}
                        sub={summary.netPayable >= 0 ? 'Owed to govt' : 'Carried forward / refundable'}
                        highlight
                    />
                </div>
            )}

            {summary && (
                <div className="grid grid-cols-2 gap-4">
                    <BreakdownTable title="Output (Sales)" data={summary.breakdown.output} />
                    <BreakdownTable title="Input (Purchases)" data={summary.breakdown.input} />
                </div>
            )}

            <div>
                <h2 className="mb-3 text-lg font-semibold text-neutral-900">Filing History</h2>
                <DataTable columns={periodColumns} data={periods} />
            </div>

            {showPrint && summary && (
                <GstSummaryPrint
                    from={summary.from}
                    to={summary.to}
                    totalOutputGst={summary.totalOutputGst}
                    totalInputGst={summary.totalInputGst}
                    netPayable={summary.netPayable}
                    output={summary.breakdown.output}
                    input={summary.breakdown.input}
                    periods={periods}
                />
            )}
        </>
    );
}

function SummaryCard({ label, value, sub, highlight }: { label: string; value: number; sub: string; highlight?: boolean }) {
    return (
        <div
            className={`rounded-xl border p-4 shadow-sm ${highlight ? 'border-primary-200 bg-primary-50' : 'border-neutral-200 bg-white'
                }`}
        >
            <div className="mb-1.5 text-xs font-medium text-neutral-500">{label}</div>
            <div className={`text-2xl font-bold ${highlight ? 'text-primary-700' : 'text-neutral-900'}`}>
                {formatCurrency(value)}
            </div>
            <div className="mt-1 text-xs text-neutral-400">{sub}</div>
        </div>
    );
}

function BreakdownTable({ title, data }: { title: string; data: { cgst: number; sgst: number; igst: number; taxableValue: number } }) {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-2.5 font-semibold text-neutral-800">{title}</div>
            <Row label="Taxable Value" value={data.taxableValue} />
            <Row label="CGST" value={data.cgst} />
            <Row label="SGST" value={data.sgst} />
            <Row label="IGST" value={data.igst} />
        </div>
    );
}

function Row({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex justify-between py-1 text-sm">
            <span className="text-neutral-500">{label}</span>
            <span className="font-medium text-neutral-800">{formatCurrency(value)}</span>
        </div>
    );
}