'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import {
    ArrowLeft,
    PackageCheck,
    Building2,
    FileText,
    Calendar,
    ArrowLeftRight,
    Package,
    Hash,
    Gift,
    MapPin,
    IndianRupee,
    Percent,
} from 'lucide-react';

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

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
                <div className="card h-32 animate-pulse p-5" />
                <div className="card h-56 animate-pulse p-5" />
            </div>
        );
    }
    if (error && !po) return <p className="text-sm text-red-600">{error}</p>;
    if (!po) return null;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <Link
                    href={`/purchase-orders/${id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to purchase order
                </Link>
                <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
                    <PackageCheck className="h-6 w-6 text-brand-600" />
                    Receive PO #{po.poNumber}
                </h1>
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {po.supplier.name}
                </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Invoice details */}
                <div className="card space-y-4 p-5">
                    <h2 className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <FileText className="h-4 w-4 text-brand-600" />
                        Supplier Invoice Details
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label className="label !flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5" /> Invoice number
                            </label>
                            <input className="input" required value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                        </div>
                        <div>
                            <label className="label !flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" /> Invoice date
                            </label>
                            <input type="date" className="input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                        </div>
                        <label className="mt-6 flex h-10 cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
                            <span className="flex items-center gap-1.5">
                                <ArrowLeftRight className="h-3.5 w-3.5" /> Inter-state (IGST)
                            </span>
                            <input
                                type="checkbox"
                                checked={isInterState}
                                onChange={(e) => setIsInterState(e.target.checked)}
                                className="h-4 w-4 accent-brand-600"
                            />
                        </label>
                    </div>
                </div>

                {/* Per-item batch details */}
                <div className="space-y-4">
                    <h2 className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Package className="h-4 w-4 text-brand-600" />
                        Batch Details
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {po.items.length} item{po.items.length > 1 ? 's' : ''}
                        </span>
                    </h2>

                    {po.items.map((item: any) => {
                        const d = details[item.productId];
                        return (
                            <div key={item.productId} className="card space-y-3 p-5">
                                <h3 className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                                    {item.product.name}
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                        Qty ordered: {item.quantity}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                        GST: {String(item.product.gstPercentage)}%
                                    </span>
                                </h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div>
                                        <label className="label !flex items-center gap-1.5">
                                            <Hash className="h-3.5 w-3.5" /> Batch number
                                        </label>
                                        <input
                                            className="input"
                                            required
                                            value={d.batchNumber}
                                            onChange={(e) => update(item.productId, 'batchNumber', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label !flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" /> Manufacture date (optional)
                                        </label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={d.manufactureDate}
                                            onChange={(e) => update(item.productId, 'manufactureDate', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label !flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" /> Expiry date
                                        </label>
                                        <input
                                            type="date"
                                            className="input"
                                            required
                                            value={d.expiryDate}
                                            onChange={(e) => update(item.productId, 'expiryDate', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label !flex items-center gap-1.5">
                                            <IndianRupee className="h-3.5 w-3.5" /> Purchase rate
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="input"
                                            value={d.purchaseRate}
                                            onChange={(e) => update(item.productId, 'purchaseRate', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label !flex items-center gap-1.5">
                                            <IndianRupee className="h-3.5 w-3.5" /> MRP
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="input"
                                            required
                                            value={d.mrp}
                                            onChange={(e) => update(item.productId, 'mrp', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label !flex items-center gap-1.5">
                                            <IndianRupee className="h-3.5 w-3.5" /> Selling price
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="input"
                                            required
                                            value={d.sellingPrice}
                                            onChange={(e) => update(item.productId, 'sellingPrice', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label !flex items-center gap-1.5">
                                            <Percent className="h-3.5 w-3.5" /> Discount %
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="input"
                                            value={d.discountPercent}
                                            onChange={(e) => update(item.productId, 'discountPercent', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label !flex items-center gap-1.5">
                                            <Gift className="h-3.5 w-3.5" /> Free quantity (scheme)
                                        </label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={d.freeQuantity}
                                            onChange={(e) => update(item.productId, 'freeQuantity', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label !flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" /> Location (optional)
                                        </label>
                                        <input
                                            className="input"
                                            placeholder="e.g. R3-S2"
                                            value={d.location}
                                            onChange={(e) => update(item.productId, 'location', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-4">
                    <Link
                        href={`/purchase-orders/${id}`}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </Link>
                    <button type="submit" className="btn-primary inline-flex items-center gap-1.5" disabled={saving}>
                        <PackageCheck className="h-4 w-4" />
                        {saving ? 'Receiving…' : 'Confirm Receipt & Add Stock'}
                    </button>
                </div>
            </form>
        </div>
    );
}