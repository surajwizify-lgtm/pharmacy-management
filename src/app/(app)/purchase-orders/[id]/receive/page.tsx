// 'use client';

// import { useEffect, useState, type FormEvent } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { apiFetch, ApiClientError } from '@/lib/api-client';

// type ItemDetail = {
//     batchNumber: string;
//     manufactureDate: string;
//     expiryDate: string;
//     purchaseRate: string;
//     mrp: string;
//     sellingPrice: string;
//     discountPercent: string;
//     freeQuantity: string;
//     location: string;
// };

// const inputClass =
//     'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
// const labelClass = 'mb-1 block text-xs font-medium text-neutral-600';

// export default function ReceivePurchaseOrderPage() {
//     const params = useParams();
//     const router = useRouter();
//     const id = params?.id as string;

//     const [po, setPo] = useState<any>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [saving, setSaving] = useState(false);

//     const [invoiceNumber, setInvoiceNumber] = useState('');
//     const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
//     const [isInterState, setIsInterState] = useState(false);
//     const [details, setDetails] = useState<Record<number, ItemDetail>>({});

//     useEffect(() => {
//         if (!id) return;
//         apiFetch<any>(`/api/purchase-orders/${id}`)
//             .then((data) => {
//                 setPo(data);
//                 const initial: Record<number, ItemDetail> = {};
//                 data.items.forEach((it: any) => {
//                     initial[it.productId] = {
//                         batchNumber: '',
//                         manufactureDate: '',
//                         expiryDate: '',
//                         purchaseRate: String(it.expectedRate),
//                         mrp: '',
//                         sellingPrice: '',
//                         discountPercent: '0',
//                         freeQuantity: '0',
//                         location: '',
//                     };
//                 });
//                 setDetails(initial);
//             })
//             .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Something went wrong'))
//             .finally(() => setLoading(false));
//     }, [id]);

//     function update(productId: number, field: keyof ItemDetail, value: string) {
//         setDetails({ ...details, [productId]: { ...details[productId], [field]: value } });
//     }

//     async function handleSubmit(e: FormEvent) {
//         e.preventDefault();
//         setError(null);

//         if (!invoiceNumber.trim()) return setError('Enter the supplier invoice number');

//         for (const item of po.items) {
//             const d = details[item.productId];
//             if (!d.batchNumber || !d.expiryDate || !d.mrp || !d.sellingPrice) {
//                 setError(`Complete batch details for ${item.product.name}`);
//                 return;
//             }
//         }

//         setSaving(true);
//         try {
//             const invoice = await apiFetch<{ id: number }>(`/api/purchase-orders/${id}/receive`, {
//                 method: 'POST',
//                 body: JSON.stringify({
//                     invoiceNumber,
//                     invoiceDate,
//                     isInterState,
//                     items: po.items.map((item: any) => {
//                         const d = details[item.productId];
//                         return {
//                             productId: item.productId,
//                             quantity: item.quantity,
//                             batchNumber: d.batchNumber,
//                             manufactureDate: d.manufactureDate || null,
//                             expiryDate: d.expiryDate,
//                             purchaseRate: Number(d.purchaseRate),
//                             mrp: Number(d.mrp),
//                             sellingPrice: Number(d.sellingPrice),
//                             discountPercent: Number(d.discountPercent || 0),
//                             freeQuantity: Number(d.freeQuantity || 0),
//                             gstPercentage: Number(item.product.gstPercentage),
//                             hsnCode: item.product.hsnCode,
//                             location: d.location || undefined,
//                         };
//                     }),
//                 }),
//             });
//             router.push(`/purchase-orders/purchase-invoices/${invoice.id}`);
//         } catch (err) {
//             setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
//         } finally {
//             setSaving(false);
//         }
//     }

//     if (loading) {
//         return (
//             <div className="flex items-center gap-2 text-sm text-neutral-400">
//                 <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-300" />
//                 Loading…
//             </div>
//         );
//     }
//     if (error && !po) {
//         return (
//             <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
//                 <span className="text-sm font-medium text-danger-700">{error}</span>
//             </div>
//         );
//     }
//     if (!po) return null;

