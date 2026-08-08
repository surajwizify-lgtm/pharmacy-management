// app/batches/BatchesTable.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { cn } from '@/lib/utils';

export type BatchWithProduct = {
    id: number;
    productId: number;
    batchNumber: string;
    expiryDate: string;
    quantityAvailable: number;
    sellingPrice: number;
    product?: { name: string } | null;
};

function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function expiryTone(days: number) {
    if (days <= 30) {
        return { badge: 'bg-danger-100 text-danger-700', dot: 'bg-danger-500' };
    }
    if (days <= 90) {
        return { badge: 'bg-amber-100 text-amber-700', dot: 'bg-warning-500' };
    }
    return { badge: 'bg-neutral-100 text-neutral-700', dot: 'bg-neutral-500' };
}

function EmptyIcon() {
    return (
        <svg
            className="h-10 w-10 text-slate-300"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            <path d="M24 6l16 8v16l-16 8-16-8V14l16-8z" />
            <path d="M8 14l16 8 16-8M24 22v18" />
        </svg>
    );
}

function StatCard({
    title,
    value,
    color,
}: {
    title: string;
    value: number;
    color: string;
}) {
    return (
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
            <h3 className={`mt-2 text-2xl font-bold ${color}`}>{value}</h3>
        </div>
    );
}

export default function BatchesTable({ data }: { data: BatchWithProduct[] }) {
    const [onlyExpiring, setOnlyExpiring] = useState(false);

    const sorted = useMemo(
        () =>
            [...data].sort((a, b) => {
                const nameCompare = (a.product?.name ?? '').localeCompare(b.product?.name ?? '');
                if (nameCompare !== 0) return nameCompare;
                return daysUntil(a.expiryDate) - daysUntil(b.expiryDate);
            }),
        [data]
    );

    const tableData = useMemo(() => {
        if (!onlyExpiring) return sorted;
        return sorted.filter((b) => daysUntil(b.expiryDate) <= 90);
    }, [sorted, onlyExpiring]);

    const stats = useMemo(() => {
        const expired = data.filter((b) => daysUntil(b.expiryDate) < 0).length;

        const critical = data.filter((b) => {
            const d = daysUntil(b.expiryDate);
            return d >= 0 && d <= 30;
        }).length;

        const warning = data.filter((b) => {
            const d = daysUntil(b.expiryDate);
            return d > 30 && d <= 90;
        }).length;

        const units = data.reduce((sum, batch) => sum + batch.quantityAvailable, 0);

        return { expired, critical, warning, units };
    }, [data]);

    const columns: ColumnDef<BatchWithProduct>[] = useMemo(
        () => [
            {
                id: 'product',
                header: 'Product',
                accessorFn: (row) => row.product?.name ?? `Product #${row.productId}`,
                cell: ({ row }) => (
                    <Link href={`/products/${row.original.productId}`} className="text-brand-600 hover:underline">
                        {row.original.product?.name ?? `Product #${row.original.productId}`}
                    </Link>
                ),
            },
            {
                header: 'Batch',
                accessorKey: 'batchNumber',

            },
            {
                id: 'expiryDate',
                header: 'Expiry',
                accessorFn: (row) => row.expiryDate,
                cell: ({ row }) => {
                    const d = daysUntil(row.original.expiryDate);
                    const tone = expiryTone(d);

                    return (
                        <span className="inline-flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                            {new Date(row.original.expiryDate).toLocaleDateString()}
                            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone.badge}`}>
                                {d < 0 ? `Expired ${Math.abs(d)}d ago` : `${d}d left`}
                            </span>
                        </span>
                    );
                },
            },
            {
                header: 'Quantity',
                accessorKey: 'quantityAvailable',
            },
            {
                id: 'sellingPrice',
                header: 'Selling Price',
                accessorFn: (row) => row.sellingPrice,
                cell: ({ row }) => `₹${row.original.sellingPrice}`,
            },
        ],
        []
    );

    return (
        <>
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard title="Expired" value={stats.expired} color="text-danger-600" />
                <StatCard title="≤30 Days" value={stats.critical} color="text-danger-600" />
                <StatCard title="31-90 Days" value={stats.warning} color="text-warning-600" />
                <StatCard title="Units" value={stats.units} color="text-primary-600" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                        type="checkbox"
                        checked={onlyExpiring}
                        onChange={(e) => setOnlyExpiring(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Show only batches expiring within 90 days
                </label>
            </div>

            {tableData.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-10 text-center">
                    <EmptyIcon />
                    <p className="font-medium text-slate-600">No batches found</p>
                    <p className="text-sm text-slate-400">Try changing your filters or search.</p>
                </div>
            ) : (
                <DataTable columns={columns} data={tableData} />
            )}
        </>
    );
}