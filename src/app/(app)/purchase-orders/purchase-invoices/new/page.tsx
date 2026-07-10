// src/app/purchase/new/page.tsx
'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiClientError } from '@/lib/api-client';

type Supplier = { id: number; name: string };
type Product = {
    id: number;
    name: string;
    hsnCode: string | null;
    gstPercentage: number;
};

type ItemRow = {
    productId: number | '';
    batchNumber: string;
    manufactureDate: string;
    expiryDate: string;
    quantity: string;
    freeQuantity: string;
    purchaseRate: string;
    mrp: string;
    sellingPrice: string;
    discountPercent: string;
    hsnCode: string;
    gstPercentage: string;
    location: string;
};

const EMPTY_ITEM: ItemRow = {
    productId: '',
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    quantity: '',
    freeQuantity: '0',
    purchaseRate: '',
    mrp: '',
    sellingPrice: '',
    discountPercent: '0',
    hsnCode: '',
    gstPercentage: '',
    location: '',
};

function num(v: string) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

// taxable value + gst split for one line, honoring inter-state (IGST) vs intra-state (CGST+SGST)
function calcLine(item: ItemRow, isInterState: boolean) {
    const qty = num(item.quantity);
    const rate = num(item.purchaseRate);
    const discountPct = num(item.discountPercent);
    const gstPct = num(item.gstPercentage);

    const gross = qty * rate;
    const discountAmt = gross * (discountPct / 100);
    const taxableValue = gross - discountAmt;
    const gstAmount = taxableValue * (gstPct / 100);

    const cgstAmount = isInterState ? 0 : gstAmount / 2;
    const sgstAmount = isInterState ? 0 : gstAmount / 2;
    const igstAmount = isInterState ? gstAmount : 0;

    const totalAmount = taxableValue + gstAmount;

    return { taxableValue, gstAmount, cgstAmount, sgstAmount, igstAmount, totalAmount };
}