//     return (
//         <div className="mx-auto w-full space-y-6">
//             <div>
//                 <Link
//                     href={`/purchase-orders`}
//                     className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
//                 >
//                     ← Back to purchase order
//                 </Link>
//                 <h1 className="mt-1 text-2xl font-semibold text-neutral-900">Receive PO #{po.poNumber}</h1>
//                 <p className="text-sm text-neutral-500">Supplier: {po.supplier.name}</p>
//             </div>

//             {error && (
//                 <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
//                     <span className="text-sm font-medium text-danger-700">{error}</span>
//                 </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-4">
//                 <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
//                     <div className="grid grid-cols-3 gap-3">
//                         <div>
//                             <label className={labelClass}>Supplier Invoice Number</label>
//                             <input
//                                 className={inputClass}
//                                 required
//                                 value={invoiceNumber}
//                                 onChange={(e) => setInvoiceNumber(e.target.value)}
//                             />
//                         </div>
//                         <div>
//                             <label className={labelClass}>Invoice Date</label>
//                             <input
//                                 type="date"
//                                 className={inputClass}
//                                 value={invoiceDate}
//                                 onChange={(e) => setInvoiceDate(e.target.value)}
//                             />
//                         </div>
//                         <div className="flex items-end pb-2">
//                             <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700">
//                                 <input
//                                     type="checkbox"
//                                     checked={isInterState}
//                                     onChange={(e) => setIsInterState(e.target.checked)}
//                                     className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
//                                 />
//                                 Inter-state purchase (IGST)
//                             </label>
//                         </div>
//                     </div>
//                 </div>

//                 {po.items.map((item: any) => {
//                     const d = details[item.productId];
//                     return (
//                         <div key={item.productId} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
//                             <h3 className="font-medium text-neutral-800">
//                                 {item.product.name}
//                                 <span className="ml-2 rounded-full bg-secondary-50 px-2 py-0.5 text-xs font-medium text-secondary-700">
//                                     Qty ordered: {item.quantity} · GST: {String(item.product.gstPercentage)}%
//                                 </span>
//                             </h3>

//                             <div className="overflow-x-auto">
//                                 <div className="flex gap-4 min-w-max">

//                                     <div className="w-44">
//                                         <label className={labelClass}>Batch Number</label>
//                                         <input
//                                             className={`${inputClass} w-full`}
//                                             required
//                                             value={d.batchNumber}
//                                             onChange={(e) =>
//                                                 update(item.productId, "batchNumber", e.target.value)
//                                             }
//                                         />
//                                     </div>

//                                     <div className="w-44">
//                                         <label className={labelClass}>Manufacture Date</label>
//                                         <input
//                                             type="date"
//                                             className={`${inputClass} w-full`}
//                                             value={d.manufactureDate}
//                                             onChange={(e) =>
//                                                 update(item.productId, "manufactureDate", e.target.value)
//                                             }
//                                         />
//                                     </div>

//                                     <div className="w-44">
//                                         <label className={labelClass}>Expiry Date</label>
//                                         <input
//                                             type="date"
//                                             className={`${inputClass} w-full`}
//                                             required
//                                             value={d.expiryDate}
//                                             onChange={(e) =>
//                                                 update(item.productId, "expiryDate", e.target.value)
//                                             }
//                                         />
//                                     </div>

//                                     <div className="w-36">
//                                         <label className={labelClass}>Purchase Rate</label>
//                                         <input
//                                             type="number"
//                                             step="0.01"
//                                             className={`${inputClass} w-full`}
//                                             value={d.purchaseRate}
//                                             onChange={(e) =>
//                                                 update(item.productId, "purchaseRate", e.target.value)
//                                             }
//                                         />
//                                     </div>

//                                     <div className="w-32">
//                                         <label className={labelClass}>MRP</label>
//                                         <input
//                                             type="number"
//                                             step="0.01"
//                                             className={`${inputClass} w-full`}
//                                             required
//                                             value={d.mrp}
//                                             onChange={(e) =>
//                                                 update(item.productId, "mrp", e.target.value)
//                                             }
//                                         />
//                                     </div>

