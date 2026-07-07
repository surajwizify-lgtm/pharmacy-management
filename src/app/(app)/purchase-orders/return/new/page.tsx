'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';

type Supplier = { id: number; name: string };
type PO = { id: number; poNumber: string };
type BatchOption = {
    id: number;
    batchNumber: string;
    quantityAvailable: number;
    purchasePrice: string;
    productId: number;
    product: { name: string };
};

type ReturnLine = {
    batchId: number;
    batchNumber: string;
    productId: number;
    productName: string;
    maxQty: number;
    quantity: number;
    unitPrice: number;
};

export default function NewSupplierReturnPage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supplierId, setSupplierId] = useState<number | ''>('');
    const [returnNumber, setReturnNumber] = useState('');
    const [reason, setReason] = useState('');

    const [purchaseOrders, setPurchaseOrders] = useState<PO[]>([]);
    const [purchaseOrderId, setPurchaseOrderId] = useState<number | ''>('');

    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [pickBatchId, setPickBatchId] = useState<number | ''>('');
    const [pickQty, setPickQty] = useState('');
    const [lines, setLines] = useState<ReturnLine[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiFetch<Supplier[]>('/api/suppliers').then(setSuppliers);
    }, []);

    // when supplier changes, load their POs and the batches from those POs
    // useEffect(() => {
    //     if (!supplierId) {
    //         setPurchaseOrders([]);
    //         setBatches([]);
    //         return;
    //     }
    //     apiFetch<any>(`/api/suppliers/${supplierId}`).then((data) => {
    //         setPurchaseOrders(data.purchaseOrders || []);
    //     });
    //     // batches available for return = fetched via a dedicated endpoint filtered by supplier
    //     apiFetch<BatchOption[]>(`/api/batches?supplierId=${supplierId}`).then(setBatches).catch(() => setBatches([]));
    // }, [supplierId]);
    useEffect(() => {
        if (!supplierId) {
            setPurchaseOrders([]);
            setPurchaseOrderId("");
            setBatches([]);
            setPickBatchId("");
            return;
        }

        apiFetch<any>(`/api/suppliers/${supplierId}`)
            .then((data) => {
                setPurchaseOrders(data.purchaseOrders || []);
            })
            .catch(() => setPurchaseOrders([]));

        // reset when supplier changes
        setPurchaseOrderId("");
        setBatches([]);
        setPickBatchId("");
    }, [supplierId]);
    useEffect(() => {
        if (!purchaseOrderId) {
            setBatches([]);
            setPickBatchId("");
            return;
        }

        apiFetch<BatchOption[]>(
            `/api/purchase-orders/${purchaseOrderId}/batches`
        )
            .then(setBatches)
            .catch(() => setBatches([]));

        setPickBatchId("");
    }, [purchaseOrderId]);

    function addLine() {
        setError(null);
        if (!pickBatchId) return setError('Select a batch');
        if (!pickQty || Number(pickQty) <= 0) return setError('Enter a valid quantity');

        const batch = batches.find((b) => b.id === pickBatchId)!;
        if (Number(pickQty) > batch.quantityAvailable) {
            return setError(`Only ${batch.quantityAvailable} units available in this batch`);
        }
        if (lines.some((l) => l.batchId === batch.id)) {
            return setError('That batch is already added');
        }

        setLines([
            ...lines,
            {
                batchId: batch.id,
                batchNumber: batch.batchNumber,
                productId: batch.productId,
                productName: batch.product.name,
                maxQty: batch.quantityAvailable,
                quantity: Number(pickQty),
                unitPrice: Number(batch.purchasePrice),
            },
        ]);
        setPickBatchId('');
        setPickQty('');
    }

    function removeLine(batchId: number) {
        setLines(lines.filter((l) => l.batchId !== batchId));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!supplierId) return setError('Select a supplier');
        if (!returnNumber.trim()) return setError('Return number is required');
        if (!lines.length) return setError('Add at least one item to return');

        setSaving(true);
        try {
            const ret = await apiFetch<{ id: number }>(`/api/purchase-orders/${supplierId}/returns`, {
                method: 'POST',
                body: JSON.stringify({
                    supplierId,
                    purchaseOrderId: purchaseOrderId || null,
                    returnNumber,
                    reason: reason || null,
                    items: lines.map((l) => ({
                        batchId: l.batchId,
                        productId: l.productId,
                        quantity: l.quantity,
                        unitPrice: l.unitPrice,
                    })),
                }),
            });
            router.push(`/purchase-orders/return`);
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link href="/purchase-orders/return" className="text-xs font-medium text-brand-600 hover:underline">
                    ← Back to supplier returns
                </Link>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">New Supplier Return</h1>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="card space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Supplier</label>
                        <select className="input" value={supplierId}
                            // onChange={(e) => setSupplierId(Number(e.target.value))}
                            onChange={(e) => setSupplierId(Number(e.target.value))}
                        >
                            <option value="">Select supplier…</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Related PO (optional)</label>
                        <select
                            className="input"
                            value={purchaseOrderId}
                            // onChange={(e) => setPurchaseOrderId(Number(e.target.value))}
                            onChange={(e) => setPurchaseOrderId(Number(e.target.value))}
                            // disabled={!purchaseOrders.length}
                            disabled={!supplierId}
                        >
                            <option value="">None</option>
                            {purchaseOrders.map((po) => (
                                <option key={po.id} value={po.id}>{po.poNumber}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="label">Return Number</label>
                    <input className="input" value={returnNumber} onChange={(e) => setReturnNumber(e.target.value)} />
                </div>
                <div>
                    <label className="label">Reason (optional)</label>
                    <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. damaged, expired, wrong item" />
                </div>
            </div>

            <div className="card space-y-4 p-5">
                <h2 className="font-medium text-slate-800">Items to Return</h2>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="label">Batch</label>
                        <select className="input" value={pickBatchId} onChange={(e) => setPickBatchId(Number(e.target.value))} disabled={!supplierId}>
                            <option value="">Select batch…</option>
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.product.name} — {b.batchNumber} (avail: {b.quantityAvailable})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Quantity</label>
                        <input type="number" className="input" value={pickQty} onChange={(e) => setPickQty(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                        <button type="button" className="btn-secondary w-full" onClick={addLine}>+ Add</button>
                    </div>
                </div>

                {lines.length > 0 && (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="py-2">product</th>
                                <th className="py-2">Batch #</th>
                                <th className="py-2">Qty</th>
                                <th className="py-2">Unit Price</th>
                                <th className="py-2">Total</th>
                                <th className="py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {lines.map((l) => (
                                <tr key={l.batchId}>
                                    <td className="py-2">{l.productName}</td>
                                    <td className="py-2">{l.batchNumber}</td>
                                    <td className="py-2">{l.quantity}</td>
                                    <td className="py-2">₹{l.unitPrice.toFixed(2)}</td>
                                    <td className="py-2">₹{(l.quantity * l.unitPrice).toFixed(2)}</td>
                                    <td className="py-2">
                                        <button className="text-xs text-red-600" onClick={() => removeLine(l.batchId)}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {lines.length > 0 && (
                    <p className="text-right text-sm font-medium text-slate-700">
                        Debit Note Total: ₹{totalAmount.toFixed(2)}
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-2">
                <Link href="/purchase-orders/registered" className="btn-secondary">Cancel</Link>
                <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Saving…' : 'Create Return'}
                </button>
            </div>
        </div>
    );
}