// compact input used throughout the items table — no label wrapper, tiny padding
function Cell({
    type = 'text',
    value,
    onChange,
    required,
    min,
    max,
    step,
    placeholder,
    className = '',
}: {
    type?: string;
    value: string | number;
    onChange: (v: string) => void;
    required?: boolean;
    min?: number;
    max?: number;
    step?: string;
    placeholder?: string;
    className?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            className={`w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        />
    );
}

export default function NewPurchasePage() {
    const router = useRouter();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [supplierId, setSupplierId] = useState<number | ''>('');
    const [poNumber, setPoNumber] = useState('');
    const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [grnNumber, setGrnNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [isInterState, setIsInterState] = useState(false);

    const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM }]);

    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiFetch<Supplier[]>('/api/suppliers').then(setSuppliers).catch(() => { });
        apiFetch<Product[]>('/api/products').then(setProducts).catch(() => { });
    }, []);

    function updateItem(index: number, patch: Partial<ItemRow>) {
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    }

    function onProductChange(index: number, productId: number) {
        const p = products.find((p) => p.id === productId);
        updateItem(index, {
            productId,
            hsnCode: p?.hsnCode ?? '',
            gstPercentage: p ? String(p.gstPercentage) : '',
        });
    }

    function addItem() {
        setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    const lineCalcs = useMemo(() => items.map((it) => calcLine(it, isInterState)), [items, isInterState]);

    const totals = useMemo(() => {
        return lineCalcs.reduce(
            (acc, c) => ({
                subtotal: acc.subtotal + c.taxableValue,
                totalCgst: acc.totalCgst + c.cgstAmount,
                totalSgst: acc.totalSgst + c.sgstAmount,
                totalIgst: acc.totalIgst + c.igstAmount,
                totalGst: acc.totalGst + c.gstAmount,
                totalAmount: acc.totalAmount + c.totalAmount,
            }),
            { subtotal: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, totalGst: 0, totalAmount: 0 }
        );
    }, [lineCalcs]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!supplierId) return setError('Select a supplier');
        if (!poNumber || !invoiceNumber || !grnNumber) return setError('PO number, invoice number, and GRN number are required');
        if (items.length === 0 || items.some((it) => !it.productId)) return setError('Every line needs a product');

        setSaving(true);
        try {
            const payload = {
                supplierId,
                poNumber,
                orderDate,
                expectedDate: expectedDate || undefined,
                notes: notes || undefined,

                invoiceNumber,
                grnNumber,
                invoiceDate,
                isInterState,

                subtotal: totals.subtotal,
                totalCgst: totals.totalCgst,
                totalSgst: totals.totalSgst,
                totalIgst: totals.totalIgst,
                totalGst: totals.totalGst,
                totalAmount: totals.totalAmount,

                items: items.map((it, i) => ({
                    productId: it.productId,
                    batchNumber: it.batchNumber,
                    manufactureDate: it.manufactureDate || undefined,
                    expiryDate: it.expiryDate,
                    quantity: num(it.quantity),
                    freeQuantity: num(it.freeQuantity),
                    purchaseRate: num(it.purchaseRate),
                    mrp: num(it.mrp),
                    sellingPrice: num(it.sellingPrice),
                    discountPercent: num(it.discountPercent),
                    hsnCode: it.hsnCode,
                    gstPercentage: num(it.gstPercentage),
                    cgstAmount: lineCalcs[i].cgstAmount,
                    sgstAmount: lineCalcs[i].sgstAmount,
                    igstAmount: lineCalcs[i].igstAmount,
                    taxableValue: lineCalcs[i].taxableValue,
                    totalAmount: lineCalcs[i].totalAmount,
                    location: it.location || undefined,
                })),
            };

            await apiFetch('/api/purchase-invoices/withpo', { method: 'POST', body: JSON.stringify(payload) });
            router.push('/purchase-orders/purchase-invoices');
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-[1400px] pb-6">
            <form onSubmit={handleSubmit} className="flex h-[calc(100vh-2rem)] flex-col">
                {/* Sticky top bar: title + submit, always visible, no scrolling needed to save */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">New purchase</h1>
                        <p className="text-xs text-slate-500">Creates the purchase order and receives it in one go.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {error && <p className="mr-2 text-xs text-red-600">{error}</p>}
                        <button
                            type="button"
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {saving ? 'Saving…' : 'Create purchase order & invoice'}
                        </button>
                    </div>
                </div>

                {/* PO + Invoice fields, compact single row, no section cards */}
                <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 border-b border-slate-200 py-3 lg:grid-cols-4 xl:grid-cols-8">
                    <div className="xl:col-span-2">
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Supplier</label>
                        <select
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs"
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                            required
                        >
                            <option value="">Select…</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">PO number</label>
                        <Cell value={poNumber} onChange={setPoNumber} required />
                    </div>
                    <div>
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Order date</label>
                        <Cell type="date" value={orderDate} onChange={setOrderDate} required />
                    </div>
                    <div>
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Expected date</label>
                        <Cell type="date" value={expectedDate} onChange={setExpectedDate} />
                    </div>
                    <div>
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Invoice no.</label>
                        <Cell value={invoiceNumber} onChange={setInvoiceNumber} required />
                    </div>
                    <div>
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">GRN number</label>
                        <Cell value={grnNumber} onChange={setGrnNumber} required />
                    </div>
                    <div>
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Invoice date</label>
                        <Cell type="date" value={invoiceDate} onChange={setInvoiceDate} required />
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Notes</label>
                        <Cell value={notes} onChange={setNotes} placeholder="Optional" />
                    </div>
                    <div className="flex items-end pb-1.5">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700">
                            <input
                                type="checkbox"
                                checked={isInterState}
                                onChange={(e) => setIsInterState(e.target.checked)}
                            />
                            Inter-state (IGST)
                        </label>
                    </div>
                </div>

                {/* Items table — scrolls internally, everything else on the page stays fixed */}
                <div className="flex min-h-0 flex-1 flex-col py-3">
                    <div className="mb-2 flex shrink-0 items-center justify-between">
                        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Items ({items.length})
                        </h2>
                        <button type="button" onClick={addItem} className="text-xs font-medium text-blue-600 hover:underline">
                            + Add line
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200">
                        <table className="w-full min-w-[1600px] border-collapse text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-2 py-2 text-left font-semibold">Product</th>
                                    <th className="px-2 py-2 text-left font-semibold">Batch</th>
                                    <th className="px-2 py-2 text-left font-semibold">Mfg date</th>
                                    <th className="px-2 py-2 text-left font-semibold">Expiry</th>
                                    <th className="px-2 py-2 text-left font-semibold">Qty</th>
                                    <th className="px-2 py-2 text-left font-semibold">Free</th>
                                    <th className="px-2 py-2 text-left font-semibold">Rate</th>
                                    <th className="px-2 py-2 text-left font-semibold">MRP</th>
                                    <th className="px-2 py-2 text-left font-semibold">Sell price</th>
                                    <th className="px-2 py-2 text-left font-semibold">Disc %</th>
                                    <th className="px-2 py-2 text-left font-semibold">HSN</th>
                                    <th className="px-2 py-2 text-left font-semibold">GST %</th>
                                    <th className="px-2 py-2 text-left font-semibold">Rack</th>
                                    <th className="px-2 py-2 text-right font-semibold">Total</th>
                                    <th className="px-2 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((it, i) => {
                                    const c = lineCalcs[i];
                                    return (
                                        <tr key={i} className="align-top hover:bg-slate-50">
                                            <td className="min-w-[160px] px-2 py-1.5">
                                                <select
                                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={it.productId}
                                                    onChange={(e) => onProductChange(i, Number(e.target.value))}
                                                    required
                                                >
                                                    <option value="">Select…</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="min-w-[100px] px-2 py-1.5">
                                                <Cell value={it.batchNumber} onChange={(v) => updateItem(i, { batchNumber: v })} required />
                                            </td>
                                            <td className="min-w-[130px] px-2 py-1.5">
                                                <Cell type="date" value={it.manufactureDate} onChange={(v) => updateItem(i, { manufactureDate: v })} />
                                            </td>
                                            <td className="min-w-[130px] px-2 py-1.5">
                                                <Cell type="date" value={it.expiryDate} onChange={(v) => updateItem(i, { expiryDate: v })} required />
                                            </td>
                                            <td className="min-w-[70px] px-2 py-1.5">
                                                <Cell type="number" min={0} value={it.quantity} onChange={(v) => updateItem(i, { quantity: v })} required />
                                            </td>
                                            <td className="min-w-[60px] px-2 py-1.5">
                                                <Cell type="number" min={0} value={it.freeQuantity} onChange={(v) => updateItem(i, { freeQuantity: v })} />
                                            </td>
                                            <td className="min-w-[85px] px-2 py-1.5">
                                                <Cell type="number" min={0} step="0.01" value={it.purchaseRate} onChange={(v) => updateItem(i, { purchaseRate: v })} required />
                                            </td>
                                            <td className="min-w-[85px] px-2 py-1.5">
                                                <Cell type="number" min={0} step="0.01" value={it.mrp} onChange={(v) => updateItem(i, { mrp: v })} required />
                                            </td>
                                            <td className="min-w-[85px] px-2 py-1.5">
                                                <Cell type="number" min={0} step="0.01" value={it.sellingPrice} onChange={(v) => updateItem(i, { sellingPrice: v })} required />
                                            </td>
                                            <td className="min-w-[70px] px-2 py-1.5">
                                                <Cell type="number" min={0} max={100} step="0.01" value={it.discountPercent} onChange={(v) => updateItem(i, { discountPercent: v })} />
                                            </td>
                                            <td className="min-w-[85px] px-2 py-1.5">
                                                <Cell value={it.hsnCode} onChange={(v) => updateItem(i, { hsnCode: v })} required />
                                            </td>
                                            <td className="min-w-[70px] px-2 py-1.5">
                                                <Cell type="number" min={0} max={28} step="0.01" value={it.gstPercentage} onChange={(v) => updateItem(i, { gstPercentage: v })} required />
                                            </td>
                                            <td className="min-w-[85px] px-2 py-1.5">
                                                <Cell value={it.location} onChange={(v) => updateItem(i, { location: v })} />
                                            </td>
                                            <td className="min-w-[90px] whitespace-nowrap px-2 py-1.5 text-right font-semibold text-slate-700">
                                                ₹{c.totalAmount.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-1.5 text-right">
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(i)}
                                                        className="text-red-500 hover:underline"
                                                        aria-label="Remove line"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals — compact strip, always visible above the sticky action bar */}
                <div className="flex shrink-0 items-center justify-end gap-6 border-t border-slate-200 pt-3 text-xs">
                    <span className="text-slate-500">Subtotal <span className="font-medium text-slate-700">₹{totals.subtotal.toFixed(2)}</span></span>
                    {isInterState ? (
                        <span className="text-slate-500">IGST <span className="font-medium text-slate-700">₹{totals.totalIgst.toFixed(2)}</span></span>
                    ) : (
                        <>
                            <span className="text-slate-500">CGST <span className="font-medium text-slate-700">₹{totals.totalCgst.toFixed(2)}</span></span>
                            <span className="text-slate-500">SGST <span className="font-medium text-slate-700">₹{totals.totalSgst.toFixed(2)}</span></span>
                        </>
                    )}
                    <span className="text-sm font-semibold text-slate-900">Total ₹{totals.totalAmount.toFixed(2)}</span>
                </div>
            </form>
        </div>
    );
}