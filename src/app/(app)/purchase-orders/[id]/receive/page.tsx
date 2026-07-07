'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';

type ItemDetail = {
    batchNumber: string;
    manufactureDate: string;
    expiryDate: string;
    purchaseRate: string;
    mrp: string;
    sellingPrice: string;
    discountPercent: string;
    freeQuantity: string;
    location: string;
};

export default function ReceivePurchaseOrderPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [po, setPo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
    const [isInterState, setIsInterState] = useState(false);
    const [details, setDetails] = useState<Record<number, ItemDetail>>({});

    useEffect(() => {
        if (!id) return;
        apiFetch<any>(`/api/purchase-orders/${id}`)
            .then((data) => {
                setPo(data);
                const initial: Record<number, ItemDetail> = {};
                data.items.forEach((it: any) => {
                    initial[it.productId] = {
                        batchNumber: '',
                        manufactureDate: '',
                        expiryDate: '',
                        purchaseRate: String(it.expectedRate),
                        mrp: '',
                        sellingPrice: '',
                        discountPercent: '0',
                        freeQuantity: '0',
                        location: '',
                    };
                });
                setDetails(initial);
            })
            .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Something went wrong'))
            .finally(() => setLoading(false));
    }, [id]);

    function update(productId: number, field: keyof ItemDetail, value: string) {
        setDetails({ ...details, [productId]: { ...details[productId], [field]: value } });
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!invoiceNumber.trim()) return setError('Enter the supplier invoice number');

        for (const item of po.items) {
            const d = details[item.productId];
            if (!d.batchNumber || !d.expiryDate || !d.mrp || !d.sellingPrice) {
                setError(`Complete batch details for ${item.product.name}`);
                return;
            }
        }

        setSaving(true);
        try {
            const invoice = await apiFetch<{ id: number }>(`/api/purchase-orders/${id}/receive`, {
                method: 'POST',
                body: JSON.stringify({
                    invoiceNumber,
                    invoiceDate,
                    isInterState,
                    items: po.items.map((item: any) => {
                        const d = details[item.productId];
                        return {
                            productId: item.productId,
                            quantity: item.quantity,
                            batchNumber: d.batchNumber,
                            manufactureDate: d.manufactureDate || null,
                            expiryDate: d.expiryDate,
                            purchaseRate: Number(d.purchaseRate),
                            mrp: Number(d.mrp),
                            sellingPrice: Number(d.sellingPrice),
                            discountPercent: Number(d.discountPercent || 0),
                            freeQuantity: Number(d.freeQuantity || 0),
                            gstPercentage: Number(item.product.gstPercentage),
                            hsnCode: item.product.hsnCode,
                            location: d.location || undefined,
                        };
                    }),
                }),
            });
            router.push(`/purchase-invoices/${invoice.id}`);
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p className="text-slate-400">Loading…</p>;
    if (error && !po) return <p className="text-sm text-red-600">{error}</p>;
    if (!po) return null;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link href={`/purchase-orders/${id}`} className="text-xs font-medium text-brand-600 hover:underline">
                    ← Back to purchase order
                </Link>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">Receive PO #{po.poNumber}</h1>
                <p className="text-sm text-slate-500">Supplier: {po.supplier.name}</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="card space-y-4 p-5">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="label">Supplier Invoice Number</label>
                            <input className="input" required value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                        </div>
                        <div>
                            <label className="label">Invoice Date</label>
                            <input type="date" className="input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked={isInterState} onChange={(e) => setIsInterState(e.target.checked)} />
                                Inter-state purchase (IGST)
                            </label>
                        </div>
                    </div>
                </div>

                {po.items.map((item: any) => {
                    const d = details[item.productId];
                    return (
                        <div key={item.productId} className="card space-y-3 p-5">
                            <h3 className="font-medium text-slate-800">
                                {item.product.name}{' '}
                                <span className="text-xs text-slate-400">
                                    (Qty ordered: {item.quantity} · GST: {String(item.product.gstPercentage)}%)
                                </span>
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="label">Batch Number</label>
                                    <input className="input" required value={d.batchNumber} onChange={(e) => update(item.productId, 'batchNumber', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Manufacture Date (optional)</label>
                                    <input type="date" className="input" value={d.manufactureDate} onChange={(e) => update(item.productId, 'manufactureDate', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Expiry Date</label>
                                    <input type="date" className="input" required value={d.expiryDate} onChange={(e) => update(item.productId, 'expiryDate', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Purchase Rate</label>
                                    <input type="number" step="0.01" className="input" value={d.purchaseRate} onChange={(e) => update(item.productId, 'purchaseRate', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">MRP</label>
                                    <input type="number" step="0.01" className="input" required value={d.mrp} onChange={(e) => update(item.productId, 'mrp', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Selling Price</label>
                                    <input type="number" step="0.01" className="input" required value={d.sellingPrice} onChange={(e) => update(item.productId, 'sellingPrice', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Discount %</label>
                                    <input type="number" step="0.01" className="input" value={d.discountPercent} onChange={(e) => update(item.productId, 'discountPercent', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Free Quantity (scheme)</label>
                                    <input type="number" className="input" value={d.freeQuantity} onChange={(e) => update(item.productId, 'freeQuantity', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Location (optional)</label>
                                    <input className="input" placeholder="e.g. R3-S2" value={d.location} onChange={(e) => update(item.productId, 'location', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div className="flex justify-between pt-2">
                    <Link href={`/purchase-orders/${id}`} className="btn-secondary">Cancel</Link>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Receiving…' : 'Confirm Receipt & Add Stock'}
                    </button>
                </div>
            </form>
        </div>
    );
}