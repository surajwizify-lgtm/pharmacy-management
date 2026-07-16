'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { product } from '@/types';

type Line = {
    productId: number;
    productName: string;
    quantity: number;
    expectedRate: number;
};

interface Props {
    open: boolean;
    supplier: any;
    onClose: () => void;
    onSuccess: () => void;
}

const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
const disabledInputClass =
    'w-full cursor-not-allowed rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-500';
const labelClass = 'mb-2 block text-sm font-medium text-neutral-700';

export default function CreatePurchaseOrderModal({
    open,
    supplier,
    onClose,
    onSuccess,
}: Props) {
    const [products, setProducts] = useState<product[]>([]);

    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');

    const [pickProductId, setPickProductId] = useState<number | ''>('');
    const [pickQty, setPickQty] = useState('');
    const [pickRate, setPickRate] = useState('');

    const [lines, setLines] = useState<Line[]>([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;

        apiFetch<product[]>('/api/products').then(setProducts);

        setExpectedDate('');
        setNotes('');
        setPickProductId('');
        setPickQty('');
        setPickRate('');
        setLines([]);
        setError('');
    }, [open]);

    if (!open) return null;

    function addLine() {
        setError('');

        if (!pickProductId)
            return setError('Select a product');

        if (!pickQty || Number(pickQty) <= 0)
            return setError('Enter valid quantity');

        if (!pickRate || Number(pickRate) <= 0)
            return setError('Enter valid rate');

        if (lines.some((l) => l.productId === pickProductId))
            return setError('Product already added');

        const product = products.find((m) => m.id === pickProductId)!;

        setLines([
            ...lines,
            {
                productId: product.id,
                productName: product.name,
                quantity: Number(pickQty),
                expectedRate: Number(pickRate),
            },
        ]);

        setPickProductId('');
        setPickQty('');
        setPickRate('');
    }

    function removeLine(productId: number) {
        setLines(lines.filter((x) => x.productId !== productId));
    }

    const total = lines.reduce(
        (sum, l) => sum + l.quantity * l.expectedRate,
        0
    );
    async function handleSubmit() {
        setError('');

        if (!supplier)
            return setError('Supplier not found');

        if (lines.length === 0)
            return setError('Add at least one product');

        setSaving(true);

        try {
            await apiFetch('/api/purchase-orders', {
                method: 'POST',
                body: JSON.stringify({
                    supplierId: supplier.id,
                    expectedDate: expectedDate || null,
                    notes: notes || null,
                    items: lines.map((l) => ({
                        productId: l.productId,
                        quantity: l.quantity,
                        expectedRate: l.expectedRate,
                    })),
                }),
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(
                err instanceof ApiClientError
                    ? err.message
                    : 'Something went wrong'
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                {/* Header */}

                <div className="flex items-center justify-between border-b border-neutral-200 bg-primary-50 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900">
                            Create Purchase Order
                        </h2>

                        <p className="mt-1 text-sm text-neutral-500">
                            Purchase order for selected supplier
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-2xl leading-none text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-6 gap-5 grid grid-cols-12 p-6">

                    {error && (
                        <div className="col-span-12 flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
                            <span className="text-sm font-medium text-danger-700">{error}</span>
                        </div>
                    )}

                    {/* Product Selection */}
                    <div className="rounded-xl col-span-9 border border-neutral-200 bg-white p-5 shadow-sm">

                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-neutral-800">
                                Products
                            </h3>

                            {lines.length > 0 && (
                                <div className="text-lg font-semibold text-neutral-700">
                                    Estimated Total :
                                    <span className="ml-2 rounded-lg bg-primary-50 px-2 py-1 text-primary-700">
                                        ₹{total.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-4">

                            <div>
                                <label className={labelClass}>
                                    Product
                                </label>

                                <select
                                    className={inputClass}
                                    value={pickProductId}
                                    onChange={(e) =>
                                        setPickProductId(Number(e.target.value))
                                    }
                                >
                                    <option value="">
                                        Select Product
                                    </option>

                                    {products.map((p) => (
                                        <option
                                            key={p.id}
                                            value={p.id}
                                        >
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Qty
                                </label>

                                <input
                                    type="number"
                                    className={inputClass}
                                    value={pickQty}
                                    onChange={(e) =>
                                        setPickQty(e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Expected Rate
                                </label>

                                <input
                                    type="number"
                                    className={inputClass}
                                    value={pickRate}
                                    onChange={(e) =>
                                        setPickRate(e.target.value)
                                    }
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={addLine}
                                    className="w-full rounded-lg border border-secondary-300 bg-secondary-50 py-2.5 text-sm font-medium text-secondary-700 transition hover:bg-secondary-100"
                                >
                                    + Add Product
                                </button>
                            </div>

                        </div>


                        {lines.length > 0 && (
                            <div className="mt-6 max-h-[200px] overflow-y-auto rounded-lg border border-neutral-200">
                                <table className="w-full text-left text-sm">

                                    <thead className="sticky top-0 border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">

                                        <tr>

                                            <th className="px-4 py-3">
                                                Product
                                            </th>

                                            <th className="px-2 py-3">
                                                Qty
                                            </th>

                                            <th className="px-2 py-3">
                                                Rate
                                            </th>

                                            <th className="px-2 py-3">
                                                Total
                                            </th>

                                            <th></th>

                                        </tr>

                                    </thead>

                                    <tbody className="divide-y divide-neutral-100">

                                        {lines.map((line) => (

                                            <tr
                                                key={line.productId}
                                                className="hover:bg-neutral-50"
                                            >

                                                <td className="px-4 py-3 font-medium text-neutral-800">
                                                    {line.productName}
                                                </td>

                                                <td className="px-2 py-3 text-neutral-600">
                                                    {line.quantity}
                                                </td>

                                                <td className="px-2 py-3 text-neutral-600">
                                                    ₹{line.expectedRate.toFixed(2)}
                                                </td>

                                                <td className="px-2 py-3 font-medium text-neutral-800">
                                                    ₹{(
                                                        line.quantity *
                                                        line.expectedRate
                                                    ).toFixed(2)}
                                                </td>

                                                <td className="px-2 py-3">

                                                    <button
                                                        onClick={() =>
                                                            removeLine(
                                                                line.productId
                                                            )
                                                        }
                                                        className="text-xs font-medium text-danger-600 hover:text-danger-700 hover:underline"
                                                    >
                                                        Remove
                                                    </button>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>
                            </div>

                        )}


                    </div>

                    {/* Supplier */}

                    <div className="col-span-3 flex flex-col gap-5">

                        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="grid grid-cols-1 gap-5">

                                <div>
                                    <label className={labelClass}>
                                        Supplier
                                    </label>

                                    <input
                                        disabled
                                        value={supplier?.name || ''}
                                        className={disabledInputClass}
                                    />

                                    {supplier?.contactPerson && (
                                        <p className="mt-2 text-xs text-neutral-500">
                                            Contact : {supplier.contactPerson}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Purchase Order ID
                                    </label>

                                    <input
                                        disabled
                                        value="Auto Generated"
                                        className={disabledInputClass}
                                    />
                                </div>

                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-5">

                                <div>
                                    <label className={labelClass}>
                                        Expected Date
                                    </label>

                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={expectedDate}
                                        onChange={(e) =>
                                            setExpectedDate(e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Notes
                                    </label>

                                    <input
                                        className={inputClass}
                                        value={notes}
                                        onChange={(e) =>
                                            setNotes(e.target.value)
                                        }
                                    />
                                </div>

                            </div>
                        </div>

                        <div className="flex justify-end gap-3">

                            <button
                                onClick={onClose}
                                className="rounded-lg border border-neutral-300 bg-white px-6 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving
                                    ? 'Creating...'
                                    : 'Create'}
                            </button>

                        </div>
                    </div>

                </div>



            </div>
        </div>
    );
}