//                                     <div className="w-36">
//                                         <label className={labelClass}>Selling Price</label>
//                                         <input
//                                             type="number"
//                                             step="0.01"
//                                             className={`${inputClass} w-full`}
//                                             required
//                                             value={d.sellingPrice}
//                                             onChange={(e) =>
//                                                 update(item.productId, "sellingPrice", e.target.value)
//                                             }
//                                         />
//                                     </div>

//                                     <div className="w-32">
//                                         <label className={labelClass}>Discount %</label>
//                                         <input
//                                             type="number"
//                                             step="0.01"
//                                             className={`${inputClass} w-full`}
//                                             value={d.discountPercent}
//                                             onChange={(e) =>
//                                                 update(item.productId, "discountPercent", e.target.value)
//                                             }
//                                         />
//                                     </div>

//                                     <div className="w-36">
//                                         <label className={labelClass}>Free Qty</label>
//                                         <input
//                                             type="number"
//                                             className={`${inputClass} w-full`}
//                                             value={d.freeQuantity}
//                                             onChange={(e) =>
//                                                 update(item.productId, "freeQuantity", e.target.value)
//                                             }
//                                         />
//                                     </div>

//                                     <div className="w-44">
//                                         <label className={labelClass}>Location</label>
//                                         <input
//                                             className={`${inputClass} w-full`}
//                                             placeholder="R3-S2"
//                                             value={d.location}
//                                             onChange={(e) =>
//                                                 update(item.productId, "location", e.target.value)
//                                             }
//                                         />
//                                     </div>

//                                 </div>
//                             </div>
//                         </div>
//                     );
//                 })}

//                 <div className="flex justify-between pt-2">
//                     <Link
//                         href={`/purchase-orders`}
//                         className="rounded-lg border border-neutral-300 bg-white px-6 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
//                     >
//                         Cancel
//                     </Link>
//                     <button
//                         type="submit"
//                         disabled={saving}
//                         className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
//                     >
//                         {saving ? 'Receiving…' : 'Confirm Receipt & Add Stock'}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';

type Location = { id: number; name: string; code: string | null };

type BatchRow = {
    key: string; // client-only unique id for React list rendering
    batchNumber: string;
    manufactureDate: string;
    expiryDate: string;
    quantity: string;
    purchaseRate: string;
    mrp: string;
    sellingPrice: string;
    discountPercent: string;
    freeQuantity: string;
    location: string;
};

const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelClass = 'mb-1 block text-xs font-medium text-neutral-600';

function makeKey() {
    return Math.random().toString(36).slice(2);
}

export default function ReceivePurchaseOrderPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [po, setPo] = useState<any>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
    const [isInterState, setIsInterState] = useState(false);
    const [details, setDetails] = useState<Record<number, BatchRow[]>>({});

    useEffect(() => {
        apiFetch<Location[]>('/api/locations').then(setLocations).catch(() => { });
    }, []);

    useEffect(() => {
        if (!id) return;
        apiFetch<any>(`/api/purchase-orders/${id}`)
            .then((data) => {
                setPo(data);
                const initial: Record<number, BatchRow[]> = {};
                data.items.forEach((it: any) => {
                    // Prefill purchase rate / MRP / selling price from the product master
                    // (falls back to the PO's expected rate if the product has no cp set).
                    initial[it.productId] = [
                        {
                            key: makeKey(),
                            batchNumber: '',
                            manufactureDate: '',
                            expiryDate: '',
                            quantity: String(it.quantity),
                            purchaseRate: String(it.product.cp || it.expectedRate || ''),
                            mrp: String(it.product.mrp || ''),
                            sellingPrice: String(it.product.sp || ''),
                            discountPercent: '0',
                            freeQuantity: '0',
                            location: '',
                        },
                    ];
                });
                setDetails(initial);
            })
            .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Something went wrong'))
            .finally(() => setLoading(false));
    }, [id]);

    function update(productId: number, key: string, field: keyof BatchRow, value: string) {
        setDetails((prev) => ({
            ...prev,
            [productId]: prev[productId].map((row) =>
                row.key === key ? { ...row, [field]: value } : row
            ),
        }));
    }

    function addBatchRow(productId: number, item: any) {
        setDetails((prev) => {
            const rows = prev[productId];
            const enteredQty = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
            const remaining = Math.max(item.quantity - enteredQty, 0);
            return {
                ...prev,
                [productId]: [
                    ...rows,
                    {
                        key: makeKey(),
                        batchNumber: '',
                        manufactureDate: '',
                        expiryDate: '',
                        quantity: remaining ? String(remaining) : '',
                        purchaseRate: String(item.product.cp || item.expectedRate || ''),
                        mrp: String(item.product.mrp || ''),
                        sellingPrice: String(item.product.sp || ''),
                        discountPercent: '0',
                        freeQuantity: '0',
                        location: '',
                    },
                ],
            };
        });
    }

    function removeBatchRow(productId: number, key: string) {
        setDetails((prev) => ({
            ...prev,
            [productId]: prev[productId].filter((row) => row.key !== key),
        }));
    }

    function remainingQty(item: any) {
        const rows = details[item.productId] || [];
        const entered = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
        return item.quantity - entered;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!invoiceNumber.trim()) return setError('Enter the supplier invoice number');

        for (const item of po.items) {
            const rows = details[item.productId] || [];
            if (rows.length === 0) {
                setError(`Add at least one batch for ${item.product.name}`);
                return;
            }
            for (const row of rows) {
                if (!row.batchNumber || !row.expiryDate || !row.mrp || !row.sellingPrice || !row.quantity) {
                    setError(`Complete all batch details for ${item.product.name}`);
                    return;
                }
            }
            const enteredQty = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
            if (enteredQty !== item.quantity) {
                setError(
                    `Batch quantities for ${item.product.name} total ${enteredQty}, but ${item.quantity} were ordered`
                );
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
                    // Flatten: each batch row becomes its own line item, all tagged
                    // with the same productId so the backend creates one Batch each.
                    items: po.items.flatMap((item: any) =>
                        (details[item.productId] || []).map((row) => ({
                            productId: item.productId,
                            quantity: Number(row.quantity),
                            batchNumber: row.batchNumber,
                            manufactureDate: row.manufactureDate || null,
                            expiryDate: row.expiryDate,
                            purchaseRate: Number(row.purchaseRate),
                            mrp: Number(row.mrp),
                            sellingPrice: Number(row.sellingPrice),
                            discountPercent: Number(row.discountPercent || 0),
                            freeQuantity: Number(row.freeQuantity || 0),
                            gstPercentage: Number(item.product.gstPercentage),
                            hsnCode: item.product.hsnCode,
                            location: row.location || undefined,
                        }))
                    ),
                }),
            });
            router.push(`/purchase-orders/purchase-invoices/${invoice.id}`);
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-300" />
                Loading…
            </div>
        );
    }
    if (error && !po) {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
                <span className="text-sm font-medium text-danger-700">{error}</span>
            </div>
        );
    }
    if (!po) return null;

    return (
        <div className="mx-auto w-full space-y-6">
            <div>
                <Link
                    href={`/purchase-orders`}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                    ← Back to purchase order
                </Link>
                <h1 className="mt-1 text-2xl font-semibold text-neutral-900">Receive PO #{po.poNumber}</h1>
                <p className="text-sm text-neutral-500">Supplier: {po.supplier.name}</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
                    <span className="text-sm font-medium text-danger-700">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className={labelClass}>Supplier Invoice Number</label>
                            <input
                                className={inputClass}
                                required
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Invoice Date</label>
                            <input
                                type="date"
                                className={inputClass}
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700">
                                <input
                                    type="checkbox"
                                    checked={isInterState}
                                    onChange={(e) => setIsInterState(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                />
                                Inter-state purchase (IGST)
                            </label>
                        </div>
                    </div>
                </div>

                {po.items.map((item: any) => {
                    const rows = details[item.productId] || [];
                    const remaining = remainingQty(item);
                    return (
                        <div key={item.productId} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-neutral-800">
                                    {item.product.name}
                                    <span className="ml-2 rounded-full bg-secondary-50 px-2 py-0.5 text-xs font-medium text-secondary-700">
                                        Qty ordered: {item.quantity} · GST: {String(item.product.gstPercentage)}%
                                    </span>
                                    <span
                                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${remaining === 0
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-amber-50 text-amber-700'
                                            }`}
                                    >
                                        {remaining === 0 ? 'Fully allocated' : `${remaining} remaining`}
                                    </span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => addBatchRow(item.productId, item)}
                                    className="text-xs font-medium text-primary-600 hover:underline"
                                >
                                    + Add another batch
                                </button>
                            </div>

                            {rows.map((d) => (
                                <div key={d.key} className="overflow-x-auto rounded-lg border border-neutral-100 bg-neutral-50/50 p-3">
                                    <div className="flex items-end gap-4 min-w-max">

                                        <div className="w-44">
                                            <label className={labelClass}>Batch Number</label>
                                            <input
                                                className={`${inputClass} w-full`}
                                                required
                                                value={d.batchNumber}
                                                onChange={(e) =>
                                                    update(item.productId, d.key, 'batchNumber', e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="w-44">
                                            <label className={labelClass}>Manufacture Date</label>
                                            <input
                                                type="date"
                                                className={`${inputClass} w-full`}
                                                value={d.manufactureDate}
                                                onChange={(e) =>
                                                    update(item.productId, d.key, 'manufactureDate', e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="w-44">
                                            <label className={labelClass}>Expiry Date</label>
                                            <input
                                                type="date"
                                                className={`${inputClass} w-full`}
                                                required
                                                value={d.expiryDate}
                                                onChange={(e) =>
                                                    update(item.productId, d.key, 'expiryDate', e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="w-28">
                                            <label className={labelClass}>Quantity</label>
                                            <input
                                                type="number"
                                                min={0}
                                                className={`${inputClass} w-full`}
                                                required
                                                value={d.quantity}
                                                onChange={(e) =>
                                                    update(item.productId, d.key, 'quantity', e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="w-36">
                                            <label className={labelClass}>Purchase Rate</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`${inputClass} w-full`}
                                                value={d.purchaseRate}
                                                onChange={(e) =>
                                                    update(item.productId, d.key, 'purchaseRate', e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="w-32">
                                            <label className={labelClass}>MRP</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`${inputClass} w-full`}
                                                required
                                                value={d.mrp}
                                                onChange={(e) =>
                                                    update(item.productId, d.key, 'mrp', e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="w-36">
                                            <label className={labelClass}>Selling Price</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`${inputClass} w-full`}
                                                required
                                                value={d.sellingPrice}
                                                onChange={(e) =>
                                                    update(item.productId, d.key, 'sellingPrice', e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="w-32">
                                            <label className={labelClass}>Discount %</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`${inputClass} w-full`}
                                                value={d.discountPercent}
                                                onChange={(e) =>
                                                    update(item.productId, d.key, 'discountPercent', e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="w-32">
                                            <label className={labelClass}>Free Qty</label>
                                            <input
                                                type="number"
                                                className={`${inputClass} w-full`}
                                                value={d.freeQuantity}
                                                onChange={(e) =>
                                                    update(item.productId, d.key, 'freeQuantity', e.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="w-44">
                                            <label className={labelClass}>Location</label>
                                            <select
                                                className={`${inputClass} w-full`}
                                                value={d.location}
                                                onChange={(e) =>
                                                    update(item.productId, d.key, 'location', e.target.value)
                                                }
                                            >
                                                <option value="">—</option>
                                                {locations.map((loc) => (
                                                    <option key={loc.id} value={loc.name}>
                                                        {loc.code ? `${loc.name} (${loc.code})` : loc.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="pb-2">
                                            {rows.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeBatchRow(item.productId, d.key)}
                                                    className="text-red-500 hover:underline text-sm"
                                                    aria-label="Remove batch"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}

                <div className="flex justify-between pt-2">
                    <Link
                        href={`/purchase-orders`}
                        className="rounded-lg border border-neutral-300 bg-white px-6 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? 'Receiving…' : 'Confirm Receipt & Add Stock'}
                    </button>
                </div>
            </form>
        </div>
    );
}