// src/components/dashboard/CashFlowChart.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

type CashFlowPoint = {
    month: string;
    label: string;
    inflow: number;
    outflow: number;
    net: number;
};

function formatAxisValue(n: number) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}₹${(abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M`;
    if (abs >= 1_000) return `${n < 0 ? '-' : ''}₹${(abs / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}K`;
    return `₹${n.toFixed(0)}`;
}

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

const RANGE_OPTIONS = [
    { label: 'Last 3 months', value: 3 },
    { label: 'Last 6 months', value: 6 },
    { label: 'Last 12 months', value: 12 },
];

export default function CashFlowChart() {
    const [months, setMonths] = useState(12);
    const [data, setData] = useState<CashFlowPoint[] | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);

    useEffect(() => {
        setData(null);
        apiFetch<CashFlowPoint[]>(`/api/dashboard/cashflow?months=${months}`).then(setData);
    }, [months]);

    const width = 900;
    const height = 320;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxAbs = data && data.length
        ? Math.max(...data.map((d) => Math.max(d.inflow, d.outflow, Math.abs(d.net))), 1)
        : 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxAbs)));
    const yMax = Math.ceil(maxAbs / magnitude) * magnitude || 1;
    const yMin = -yMax;

    const yScale = (v: number) => padding.top + chartHeight * (1 - (v - yMin) / (yMax - yMin));
    const zeroY = yScale(0);

    const barSlot = data && data.length ? chartWidth / data.length : chartWidth;
    const barWidth = Math.min(26, barSlot * 0.32);

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Cash flow</h2>
                    <p className="text-xs text-neutral-500">Based on recorded payments (cash basis)</p>
                </div>
                <select
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                    {RANGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            <div className="mb-3 flex items-center gap-5 text-xs text-neutral-600">
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-secondary-600" /> Inflow
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm border border-neutral-400 bg-neutral-200" /> Outflow
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Net change
                </span>
            </div>

            {data === null ? (
                <div className="flex h-72 items-center justify-center text-sm text-neutral-400">Loading…</div>
            ) : data.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-sm text-neutral-400">No payment activity yet.</div>
            ) : (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 340 }}>
                    {[yMax, yMax / 2, 0, -yMax / 2, -yMax].map((v, i) => (
                        <g key={i}>
                            <line
                                x1={padding.left}
                                x2={width - padding.right}
                                y1={yScale(v)}
                                y2={yScale(v)}
                                stroke="var(--color-neutral-200)"
                                strokeWidth={1}
                            />
                            <text x={padding.left - 8} y={yScale(v) + 4} textAnchor="end" fontSize={11} fill="var(--color-neutral-500)">
                                {formatAxisValue(v)}
                            </text>
                        </g>
                    ))}

                    {data.map((d, i) => {
                        const slotX = padding.left + i * barSlot;
                        const inflowX = slotX + barSlot / 2 - barWidth - 2;
                        const outflowX = slotX + barSlot / 2 + 2;
                        const inflowY = yScale(d.inflow);
                        const outflowBarY = yScale(-d.outflow);

                        return (
                            <g key={d.month} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                                <rect
                                    x={inflowX}
                                    y={inflowY}
                                    width={barWidth}
                                    height={Math.max(zeroY - inflowY, 0)}
                                    rx={2}
                                    fill="var(--color-secondary-600)"
                                    opacity={hovered === null || hovered === i ? 1 : 0.35}
                                />
                                <rect
                                    x={outflowX}
                                    y={zeroY}
                                    width={barWidth}
                                    height={Math.max(outflowBarY - zeroY, 0)}
                                    rx={2}
                                    fill="var(--color-neutral-200)"
                                    stroke="var(--color-neutral-400)"
                                    strokeWidth={1}
                                    opacity={hovered === null || hovered === i ? 1 : 0.35}
                                />
                                <rect
                                    x={slotX}
                                    y={padding.top}
                                    width={barSlot}
                                    height={chartHeight}
                                    fill="transparent"
                                />
                            </g>
                        );
                    })}

                    <line x1={padding.left} x2={width - padding.right} y1={zeroY} y2={zeroY} stroke="var(--color-neutral-300)" strokeWidth={1.5} />

                    <polyline
                        points={data.map((d, i) => `${padding.left + i * barSlot + barSlot / 2},${yScale(d.net)}`).join(' ')}
                        fill="none"
                        stroke="var(--color-amber-500)"
                        strokeWidth={2}
                    />
                    {data.map((d, i) => (
                        <circle
                            key={d.month}
                            cx={padding.left + i * barSlot + barSlot / 2}
                            cy={yScale(d.net)}
                            r={hovered === i ? 5 : 3.5}
                            fill="var(--color-amber-500)"
                            stroke="white"
                            strokeWidth={1.5}
                        />
                    ))}

                    {data.map((d, i) => (
                        <text
                            key={d.month}
                            x={padding.left + i * barSlot + barSlot / 2}
                            y={height - 8}
                            textAnchor="middle"
                            fontSize={11}
                            fill="var(--color-neutral-500)"
                        >
                            {d.label}
                        </text>
                    ))}

                    {hovered !== null && data[hovered] && (() => {
                        const boxX = Math.min(
                            Math.max(padding.left + hovered * barSlot + barSlot / 2 - 70, padding.left),
                            width - padding.right - 150
                        );
                        return (
                            <g>
                                <rect x={boxX} y={padding.top} width={150} height={58} rx={6} fill="var(--color-neutral-900)" opacity={0.92} />
                                <text x={boxX + 10} y={padding.top + 18} fontSize={11} fill="white">{data[hovered].label}</text>
                                <text x={boxX + 10} y={padding.top + 34} fontSize={11} fill="var(--color-secondary-300)">
                                    In: {formatCurrency(data[hovered].inflow)}
                                </text>
                                <text x={boxX + 10} y={padding.top + 48} fontSize={11} fill="var(--color-neutral-300)">
                                    Out: {formatCurrency(data[hovered].outflow)}
                                </text>
                            </g>
                        );
                    })()}
                </svg>
            )}
        </div>
    );
}