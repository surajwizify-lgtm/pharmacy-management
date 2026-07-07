// 'use client';

// import { useEffect, useState, type FormEvent } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { apiFetch, ApiClientError } from '@/lib/api-client';
// import type { product } from '@/types';

// type Supplier = { id: number; name: string };

// type SelectedItem = {
//     productId: number;
//     productName: string;
//     quantity: number;
//     unitPrice: number;
// };

// type BatchDetail = {
//     batchNumber: string;
//     expiryDate: string;
//     sellingPrice: string;
//     location: string;
// };

// export default function NewPurchaseOrderPage() {
//     const router = useRouter();
//     const [step, setStep] = useState(1);
//     const [error, setError] = useState<string | null>(null);
//     const [saving, setSaving] = useState(false);

//     // Step 1
//     const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//     const [supplierId, setSupplierId] = useState<number | ''>('');
//     const [poNumber, setPoNumber] = useState('');
//     const [expectedDate, setExpectedDate] = useState('');

//     // Step 2
//     const [products, setproducts] = useState<product[]>([]);
//     const [pickproductId, setPickproductId] = useState<number | ''>('');
//     const [pickQty, setPickQty] = useState('');
//     const [pickPrice, setPickPrice] = useState('');
//     const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

//     // Step 3
//     const [batchDetails, setBatchDetails] = useState<Record<number, BatchDetail>>({});

//     useEffect(() => {
//         apiFetch<Supplier[]>('/api/suppliers').then(setSuppliers);
//         apiFetch<product[]>('/api/products').then(setproducts);
//     }, []);

//     // ---- Step 1 ----
//     function goToStep2() {
//         setError(null);
//         if (!supplierId) return setError('Please select a supplier');
//         if (!poNumber.trim()) return setError('PO number is required');
//         setStep(2);
//     }

//     // ---- Step 2 ----
//     function addItem() {
//         setError(null);
//         if (!pickproductId) return setError('Select a product');
//         if (!pickQty || Number(pickQty) <= 0) return setError('Enter a valid quantity');
//         if (!pickPrice || Number(pickPrice) <= 0) return setError('Enter a valid purchase price');
//         if (selectedItems.some((i) => i.productId === pickproductId)) {
//             return setError('That product is already added');
//         }

//         const med = products.find((m) => m.id === pickproductId)!;
//         setSelectedItems([
//             ...selectedItems,
//             { productId: med.id, productName: med.name, quantity: Number(pickQty), unitPrice: Number(pickPrice) },
//         ]);
//         setPickproductId('');
//         setPickQty('');
//         setPickPrice('');
//     }

//     function removeItem(productId: number) {
//         setSelectedItems(selectedItems.filter((i) => i.productId !== productId));
//         const rest = { ...batchDetails };
//         delete rest[productId];
//         setBatchDetails(rest);
//     }

//     function goToStep3() {
//         setError(null);
//         if (!selectedItems.length) return setError('Add at least one product');
//         // pre-fill batch defaults
//         const defaults: Record<number, BatchDetail> = {};
//         selectedItems.forEach((i) => {
//             defaults[i.productId] = batchDetails[i.productId] || {
//                 batchNumber: '',
//                 expiryDate: '',
//                 sellingPrice: '',
//                 location: '',
//             };
//         });
//         setBatchDetails(defaults);
//         setStep(3);
//     }

//     // ---- Step 3 ----
//     function updateBatch(productId: number, field: keyof BatchDetail, value: string) {
//         setBatchDetails({
//             ...batchDetails,
//             [productId]: { ...batchDetails[productId], [field]: value },
//         });
//     }

//     async function handleSubmit(e: FormEvent) {
//         e.preventDefault();
//         setError(null);

//         for (const item of selectedItems) {
//             const b = batchDetails[item.productId];
//             if (!b.batchNumber || !b.expiryDate || !b.sellingPrice) {
//                 setError(`Complete batch details for ${item.productName}`);
//                 return;
//             }
//         }

