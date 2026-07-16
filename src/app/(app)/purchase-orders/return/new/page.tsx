'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { ArrowLeft, Package, Plus, RotateCcw, Trash2, Truck } from 'lucide-react';

type Supplier = { id: number; name: string };
type PO = { id: number; poNumber: string };
type Invoice = { id: number; invoiceNumber: string; grnNumber: string };
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

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [purchaseInvoiceId, setPurchaseInvoiceId] = useState<number | ''>('');

    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [pickBatchId, setPickBatchId] = useState<number | ''>('');
    const [pickQty, setPickQty] = useState('');
    const [lines, setLines] = useState<ReturnLine[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiFetch<Supplier[]>('/api/suppliers').then(setSuppliers);
    }, []);

    useEffect(() => {
        if (!supplierId) {
            setPurchaseOrders([]);
            setPurchaseOrderId('');
            setInvoices([]);
            setPurchaseInvoiceId('');
            setBatches([]);
            setPickBatchId('');
            return;
        }

        apiFetch<any>(`/api/suppliers/${supplierId}`)
            .then((data) => {
                setPurchaseOrders(data.purchaseOrders || []);
            })
            .catch(() => setPurchaseOrders([]));

        setPurchaseOrderId('');
        setInvoices([]);
        setPurchaseInvoiceId('');
        setBatches([]);
        setPickBatchId('');
    }, [supplierId]);

    useEffect(() => {
        if (!purchaseOrderId) {
            setBatches([]);
            setPickBatchId('');
            setInvoices([]);
            setPurchaseInvoiceId('');
            return;
        }

        apiFetch<BatchOption[]>(`/api/purchase-orders/${purchaseOrderId}/batches`)
            .then(setBatches)
            .catch(() => setBatches([]));
        setPickBatchId('');

        apiFetch<any>(`/api/purchase-orders/${purchaseOrderId}`)
            .then((data) => {
                const list: Invoice[] = data.purchaseInvoices || [];
                setInvoices(list);
                setPurchaseInvoiceId(list.length === 1 ? list[0].id : '');
            })
            .catch(() => {
                setInvoices([]);
                setPurchaseInvoiceId('');
            });
    }, [purchaseOrderId]);

    // The batch currently selected in the picker — used to clamp/label the qty field.
    const selectedBatch = batches.find((b) => b.id === pickBatchId) ?? null;

    function handlePickBatchChange(value: string) {
        setPickBatchId(value ? Number(value) : '');
        setPickQty(''); // reset qty whenever the batch changes so a stale value can't slip through
        setError(null);
    }

    function handlePickQtyChange(raw: string) {
        if (raw === '') {
            setPickQty('');
            return;
        }
        let n = Number(raw);
        if (Number.isNaN(n)) return;

        if (n < 0) n = 0;
        // Hard clamp to the selected batch's available stock — can't type past it.
        if (selectedBatch && n > selectedBatch.quantityAvailable) {
            n = selectedBatch.quantityAvailable;
        }
        setPickQty(String(n));
    }

    function addLine() {
        setError(null);
        if (!pickBatchId) return setError('Select a batch');
        if (!pickQty || Number(pickQty) <= 0) return setError('Enter a valid quantity');

        const batch = batches.find((b) => b.id === pickBatchId)!;
        // Belt-and-braces check even though the input is already clamped —
        // guards against stale state if `batches` refreshed underneath the user.
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
            await apiFetch<{ id: number }>('/api/supplier-returns', {
                method: 'POST',
                body: JSON.stringify({
                    supplierId,
                    purchaseInvoiceId: purchaseInvoiceId || null,
                    returnNumber,
                    reason: reason || null,
                    refundType: 'credit_note',
                    items: lines.map((l) => ({
                        batchId: l.batchId,
                        productId: l.productId,
                        quantity: l.quantity,
                        unitPrice: l.unitPrice,
                    })),
                }),
            });
            router.push('/purchase-orders/return');
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

    // Reusable style strings (plain utilities, no custom classes)
    const inputClass =
        'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400';
    const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500';
    const cardClass = 'rounded-xl border border-neutral-200 bg-white shadow-sm';

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
            {/* Header */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 to-indigo-700 px-6 py-6 shadow-sm">
                <Link
                    href="/purchase-orders/return"
                    className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-primary-100 hover:text-white hover:underline"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to supplier returns
                </Link>
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                        <RotateCcw className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white">New Supplier Return</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <p className="rounded-lg bg-danger-50 px-4 py-2.5 text-sm text-danger-700">{error}</p>
                )}

                {/* Return details */}
                <div className={`${cardClass} space-y-4 p-5`}>
                    <h2 className="flex items-center gap-2 font-medium text-neutral-800">
                        <Truck className="h-4 w-4 text-primary-600" />
                        Return details
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className={labelClass}>Supplier</label>
                            <select
                                className={inputClass}
                                value={supplierId}
                                onChange={(e) => setSupplierId(Number(e.target.value))}
                                required
                            >
                                <option value="">Select supplier…</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Related PO (optional)</label>
                            <select
                                className={inputClass}
                                value={purchaseOrderId}
                                onChange={(e) => setPurchaseOrderId(Number(e.target.value))}
                                disabled={!supplierId}
                            >
                                <option value="">None</option>
                                {purchaseOrders.map((po) => (
                                    <option key={po.id} value={po.id}>{po.poNumber}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Invoice / GRN (optional)</label>
                            <select
                                className={inputClass}
                                value={purchaseInvoiceId}
                                onChange={(e) => setPurchaseInvoiceId(Number(e.target.value))}
                                disabled={!purchaseOrderId || !invoices.length}
                            >
                                <option value="">None</option>
                                {invoices.map((inv) => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.grnNumber} (Inv #{inv.invoiceNumber})
                                    </option>
                                ))}
                            </select>
                            {purchaseOrderId && !invoices.length && (
                                <p className="mt-1 text-xs text-neutral-400">No invoice/GRN received yet for this PO.</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Return Number</label>
                            <input
                                className={inputClass}
                                value={returnNumber}
                                onChange={(e) => setReturnNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Reason (optional)</label>
                            <input
                                className={inputClass}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. damaged, expired, wrong item"
                            />
                        </div>
                    </div>
                </div>

                {/* Items to return */}
                <div className={`${cardClass} space-y-4 p-5`}>
                    <h2 className="flex items-center gap-2 font-medium text-neutral-800">
                        <Package className="h-4 w-4 text-primary-600" />
                        Items to Return
                    </h2>
                    <div className="grid grid-cols-3 gap-3 rounded-xl bg-neutral-50 p-3">
                        <div>
                            <label className={labelClass}>Batch</label>
                            <select
                                className={inputClass}
                                value={pickBatchId}
                                onChange={(e) => handlePickBatchChange(e.target.value)}
                                disabled={!purchaseOrderId}
                            >
                                <option value="">Select batch…</option>
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.product.name} — {b.batchNumber} (avail: {b.quantityAvailable})
                                    </option>
                                ))}
                            </select>
                            {supplierId && !purchaseOrderId && (
                                <p className="mt-1 text-xs text-neutral-400">
                                    Select a PO above to load its batches — batches aren't loaded from supplier alone yet.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>
                                Quantity
                                {selectedBatch && (
                                    <span className="ml-1 normal-case text-neutral-400">
                                        (max {selectedBatch.quantityAvailable})
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                className={inputClass}
                                value={pickQty}
                                onChange={(e) => handlePickQtyChange(e.target.value)}
                                min={1}
                                max={selectedBatch?.quantityAvailable ?? undefined}
                                disabled={!selectedBatch}
                                placeholder={selectedBatch ? `1–${selectedBatch.quantityAvailable}` : 'Select a batch first'}
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={addLine}
                                disabled={!selectedBatch || !pickQty}
                            >
                                <Plus className="h-4 w-4" /> Add
                            </button>
                        </div>
                    </div>

                    {lines.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-neutral-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                                    <tr>
                                        <th className="px-3 py-2.5">Product</th>
                                        <th className="px-3 py-2.5">Batch #</th>
                                        <th className="px-3 py-2.5">Qty</th>
                                        <th className="px-3 py-2.5">Unit Price</th>
                                        <th className="px-3 py-2.5">Total</th>
                                        <th className="px-3 py-2.5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {lines.map((l) => (
                                        <tr key={l.batchId} className="hover:bg-neutral-50">
                                            <td className="px-3 py-2.5 font-medium text-neutral-700">{l.productName}</td>
                                            <td className="px-3 py-2.5 text-neutral-600">{l.batchNumber}</td>
                                            <td className="px-3 py-2.5 text-neutral-600">
                                                {l.quantity} <span className="text-xs text-neutral-400">/ {l.maxQty}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-neutral-600">₹{l.unitPrice.toFixed(2)}</td>
                                            <td className="px-3 py-2.5 font-medium text-neutral-700">₹{(l.quantity * l.unitPrice).toFixed(2)}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                                                    onClick={() => removeLine(l.batchId)}
                                                    title="Remove"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {lines.length > 0 && (
                        <div className="flex items-center justify-end gap-2 rounded-lg bg-secondary-50 px-4 py-2.5">
                            <span className="text-xs uppercase tracking-wide text-secondary-600">Debit Note Total</span>
                            <span className="text-lg font-bold text-secondary-700">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Link
                        href="/purchase-orders/return"
                        className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? 'Saving…' : 'Create Return'}
                    </button>
                </div>
            </form>
        </div>
    );
}