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
            <div className="max-h-[90vh] w-full max-w-5xl  rounded-2xl bg-white shadow-2xl">

                {/* Header */}

                <div className="flex items-center justify-between border-b px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-bold">
                            Create Purchase Order
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Purchase order for selected supplier
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-2xl text-slate-500 hover:text-black"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-6 gap-5 grid grid-cols-12 p-6">

                    {/* Product Selection */}
                    <div className="rounded-xl col-span-9 border p-5">

                        <h3 className="mb-5 text-lg font-semibold">
                            Products
                        </h3>
                        {lines.length > 0 && (
                            <div className="mt-5 text-right text-lg font-semibold">
                                Estimated Total :
                                <span className="ml-2 text-blue-700">
                                    ₹{total.toFixed(2)}
                                </span>
                            </div>
                        )}

                        <div className="grid  grid-cols-4 gap-4">


                            <div>
                                <label className="mb-2 block text-sm">
                                    Product
                                </label>

                                <select
                                    className="input"
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
                                <label className="mb-2 block text-sm">
                                    Qty
                                </label>

                                <input
                                    type="number"
                                    className="input"
                                    value={pickQty}
                                    onChange={(e) =>
                                        setPickQty(e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm">
                                    Expected Rate
                                </label>

                                <input
                                    type="number"
                                    className="input"
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
                                    className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
                                >
                                    + Add Product
                                </button>
                            </div>

                        </div>


                        {lines.length > 0 && (
                            <div className="mt-6 px-5 max-h-[200px] overflow-y-auto rounded-lg border">
                                <table className=" w-full">

                                    <thead className="border-b">

                                        <tr>

                                            <th className="py-3 text-left">
                                                Product
                                            </th>

                                            <th className="text-left">
                                                Qty
                                            </th>

                                            <th className="text-left">
                                                Rate
                                            </th>

                                            <th className="text-left">
                                                Total
                                            </th>

                                            <th></th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {lines.map((line) => (

                                            <tr
                                                key={line.productId}
                                                className="border-b"
                                            >

                                                <td className="py-3">
                                                    {line.productName}
                                                </td>

                                                <td>
                                                    {line.quantity}
                                                </td>

                                                <td>
                                                    ₹{line.expectedRate.toFixed(2)}
                                                </td>

                                                <td>
                                                    ₹{(
                                                        line.quantity *
                                                        line.expectedRate
                                                    ).toFixed(2)}
                                                </td>

                                                <td>

                                                    <button
                                                        onClick={() =>
                                                            removeLine(
                                                                line.productId
                                                            )
                                                        }
                                                        className="text-red-600"
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

                    <div className='col-span-3'><div className="grid grid-cols-1 gap-5">

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Supplier
                            </label>

                            <input
                                disabled
                                value={supplier?.name || ''}
                                className="input bg-slate-100"
                            />

                            {supplier?.contactPerson && (
                                <p className="mt-2 text-xs text-slate-500">
                                    Contact : {supplier.contactPerson}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Purchase Order ID
                            </label>

                            <input
                                disabled
                                value="Auto Generated"
                                className="input bg-slate-100"
                            />
                        </div>

                    </div>

                        <div className="grid grid-cols-2 gap-5">

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Expected Date
                                </label>

                                <input
                                    type="date"
                                    className="input"
                                    value={expectedDate}
                                    onChange={(e) =>
                                        setExpectedDate(e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Notes
                                </label>

                                <input
                                    className="input"
                                    value={notes}
                                    onChange={(e) =>
                                        setNotes(e.target.value)
                                    }
                                />
                            </div>

                        </div>
                        <div className="flex justify-end gap-3 border-t p-6">

                            <button
                                onClick={onClose}
                                className="rounded-lg border px-6 py-2"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {saving
                                    ? 'Creating...'
                                    : 'Create'}
                            </button>

                        </div>
                    </div>



                    {error && (
                        <p className="text-red-600">
                            {error}
                        </p>
                    )}

                </div>



            </div>
        </div>
    );
}