//         setSaving(true);
//         try {
//             const payload = {
//                 supplierId,
//                 poNumber,
//                 expectedDate: expectedDate || null,
//                 items: selectedItems.map((item) => ({
//                     productId: item.productId,
//                     quantity: item.quantity,
//                     unitPrice: item.unitPrice,
//                     batchNumber: batchDetails[item.productId].batchNumber,
//                     expiryDate: batchDetails[item.productId].expiryDate,
//                     sellingPrice: Number(batchDetails[item.productId].sellingPrice),
//                     location: batchDetails[item.productId].location || undefined,
//                 })),
//             };

//             const po = await apiFetch<{ id: number }>('/api/purchase-orders', {
//                 method: 'POST',
//                 body: JSON.stringify(payload),
//             });

//             router.push(`/purchase-orders/${po.id}`);
//         } catch (err) {
//             setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
//         } finally {
//             setSaving(false);
//         }
//     }

//     return (
//         <div className="mx-auto max-w-3xl space-y-6">
//             <div>
//                 <Link href="/purchase-orders" className="text-xs font-medium text-brand-600 hover:underline">
//                     ← Back to purchase orders
//                 </Link>
//                 <h1 className="mt-1 text-2xl font-semibold text-slate-900">New Purchase Order</h1>
//             </div>

//             {/* Step indicator */}
//             <div className="flex items-center gap-2 text-sm">
//                 {['Supplier', 'products', 'Batch Details'].map((label, i) => (
//                     <div key={label} className="flex items-center gap-2">
//                         <span
//                             className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${step === i + 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
//                                 }`}
//                         >
//                             {i + 1}
//                         </span>
//                         <span className={step === i + 1 ? 'font-medium text-slate-800' : 'text-slate-400'}>{label}</span>
//                         {i < 2 && <span className="mx-1 text-slate-300">→</span>}
//                     </div>
//                 ))}
//             </div>

//             {error && <p className="text-sm text-red-600">{error}</p>}

//             {/* STEP 1 */}
//             {step === 1 && (
//                 <div className="card space-y-4 p-5">
//                     <div>
//                         <label className="label">Supplier</label>
//                         <select
//                             className="input"
//                             value={supplierId}
//                             onChange={(e) => setSupplierId(Number(e.target.value))}
//                         >
//                             <option value="">Select supplier…</option>
//                             {suppliers.map((s) => (
//                                 <option key={s.id} value={s.id}>{s.name}</option>
//                             ))}
//                         </select>
//                     </div>
//                     <div>
//                         <label className="label">PO Number</label>
//                         <input className="input" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
//                     </div>
//                     <div>
//                         <label className="label">Expected Date (optional)</label>
//                         <input
//                             type="date"
//                             className="input"
//                             value={expectedDate}
//                             onChange={(e) => setExpectedDate(e.target.value)}
//                         />
//                     </div>
//                     <div className="flex justify-end pt-2">
//                         <button className="btn-primary" onClick={goToStep2}>Next: Add products</button>
//                     </div>
//                 </div>
//             )}

//             {/* STEP 2 */}
//             {step === 2 && (
//                 <div className="card space-y-4 p-5">
//                     <div className="grid grid-cols-3 gap-3">
//                         <div>
//                             <label className="label">product</label>
//                             <select
//                                 className="input"
//                                 value={pickproductId}
//                                 onChange={(e) => setPickproductId(Number(e.target.value))}
//                             >
//                                 <option value="">Select…</option>
//                                 {products.map((m) => (
//                                     <option key={m.id} value={m.id}>{m.name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                         <div>
//                             <label className="label">Quantity</label>
//                             <input type="number" className="input" value={pickQty} onChange={(e) => setPickQty(e.target.value)} />
//                         </div>
//                         <div>
//                             <label className="label">Purchase Price (per unit)</label>
//                             <input type="number" step="0.01" className="input" value={pickPrice} onChange={(e) => setPickPrice(e.target.value)} />
//                         </div>
//                     </div>
//                     <button type="button" className="btn-secondary" onClick={addItem}>+ Add product</button>

