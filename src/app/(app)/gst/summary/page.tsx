'use client';

import { useState, useEffect, useCallback } from 'react';

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

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/gst/summary?from=${from}&to=${to}`);
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to load summary');
            const data: any = await res.json();
            console.log(data);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>GST Summary</h1>

            {/* Date range picker */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>From</label>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>To</label>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
                </div>
                <button onClick={fetchSummary} disabled={loading} style={buttonStyle}>
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
                <button onClick={handleSnapshot} disabled={saving || !summary} style={{ ...buttonStyle, background: '#111' }}>
                    {saving ? 'Saving…' : 'Snapshot as filing period'}
                </button>
            </div>

            {error && (
                <div style={{ background: '#fee', border: '1px solid #f99', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                    {error}
                </div>
            )}

            {/* Summary cards */}
            {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
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

            {/* Breakdown */}
            {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                    <BreakdownTable title="Output (Sales)" data={summary.breakdown.output} />
                    <BreakdownTable title="Input (Purchases)" data={summary.breakdown.input} />
                </div>
            )}

            {/* Filing periods */}
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Filing History</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                        <th style={thStyle}>Period</th>
                        <th style={thStyle}>Output</th>
                        <th style={thStyle}>Input</th>
                        <th style={thStyle}>Net Payable</th>
                        <th style={thStyle}>Amount Paid</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}></th>
                    </tr>
                </thead>
                <tbody>
                    {periods.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                            <td style={tdStyle}>
                                {p.periodStart.slice(0, 10)} → {p.periodEnd.slice(0, 10)}
                            </td>
                            <td style={tdStyle}>{formatCurrency(p.totalOutputGst)}</td>
                            <td style={tdStyle}>{formatCurrency(p.totalInputGst)}</td>
                            <td style={tdStyle}>{formatCurrency(p.netPayable)}</td>
                            <td style={tdStyle}>
                                <input
                                    type="number"
                                    defaultValue={p.amountPaid}
                                    onBlur={(e) => updateAmountPaid(p.id, Number(e.target.value))}
                                    style={{ ...inputStyle, width: 90 }}
                                />
                            </td>
                            <td style={tdStyle}>
                                {p.filed ? (
                                    <span style={{ color: '#0a7', fontWeight: 500 }}>Filed {p.filedAt?.slice(0, 10)}</span>
                                ) : (
                                    <span style={{ color: '#c60' }}>Pending</span>
                                )}
                            </td>
                            <td style={tdStyle}>
                                {!p.filed && (
                                    <button onClick={() => markFiled(p.id, true)} style={{ ...buttonStyle, padding: '4px 10px', fontSize: 13 }}>
                                        Mark filed
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {periods.length === 0 && (
                        <tr>
                            <td style={tdStyle} colSpan={7}>
                                No filing periods yet — pick a range above and snapshot it.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function SummaryCard({ label, value, sub, highlight }: { label: string; value: number; sub: string; highlight?: boolean }) {
    return (
        <div
            style={{
                border: '1px solid #eee',
                borderRadius: 8,
                padding: 16,
                background: highlight ? '#f7f7ff' : '#fff',
            }}
        >
            <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(value)}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{sub}</div>
        </div>
    );
}

function BreakdownTable({ title, data }: { title: string; data: { cgst: number; sgst: number; igst: number; taxableValue: number } }) {
    return (
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>{title}</div>
            <Row label="Taxable Value" value={data.taxableValue} />
            <Row label="CGST" value={data.cgst} />
            <Row label="SGST" value={data.sgst} />
            <Row label="IGST" value={data.igst} />
        </div>
    );
}

function Row({ label, value }: { label: string; value: number }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
            <span style={{ color: '#666' }}>{label}</span>
            <span>{formatCurrency(value)}</span>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    border: '1px solid #ddd',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
    background: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: 14,
    cursor: 'pointer',
};

const thStyle: React.CSSProperties = { padding: '8px 6px', fontSize: 13, color: '#666' };
const tdStyle: React.CSSProperties = { padding: '8px 6px', fontSize: 14 };