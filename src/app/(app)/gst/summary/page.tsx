'use client';

import { useState, useEffect, useCallback } from 'react';
import GstSummaryPrint from "@/components/print/GstSummaryPrint";
import Button from '@/components/Button';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';
import Container from '@/components/common/Container';

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

function firstOfMonth(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

function formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

export default function GstSummaryPage() {
    const [from, setFrom] = useState(firstOfMonth());
    const [to, setTo] = useState(today());
    const [summary, setSummary] = useState<GstSummary | null>(null);
    const [periods, setPeriods] = useState<FilingPeriod[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPrint, setShowPrint] = useState(false);


    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/gst/summary?from=${from}&to=${to}`);
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to load summary');
            const data: any = await res.json();
            setSummary(data);

        } catch (err: any) {
            setError(err.message);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    const fetchPeriods = useCallback(async () => {
        try {
            const res = await fetch('/api/gst/filing-periods');
            if (!res.ok) throw new Error('Failed to load filing periods');
            setPeriods(await res.json());
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
        fetchPeriods();
    }, []);

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

        return () =>
            window.removeEventListener(
                "afterprint",
                afterPrint
            );
    }, []);

    return (
        <div className="">
            <PageHeader
                header={`GST Summary`}
                subheader="View Gst Summary Here"
            >
                <Button
                    onClick={() => setShowPrint(true)}
                    variant='success'
                    size='sm'
                >
                    Print summary
                </Button>
            </PageHeader>
            <Container>
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
                            onClick={fetchSummary}
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
                    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-neutral-200 bg-neutral-50">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">Period</th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">Output</th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">Input</th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">Net Payable</th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">Amount Paid</th>
                                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-neutral-500">Status</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {periods.map((p) => (
                                    <tr key={p.id} className="hover:bg-neutral-50">
                                        <td className="px-4 py-3 text-neutral-700">
                                            {p.periodStart.slice(0, 10)} → {p.periodEnd.slice(0, 10)}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700">{formatCurrency(p.totalOutputGst)}</td>
                                        <td className="px-4 py-3 text-neutral-700">{formatCurrency(p.totalInputGst)}</td>
                                        <td className="px-4 py-3 font-medium text-neutral-900">{formatCurrency(p.netPayable)}</td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                defaultValue={p.amountPaid}
                                                onBlur={(e) => updateAmountPaid(p.id, Number(e.target.value))}
                                                className={`${inputClass} w-24`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.filed ? (
                                                <span className="inline-flex rounded-md bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">
                                                    Filed {p.filedAt?.slice(0, 10)}
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {!p.filed && (
                                                <button
                                                    onClick={() => markFiled(p.id, true)}
                                                    className="rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
                                                >
                                                    Mark filed
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {periods.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-sm text-neutral-400" colSpan={7}>
                                            No filing periods yet — pick a range above and snapshot it.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Container>
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
        </div>
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