//                     {selectedItems.length > 0 && (
//                         <table className="w-full text-left text-sm">
//                             <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
//                                 <tr>
//                                     <th className="py-2">product</th>
//                                     <th className="py-2">Qty</th>
//                                     <th className="py-2">Unit Price</th>
//                                     <th className="py-2">Total</th>
//                                     <th className="py-2"></th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-slate-100">
//                                 {selectedItems.map((i) => (
//                                     <tr key={i.productId}>
//                                         <td className="py-2">{i.productName}</td>
//                                         <td className="py-2">{i.quantity}</td>
//                                         <td className="py-2">₹{i.unitPrice}</td>
//                                         <td className="py-2">₹{(i.quantity * i.unitPrice).toFixed(2)}</td>
//                                         <td className="py-2">
//                                             <button className="text-xs text-red-600" onClick={() => removeItem(i.productId)}>Remove</button>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     )}

//                     <div className="flex justify-between pt-2">
//                         <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
//                         <button className="btn-primary" onClick={goToStep3}>Next: Batch Details</button>
//                     </div>
//                 </div>
//             )}

//             {/* STEP 3 */}
//             {step === 3 && (
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     {selectedItems.map((item) => {
//                         const b = batchDetails[item.productId];
//                         return (
//                             <div key={item.productId} className="card space-y-3 p-5">
//                                 <h3 className="font-medium text-slate-800">
//                                     {item.productName} <span className="text-xs text-slate-400">(Qty: {item.quantity})</span>
//                                 </h3>
//                                 <div className="grid grid-cols-2 gap-3">
//                                     <div>
//                                         <label className="label">Batch Number</label>
//                                         <input
//                                             className="input"
//                                             required
//                                             value={b?.batchNumber || ''}
//                                             onChange={(e) => updateBatch(item.productId, 'batchNumber', e.target.value)}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="label">Expiry Date</label>
//                                         <input
//                                             type="date"
//                                             className="input"
//                                             required
//                                             value={b?.expiryDate || ''}
//                                             onChange={(e) => updateBatch(item.productId, 'expiryDate', e.target.value)}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="label">Selling Price</label>
//                                         <input
//                                             type="number"
//                                             step="0.01"
//                                             className="input"
//                                             required
//                                             value={b?.sellingPrice || ''}
//                                             onChange={(e) => updateBatch(item.productId, 'sellingPrice', e.target.value)}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="label">Location (optional)</label>
//                                         <input
//                                             className="input"
//                                             placeholder="e.g. R3-S2"
//                                             value={b?.location || ''}
//                                             onChange={(e) => updateBatch(item.productId, 'location', e.target.value)}
//                                         />
//                                     </div>
//                                 </div>
//                             </div>
//                         );
//                     })}

//                     <div className="flex justify-between pt-2">
//                         <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Back</button>
//                         <button type="submit" className="btn-primary" disabled={saving}>
//                             {saving ? 'Saving…' : 'Create Purchase Order'}
//                         </button>
//                     </div>
//                 </form>
//             )}
//         </div>
//     );
// }
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { product } from '@/types';

type Supplier = { id: number; name: string };

type Line = {
    productId: number;
    productName: string;
    quantity: number;
    expectedRate: number;
};

export default function NewPurchaseOrderPage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setproducts] = useState<product[]>([]);

    const [supplierId, setSupplierId] = useState<number | ''>('');
    const [poNumber, setPoNumber] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');

    const [pickproductId, setPickproductId] = useState<number | ''>('');
    const [pickQty, setPickQty] = useState('');
    const [pickRate, setPickRate] = useState('');
    const [lines, setLines] = useState<Line[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiFetch<Supplier[]>('/api/suppliers').then(setSuppliers);
        apiFetch<product[]>('/api/products').then(setproducts);
    }, []);

    function addLine() {
        setError(null);
        if (!pickproductId) return setError('Select a product');
        if (!pickQty || Number(pickQty) <= 0) return setError('Enter a valid quantity');
        if (!pickRate || Number(pickRate) <= 0) return setError('Enter a valid expected rate');
        if (lines.some((l) => l.productId === pickproductId)) return setError('product already added');

        const med = products.find((m) => m.id === pickproductId)!;
        setLines([...lines, { productId: med.id, productName: med.name, quantity: Number(pickQty), expectedRate: Number(pickRate) }]);
        setPickproductId('');
        setPickQty('');
        setPickRate('');
    }

    function removeLine(productId: number) {
        setLines(lines.filter((l) => l.productId !== productId));
    }

    async function handleSubmit() {
        setError(null);
        if (!supplierId) return setError('Select a supplier');
        if (!poNumber.trim()) return setError('PO number is required');
        if (!lines.length) return setError('Add at least one product');

        setSaving(true);
        try {
            const po = await apiFetch<{ id: number }>('/api/purchase-orders', {
                method: 'POST',
                body: JSON.stringify({
                    supplierId,
                    poNumber,
                    expectedDate: expectedDate || null,
                    notes: notes || null,
                    items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, expectedRate: l.expectedRate })),
                }),
            });
            router.push(`/purchase-orders/${po.id}`);
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    const totalExpected = lines.reduce((sum, l) => sum + l.quantity * l.expectedRate, 0);

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link href="/purchase-orders" className="text-xs font-medium text-brand-600 hover:underline">
                    ← Back to purchase orders
                </Link>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">New Purchase Order</h1>
                <p className="text-sm text-slate-500">This is a request to your supplier — no stock is added yet.</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="card space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Supplier</label>
                        <select className="input" value={supplierId} onChange={(e) => setSupplierId(Number(e.target.value))}>
                            <option value="">Select supplier…</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">PO Number</label>
                        <input className="input" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Expected Date (optional)</label>
                        <input type="date" className="input" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Notes (optional)</label>
                        <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="card space-y-4 p-5">
                <h2 className="font-medium text-slate-800">Requested products</h2>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="label">product</label>
                        <select className="input" value={pickproductId} onChange={(e) => setPickproductId(Number(e.target.value))}>
                            <option value="">Select…</option>
                            {products.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Quantity</label>
                        <input type="number" className="input" value={pickQty} onChange={(e) => setPickQty(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Expected Rate (per unit)</label>
                        <input type="number" step="0.01" className="input" value={pickRate} onChange={(e) => setPickRate(e.target.value)} />
                    </div>
                </div>
                <button type="button" className="btn-secondary" onClick={addLine}>+ Add product</button>

                {lines.length > 0 && (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="py-2">product</th>
                                <th className="py-2">Qty</th>
                                <th className="py-2">Expected Rate</th>
                                <th className="py-2">Total</th>
                                <th className="py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {lines.map((l) => (
                                <tr key={l.productId}>
                                    <td className="py-2">{l.productName}</td>
                                    <td className="py-2">{l.quantity}</td>
                                    <td className="py-2">₹{l.expectedRate.toFixed(2)}</td>
                                    <td className="py-2">₹{(l.quantity * l.expectedRate).toFixed(2)}</td>
                                    <td className="py-2">
                                        <button className="text-xs text-red-600" onClick={() => removeLine(l.productId)}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {lines.length > 0 && (
                    <p className="text-right text-sm font-medium text-slate-700">Estimated Total: ₹{totalExpected.toFixed(2)}</p>
                )}
            </div>

            <div className="flex justify-end gap-2">
                <Link href="/purchase-orders" className="btn-secondary">Cancel</Link>
                <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Saving…' : 'Create Purchase Order'}
                </button>
            </div>
        </div>
    );
}