
// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { apiFetch, ApiClientError } from '@/lib/api-client';
// import type { product } from '@/types';
// import PurchaseOrderPrint from '@/components/print/PurchaseOrderPrint';
// import { printElement } from '@/lib/print-pdf';
// import PurchaseOrderPrintButton from '@/components/purchase-orders/PurchaseOrderPrintButton';

// type Supplier = { id: number; name: string };

// type Line = {
//     productId: number;
//     productName: string;
//     quantity: number;
//     expectedRate: number;
//     genericName?: string;
//     manufacturer?: string;
// };

// export default function NewPurchaseOrderPage() {
//     const router = useRouter();
//     const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//     const [products, setproducts] = useState<product[]>([]);

//     const [supplierId, setSupplierId] = useState<number | ''>('');
//     const [expectedDate, setExpectedDate] = useState('');
//     const [notes, setNotes] = useState('');

//     const [pickproductId, setPickproductId] = useState<number | ''>('');
//     const [pickQty, setPickQty] = useState('');
//     const [pickRate, setPickRate] = useState('');
//     const [lines, setLines] = useState<Line[]>([]);

//     const [error, setError] = useState<string | null>(null);
//     const [saving, setSaving] = useState(false);
//     const [createdPO, setCreatedPO] = useState<{ id: number } | null>(null);
//     const [sending, setSending] = useState(false);

//     async function sendEmail() {
//         setSending(true);

//         try {
//             await apiFetch(`/api/purchase-orders/${createdPO?.id}/email`, {
//                 method: "POST",
//             });

//             alert("Purchase Order emailed successfully.");
//         } catch (e) {
//             alert("Failed to send email.");
//         } finally {
//             setSending(false);
//         }
//     }

//     useEffect(() => {
//         apiFetch<Supplier[]>('/api/suppliers').then(setSuppliers);
//         apiFetch<product[]>('/api/products').then(setproducts);
//     }, []);

//     function addLine() {
//         setError(null);
//         if (!pickproductId) return setError('Select a product');
//         if (!pickQty || Number(pickQty) <= 0) return setError('Enter a valid quantity');
//         if (!pickRate || Number(pickRate) <= 0) return setError('Enter a valid expected rate');
//         if (lines.some((l) => l.productId === pickproductId)) return setError('product already added');

//         const med = products.find((m) => m.id === pickproductId)!;
//         setLines([...lines, { productId: med.id, productName: med.name, genericName: med.genericName, manufacturer: med.manufacturer, quantity: Number(pickQty), expectedRate: Number(pickRate) }]);
//         setPickproductId('');
//         setPickQty('');
//         setPickRate('');
//     }

//     function removeLine(productId: number) {
//         setLines(lines.filter((l) => l.productId !== productId));
//     }

//     async function handleSubmit() {
//         setError(null);
//         if (!supplierId) return setError('Select a supplier');
//         if (!lines.length) return setError('Add at least one product');

//         setSaving(true);
//         try {
//             const po = await apiFetch<{ id: number }>('/api/purchase-orders', {
//                 method: 'POST',
//                 body: JSON.stringify({
//                     supplierId,
//                     expectedDate: expectedDate || null,
//                     notes: notes || null,
//                     items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, expectedRate: l.expectedRate })),
//                 }),
//             });
//             // router.push(`/purchase-orders/${po.id}`);
//             setCreatedPO(po);
//         } catch (err) {
//             setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
//         } finally {
//             setSaving(false);
//         }
//     }

//     const totalExpected = lines.reduce((sum, l) => sum + l.quantity * l.expectedRate, 0);
//     const supplierName = suppliers.find((s) => s.id === supplierId)?.name || '';
//     if (createdPO) {
//         return (
//             <div className="mx-auto max-w-lg space-y-5 rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
//                 <h2 className="text-lg font-semibold text-neutral-900">Purchase Order Created</h2>
//                 <p className="text-sm text-neutral-500">PO #{createdPO.id} has been created successfully.</p>

//                 <div className="flex justify-center gap-2">
//                     {/* <button
//                         className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
//                         onClick={() => printElement('po-print-area', `PO-${createdPO.id}.pdf`)}
//                     >
//                         🖨️ Print Purchase Order
//                     </button> */}
//                     <PurchaseOrderPrintButton poId={createdPO.id} />
//                     <button
//                         onClick={sendEmail}
//                         className="rounded-lg bg-blue-600 px-4 py-2 text-white"
//                     >
//                         📧 Email Supplier
//                     </button>

//                     <button
//                         className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
//                         onClick={() => router.push('/purchase-orders/registered')}
//                     >
//                         PO list
//                     </button>
//                 </div>

//                 {/* off-screen render target for html2canvas (must be visible in DOM, not display:none) */}
//                 <div style={{ position: 'fixed', top: 0, left: '-9999px' }}>
//                     <PurchaseOrderPrint
//                         poId={createdPO.id}
//                         supplierName={supplierName}
//                         createdDate={new Date().toLocaleDateString()}
//                         expectedDate={expectedDate}
//                         notes={notes}
//                         items={lines.map((l) => ({
//                             productName: l.productName,
//                             genericName: l.genericName,
//                             manufacturer: l.manufacturer,
//                             quantity: l.quantity,
//                             expectedRate: l.expectedRate,
//                         }))}
//                         total={totalExpected}
//                     />
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="mx-auto max-w-3xl space-y-6">
//             <div>
//                 <Link
//                     href="/purchase-orders"
//                     className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
//                 >
//                     ← Back to purchase orders
//                 </Link>
//                 <h1 className="mt-1 text-2xl font-semibold text-neutral-900">New Purchase Order</h1>
//                 <p className="text-sm text-neutral-500">This is a request to your supplier — no stock is added yet.</p>
//             </div>

//             {error && (
//                 <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
//                     <span className="text-sm font-medium text-danger-700">{error}</span>
//                 </div>
//             )}

//             <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
//                 <div className="grid grid-cols-2 gap-3">
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Supplier</label>
//                         <select
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
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
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Purchase Order ID</label>
//                         <input
//                             className="w-full cursor-not-allowed rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-500"
//                             value="Auto Generated"
//                             disabled
//                         />
//                         <p className="mt-1 text-xs text-neutral-400">
//                             Purchase Order ID will be generated automatically when the order is created.
//                         </p>
//                     </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-3">
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Expected Date (optional)</label>
//                         <input
//                             type="date"
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
//                             value={expectedDate}
//                             onChange={(e) => setExpectedDate(e.target.value)}
//                         />
//                     </div>
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Notes (optional)</label>
//                         <input
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
//                             value={notes}
//                             onChange={(e) => setNotes(e.target.value)}
//                         />
//                     </div>
//                 </div>
//             </div>

//             <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
//                 <h2 className="font-medium text-neutral-800">Requested products</h2>
//                 <div className="grid grid-cols-3 gap-3">
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">product</label>
//                         <select
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
//                             value={pickproductId}
//                             // onChange={(e) => setPickproductId(Number(e.target.value))}
//                             onChange={(e) => {
//                                 const id = Number(e.target.value);
//                                 setPickproductId(id);

//                                 const selected = products.find((m) => m.id === id);
//                                 console.log('Selected product:', selected);
//                                 setPickRate(selected?.cp != null ? String(selected.cp) : '');
//                             }}
//                         >
//                             <option value="">Select…</option>
//                             {products.map((m) => (
//                                 <option key={m.id} value={m.id}>{m.name}</option>
//                             ))}
//                         </select>
//                     </div>
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Quantity</label>
//                         <input
//                             type="number"
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
//                             value={pickQty}
//                             onChange={(e) => setPickQty(e.target.value)}
//                         />
//                     </div>
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Rate (per unit)</label>
//                         <input
//                             type="number"
//                             step="0.01"
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
//                             value={pickRate}
//                             onChange={(e) => setPickRate(e.target.value)}
//                         />
//                     </div>
//                 </div>
//                 <button
//                     type="button"
//                     className="rounded-lg border border-secondary-300 bg-secondary-50 px-4 py-2 text-sm font-medium text-secondary-700 transition hover:bg-secondary-100"
//                     onClick={addLine}
//                 >
//                     + Add product
//                 </button>

//                 {lines.length > 0 && (
//                     <table className="w-full text-left text-sm">
//                         <thead className="border-b border-neutral-200 text-[8px] uppercase tracking-wide text-neutral-500">
//                             <tr>
//                                 <th className="py-2">product</th>
//                                 <th className="py-2">Generic Name</th>
//                                 <th className="py-2">Manufacturer</th>
//                                 <th className="py-2">Qty</th>
//                                 <th className="py-2">Rate (per unit)</th>
//                                 <th className="py-2">Total</th>
//                                 <th className="py-2"></th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y text-[8px] divide-neutral-100">
//                             {lines.map((l) => (
//                                 <tr key={l.productId} className="hover:bg-neutral-50">
//                                     <td className="py-2 font-medium text-neutral-800">{l.productName}</td>
//                                     <td className="py-2 font-medium text-neutral-800">{l.genericName}</td>
//                                     <td className="py-2 font-medium text-neutral-800">{l.manufacturer}</td>
//                                     <td className="py-2 text-neutral-600">{l.quantity}</td>
//                                     <td className="py-2 text-neutral-600">₹{l.expectedRate.toFixed(2)}</td>
//                                     <td className="py-2 font-medium text-neutral-800">₹{(l.quantity * l.expectedRate).toFixed(2)}</td>
//                                     <td className="py-2">
//                                         <button
//                                             className="text-xs font-medium text-danger-600 hover:text-danger-700 hover:underline"
//                                             onClick={() => removeLine(l.productId)}
//                                         >
//                                             Remove
//                                         </button>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 )}
//                 {lines.length > 0 && (
//                     <div className="flex justify-end">
//                         <p className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-700">
//                             Estimated Total: ₹{totalExpected.toFixed(2)}
//                         </p>
//                     </div>
//                 )}
//             </div>

//             <div className="flex justify-end gap-2">
//                 <Link
//                     href="/purchase-orders"
//                     className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
//                 >
//                     Cancel
//                 </Link>
//                 <button
//                     className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
//                     onClick={handleSubmit}
//                     disabled={saving}
//                 >
//                     {saving ? 'Saving…' : 'Create Purchase Order'}
//                 </button>
//             </div>
//         </div>
//     );
// }
// 'use client';

// import { useEffect, useState, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { apiFetch, ApiClientError } from '@/lib/api-client';
// import type { product } from '@/types';
// import PurchaseOrderPrint from '@/components/print/PurchaseOrderPrint';
// import { printElement } from '@/lib/print-pdf';
// import PurchaseOrderPrintButton from '@/components/purchase-orders/PurchaseOrderPrintButton';

// type Supplier = { id: number; name: string };

// type GstType = 'INCLUSIVE' | 'EXCLUSIVE';

// type Line = {
//     productId: number;
//     productName: string;
//     quantity: number;
//     expectedRate: number;
//     genericName?: string;
//     manufacturer?: string;
//     gstPercentage: number;
//     gstType: GstType;
// };

// export default function NewPurchaseOrderPage() {
//     const router = useRouter();
//     const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//     const [products, setproducts] = useState<product[]>([]);

//     const [supplierId, setSupplierId] = useState<number | ''>('');
//     const [expectedDate, setExpectedDate] = useState('');
//     const [notes, setNotes] = useState('');

//     // ---- product search/combobox state (replaces the old <select>) ----
//     const [productSearch, setProductSearch] = useState('');
//     const [showDropdown, setShowDropdown] = useState(false);
//     const [selectedProduct, setSelectedProduct] = useState<product | null>(null);
//     const searchWrapRef = useRef<HTMLDivElement>(null);

//     const [pickQty, setPickQty] = useState('');
//     const [pickRate, setPickRate] = useState('');
//     const [lines, setLines] = useState<Line[]>([]);

//     const [error, setError] = useState<string | null>(null);
//     const [saving, setSaving] = useState(false);
//     const [createdPO, setCreatedPO] = useState<{ id: number } | null>(null);
//     const [sending, setSending] = useState(false);

//     async function sendEmail() {
//         setSending(true);

//         try {
//             await apiFetch(`/api/purchase-orders/${createdPO?.id}/email`, {
//                 method: "POST",
//             });

//             alert("Purchase Order emailed successfully.");
//         } catch (e) {
//             alert("Failed to send email.");
//         } finally {
//             setSending(false);
//         }
//     }

//     useEffect(() => {
//         apiFetch<Supplier[]>('/api/suppliers').then(setSuppliers);
//         apiFetch<product[]>('/api/products').then(setproducts);
//     }, []);

//     // close the dropdown on outside click
//     useEffect(() => {
//         function onClickOutside(e: MouseEvent) {
//             if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
//                 setShowDropdown(false);
//             }
//         }
//         document.addEventListener('mousedown', onClickOutside);
//         return () => document.removeEventListener('mousedown', onClickOutside);
//     }, []);

//     const filteredProducts = productSearch.trim()
//         ? products
//             .filter((m) => {
//                 const q = productSearch.toLowerCase();
//                 return (
//                     m.name.toLowerCase().includes(q) ||
//                     m.genericName?.toLowerCase().includes(q) ||
//                     m.manufacturer?.toLowerCase().includes(q) ||
//                     m.barcode?.toLowerCase().includes(q)
//                 );
//             })
//             .slice(0, 8)
//         : [];

//     function pickProduct(m: product) {
//         setSelectedProduct(m);
//         setProductSearch(m.name);
//         setPickRate(m.cp != null ? String(m.cp) : '');
//         setShowDropdown(false);
//     }

//     function clearPicker() {
//         setSelectedProduct(null);
//         setProductSearch('');
//         setPickRate('');
//         setPickQty('');
//     }

//     function addLine() {
//         setError(null);
//         if (!selectedProduct) return setError('Search and select a product');
//         if (!pickQty || Number(pickQty) <= 0) return setError('Enter a valid quantity');
//         if (!pickRate || Number(pickRate) <= 0) return setError('Enter a valid expected rate');
//         if (lines.some((l) => l.productId === selectedProduct.id)) return setError('product already added');

//         setLines([
//             ...lines,
//             {
//                 productId: selectedProduct.id,
//                 productName: selectedProduct.name,
//                 genericName: selectedProduct.genericName,
//                 manufacturer: selectedProduct.manufacturer,
//                 quantity: Number(pickQty),
//                 expectedRate: Number(pickRate),
//                 gstPercentage: selectedProduct.gstPercentage ?? 0,
//                 gstType: ((selectedProduct as unknown as { gstType?: GstType }).gstType ?? 'INCLUSIVE'),
//             },
//         ]);
//         clearPicker();
//     }

//     function removeLine(productId: number) {
//         setLines(lines.filter((l) => l.productId !== productId));
//     }

//     // ---- GST-aware line/total calculations ----
//     // INCLUSIVE: rate already has GST baked in -> line total = qty * rate, GST amount is extracted from that.
//     // EXCLUSIVE: GST is added on top -> line total = qty * rate * (1 + gst/100).
//     function lineBase(l: Line) {
//         return l.quantity * l.expectedRate;
//     }
//     function lineGstAmount(l: Line) {
//         const base = lineBase(l);
//         if (l.gstType === 'EXCLUSIVE') {
//             return base * (l.gstPercentage / 100);
//         }
//         // inclusive: back out the GST portion already inside the rate
//         return base - base / (1 + l.gstPercentage / 100);
//     }
//     function lineTotal(l: Line) {
//         const base = lineBase(l);
//         return l.gstType === 'EXCLUSIVE' ? base + lineGstAmount(l) : base;
//     }

//     async function handleSubmit() {
//         setError(null);
//         if (!supplierId) return setError('Select a supplier');
//         if (!lines.length) return setError('Add at least one product');

//         setSaving(true);
//         try {
//             const po = await apiFetch<{ id: number }>('/api/purchase-orders', {
//                 method: 'POST',
//                 body: JSON.stringify({
//                     supplierId,
//                     expectedDate: expectedDate || null,
//                     notes: notes || null,
//                     items: lines.map((l) => ({
//                         productId: l.productId,
//                         quantity: l.quantity,
//                         expectedRate: l.expectedRate,
//                         gstPercentage: l.gstPercentage,
//                         gstType: l.gstType,
//                     })),
//                 }),
//             });
//             setCreatedPO(po);
//         } catch (err) {
//             setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
//         } finally {
//             setSaving(false);
//         }
//     }

//     const totalGst = lines.reduce((sum, l) => sum + lineGstAmount(l), 0);
//     const totalAmount = lines.reduce((sum, l) => sum + lineTotal(l), 0);
//     const supplierName = suppliers.find((s) => s.id === supplierId)?.name || '';

//     if (createdPO) {
//         return (
//             <div className="mx-auto max-w-lg space-y-5 rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
//                 <h2 className="text-lg font-semibold text-neutral-900">Purchase Order Created</h2>
//                 <p className="text-sm text-neutral-500">PO #{createdPO.id} has been created successfully.</p>

//                 <div className="flex justify-center gap-2">
//                     <PurchaseOrderPrintButton poId={createdPO.id} />
//                     <button
//                         onClick={sendEmail}
//                         className="rounded-lg bg-blue-600 px-4 py-2 text-white"
//                     >
//                         📧 Email Supplier
//                     </button>

//                     <button
//                         className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
//                         onClick={() => router.push('/purchase-orders/registered')}
//                     >
//                         PO list
//                     </button>
//                 </div>

//                 {/* off-screen render target for html2canvas (must be visible in DOM, not display:none) */}
//                 <div style={{ position: 'fixed', top: 0, left: '-9999px' }}>
//                     <PurchaseOrderPrint
//                         poId={createdPO.id}
//                         supplierName={supplierName}
//                         createdDate={new Date().toLocaleDateString()}
//                         expectedDate={expectedDate}
//                         notes={notes}
//                         items={lines.map((l) => ({
//                             productName: l.productName,
//                             genericName: l.genericName,
//                             manufacturer: l.manufacturer,
//                             quantity: l.quantity,
//                             expectedRate: l.expectedRate,
//                         }))}
//                         total={totalAmount}
//                     />
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="mx-auto max-w-3xl space-y-6">
//             <div>
//                 <Link
//                     href="/purchase-orders"
//                     className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
//                 >
//                     ← Back to purchase orders
//                 </Link>
//                 <h1 className="mt-1 text-2xl font-semibold text-neutral-900">New Purchase Order</h1>
//                 <p className="text-sm text-neutral-500">This is a request to your supplier — no stock is added yet.</p>
//             </div>

//             {error && (
//                 <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
//                     <span className="text-sm font-medium text-danger-700">{error}</span>
//                 </div>
//             )}

//             <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
//                 <div className="grid grid-cols-2 gap-3">
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Supplier</label>
//                         <select
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
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
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Purchase Order ID</label>
//                         <input
//                             className="w-full cursor-not-allowed rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-500"
//                             value="Auto Generated"
//                             disabled
//                         />
//                         <p className="mt-1 text-xs text-neutral-400">
//                             Purchase Order ID will be generated automatically when the order is created.
//                         </p>
//                     </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-3">
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Expected Date (optional)</label>
//                         <input
//                             type="date"
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
//                             value={expectedDate}
//                             onChange={(e) => setExpectedDate(e.target.value)}
//                         />
//                     </div>
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Notes (optional)</label>
//                         <input
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
//                             value={notes}
//                             onChange={(e) => setNotes(e.target.value)}
//                         />
//                     </div>
//                 </div>
//             </div>

//             <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
//                 <h2 className="font-medium text-neutral-800">Requested products</h2>
//                 <div className="grid grid-cols-3 gap-3">
//                     {/* ---- searchable product picker ---- */}
//                     <div className="relative" ref={searchWrapRef}>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">product</label>
//                         <input
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
//                             placeholder="Search by name, generic, manufacturer…"
//                             value={productSearch}
//                             onFocus={() => setShowDropdown(true)}
//                             onChange={(e) => {
//                                 setProductSearch(e.target.value);
//                                 setSelectedProduct(null);
//                                 setPickRate('');
//                                 setShowDropdown(true);
//                             }}
//                         />
//                         {selectedProduct && (
//                             <p className="mt-1 text-[11px] text-neutral-400">
//                                 GST {selectedProduct.gstPercentage}% ·{' '}
//                                 {((selectedProduct as unknown as { gstType?: GstType }).gstType ?? 'INCLUSIVE') === 'EXCLUSIVE'
//                                     ? 'added on top'
//                                     : 'included in rate'}
//                             </p>
//                         )}

//                         {showDropdown && productSearch.trim() && (
//                             <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
//                                 {filteredProducts.length === 0 && (
//                                     <p className="px-3 py-2 text-sm text-neutral-400">No products found</p>
//                                 )}
//                                 {filteredProducts.map((m) => (
//                                     <button
//                                         type="button"
//                                         key={m.id}
//                                         onClick={() => pickProduct(m)}
//                                         disabled={lines.some((l) => l.productId === m.id)}
//                                         className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
//                                     >
//                                         <span className="font-medium text-neutral-800">{m.name}</span>
//                                         <span className="text-xs text-neutral-400">
//                                             {m.manufacturer} · GST {m.gstPercentage}%
//                                             {lines.some((l) => l.productId === m.id) ? ' · already added' : ''}
//                                         </span>
//                                     </button>
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Quantity</label>
//                         <input
//                             type="number"
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
//                             value={pickQty}
//                             onChange={(e) => setPickQty(e.target.value)}
//                         />
//                     </div>
//                     <div>
//                         <label className="mb-1 block text-xs font-medium text-neutral-600">Rate (per unit)</label>
//                         <input
//                             type="number"
//                             step="0.01"
//                             className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
//                             value={pickRate}
//                             onChange={(e) => setPickRate(e.target.value)}
//                         />
//                     </div>
//                 </div>
//                 <button
//                     type="button"
//                     className="rounded-lg border border-secondary-300 bg-secondary-50 px-4 py-2 text-sm font-medium text-secondary-700 transition hover:bg-secondary-100"
//                     onClick={addLine}
//                 >
//                     + Add product
//                 </button>

//                 {lines.length > 0 && (
//                     <table className="w-full text-left text-sm">
//                         <thead className="border-b border-neutral-200 text-[8px] uppercase tracking-wide text-neutral-500">
//                             <tr>
//                                 <th className="py-2">product</th>
//                                 <th className="py-2">Generic Name</th>
//                                 <th className="py-2">Manufacturer</th>
//                                 <th className="py-2">Qty</th>
//                                 <th className="py-2">Rate (per unit)</th>
//                                 <th className="py-2">GST %</th>
//                                 <th className="py-2">GST Amt</th>
//                                 <th className="py-2">Total</th>
//                                 <th className="py-2"></th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y text-[8px] divide-neutral-100">
//                             {lines.map((l) => (
//                                 <tr key={l.productId} className="hover:bg-neutral-50">
//                                     <td className="py-2 font-medium text-neutral-800">{l.productName}</td>
//                                     <td className="py-2 font-medium text-neutral-800">{l.genericName}</td>
//                                     <td className="py-2 font-medium text-neutral-800">{l.manufacturer}</td>
//                                     <td className="py-2 text-neutral-600">{l.quantity}</td>
//                                     <td className="py-2 text-neutral-600">₹{l.expectedRate.toFixed(2)}</td>
//                                     <td className="py-2 text-neutral-600">
//                                         {l.gstPercentage}% ({l.gstType === 'EXCLUSIVE' ? '+' : 'incl.'})
//                                     </td>
//                                     <td className="py-2 text-neutral-600">₹{lineGstAmount(l).toFixed(2)}</td>
//                                     <td className="py-2 font-medium text-neutral-800">₹{lineTotal(l).toFixed(2)}</td>
//                                     <td className="py-2">
//                                         <button
//                                             className="text-xs font-medium text-danger-600 hover:text-danger-700 hover:underline"
//                                             onClick={() => removeLine(l.productId)}
//                                         >
//                                             Remove
//                                         </button>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 )}
//                 {lines.length > 0 && (
//                     <div className="flex flex-col items-end gap-1">
//                         <p className="text-xs text-neutral-500">GST Total: ₹{totalGst.toFixed(2)}</p>
//                         <p className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-700">
//                             Total: ₹{totalAmount.toFixed(2)}
//                         </p>
//                     </div>
//                 )}
//             </div>

//             <div className="flex justify-end gap-2">
//                 <Link
//                     href="/purchase-orders"
//                     className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
//                 >
//                     Cancel
//                 </Link>
//                 <button
//                     className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
//                     onClick={handleSubmit}
//                     disabled={saving}
//                 >
//                     {saving ? 'Saving…' : 'Create Purchase Order'}
//                 </button>
//             </div>
//         </div>
//     );
// }
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { product } from '@/types';
import PurchaseOrderPrint from '@/components/print/PurchaseOrderPrint';
import { printElement } from '@/lib/print-pdf';
import PurchaseOrderPrintButton from '@/components/purchase-orders/PurchaseOrderPrintButton';

type Supplier = { id: number; name: string };

type GstType = 'INCLUSIVE' | 'EXCLUSIVE';

type Line = {
    productId: number;
    productName: string;
    quantity: number;
    expectedRate: number;
    genericName?: string;
    manufacturer?: string;
    gstPercentage: number;
    gstType: GstType;
};

export default function NewPurchaseOrderPage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setproducts] = useState<product[]>([]);

    const [supplierId, setSupplierId] = useState<number | ''>('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');

    // ---- product search/combobox state (replaces the old <select>) ----
    const [productSearch, setProductSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<product | null>(null);
    const searchWrapRef = useRef<HTMLDivElement>(null);

    const [pickQty, setPickQty] = useState('');
    const [pickRate, setPickRate] = useState('');
    const [lines, setLines] = useState<Line[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [createdPO, setCreatedPO] = useState<{ id: number } | null>(null);
    const [sending, setSending] = useState(false);

    async function sendEmail() {
        setSending(true);

        try {
            await apiFetch(`/api/purchase-orders/${createdPO?.id}/email`, {
                method: "POST",
            });

            alert("Purchase Order emailed successfully.");
        } catch (e) {
            alert("Failed to send email.");
        } finally {
            setSending(false);
        }
    }

    useEffect(() => {
        apiFetch<Supplier[]>('/api/suppliers').then(setSuppliers);
        apiFetch<product[]>('/api/products').then(setproducts);
    }, []);

    // close the dropdown on outside click
    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const filteredProducts = productSearch.trim()
        ? products
            .filter((m) => {
                const q = productSearch.toLowerCase();
                return (
                    m.name.toLowerCase().includes(q) ||
                    m.genericName?.toLowerCase().includes(q) ||
                    m.manufacturer?.toLowerCase().includes(q) ||
                    m.barcode?.toLowerCase().includes(q)
                );
            })
            .slice(0, 8)
        : [];

    function pickProduct(m: product) {
        setSelectedProduct(m);
        setProductSearch(m.name);
        setPickRate(m.cp != null ? String(m.cp) : '');
        setShowDropdown(false);
    }

    function clearPicker() {
        setSelectedProduct(null);
        setProductSearch('');
        setPickRate('');
        setPickQty('');
    }

    function addLine() {
        setError(null);
        if (!selectedProduct) return setError('Search and select a product');
        if (!pickQty || Number(pickQty) <= 0) return setError('Enter a valid quantity');
        if (!pickRate || Number(pickRate) <= 0) return setError('Enter a valid expected rate');
        if (lines.some((l) => l.productId === selectedProduct.id)) return setError('product already added');

        setLines([
            ...lines,
            {
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                genericName: selectedProduct.genericName,
                manufacturer: selectedProduct.manufacturer,
                quantity: Number(pickQty),
                expectedRate: Number(pickRate),
                gstPercentage: Number(selectedProduct.gstPercentage) ?? 0,
                gstType: ((selectedProduct as unknown as { gstType?: GstType }).gstType ?? 'INCLUSIVE'),
            },
        ]);
        clearPicker();
    }

    function removeLine(productId: number) {
        setLines(lines.filter((l) => l.productId !== productId));
    }

    // ---- GST-aware line/total calculations ----
    // INCLUSIVE: rate already has GST baked in -> line total = qty * rate, GST amount is extracted from that.
    // EXCLUSIVE: GST is added on top -> line total = qty * rate * (1 + gst/100).
    function lineBase(l: Line) {
        return l.quantity * l.expectedRate;
    }
    function lineGstAmount(l: Line) {
        const base = lineBase(l);
        if (l.gstType === 'EXCLUSIVE') {
            return base * (l.gstPercentage / 100);
        }
        // inclusive: back out the GST portion already inside the rate
        return base - base / (1 + l.gstPercentage / 100);
    }
    function lineTotal(l: Line) {
        const base = lineBase(l);
        return l.gstType === 'EXCLUSIVE' ? base + lineGstAmount(l) : base;
    }

    async function handleSubmit() {
        setError(null);
        if (!supplierId) return setError('Select a supplier');
        if (!lines.length) return setError('Add at least one product');

        setSaving(true);
        try {
            const po = await apiFetch<{ id: number }>('/api/purchase-orders', {
                method: 'POST',
                body: JSON.stringify({
                    supplierId,
                    expectedDate: expectedDate || null,
                    notes: notes || null,
                    items: lines.map((l) => ({
                        productId: l.productId,
                        quantity: l.quantity,
                        expectedRate: l.expectedRate,
                        gstPercentage: l.gstPercentage,
                        gstType: l.gstType,
                    })),
                }),
            });
            setCreatedPO(po);
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    const totalGst = lines.reduce((sum, l) => sum + lineGstAmount(l), 0);
    const totalAmount = lines.reduce((sum, l) => sum + lineTotal(l), 0);
    const supplierName = suppliers.find((s) => s.id === supplierId)?.name || '';

    if (createdPO) {
        return (
            <div className="mx-auto max-w-lg space-y-5 rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900">Purchase Order Created</h2>
                <p className="text-sm text-neutral-500">PO #{createdPO.id} has been created successfully.</p>

                <div className="flex justify-center gap-2">
                    <PurchaseOrderPrintButton poId={createdPO.id} />
                    <button
                        onClick={sendEmail}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                    >
                        📧 Email Supplier
                    </button>

                    <button
                        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                        onClick={() => router.push('/purchase-orders/registered')}
                    >
                        PO list
                    </button>
                </div>

                {/* off-screen render target for html2canvas (must be visible in DOM, not display:none) */}
                <div style={{ position: 'fixed', top: 0, left: '-9999px' }}>
                    <PurchaseOrderPrint
                        poId={createdPO.id}
                        supplierName={supplierName}
                        createdDate={new Date().toLocaleDateString()}
                        expectedDate={expectedDate}
                        notes={notes}
                        items={lines.map((l) => ({
                            productName: l.productName,
                            genericName: l.genericName,
                            manufacturer: l.manufacturer,
                            quantity: l.quantity,
                            expectedRate: l.expectedRate,
                            gstPercentage: l.gstPercentage,
                            gstType: l.gstType,
                        }))}
                        total={totalAmount}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link
                    href="/purchase-orders"
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                    ← Back to purchase orders
                </Link>
                <h1 className="mt-1 text-2xl font-semibold text-neutral-900">New Purchase Order</h1>
                <p className="text-sm text-neutral-500">This is a request to your supplier — no stock is added yet.</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
                    <span className="text-sm font-medium text-danger-700">{error}</span>
                </div>
            )}

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">Supplier</label>
                        <select
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            value={supplierId}
                            onChange={(e) => setSupplierId(Number(e.target.value))}
                        >
                            <option value="">Select supplier…</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">Purchase Order ID</label>
                        <input
                            className="w-full cursor-not-allowed rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-500"
                            value="Auto Generated"
                            disabled
                        />
                        <p className="mt-1 text-xs text-neutral-400">
                            Purchase Order ID will be generated automatically when the order is created.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">Expected Date (optional)</label>
                        <input
                            type="date"
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            value={expectedDate}
                            onChange={(e) => setExpectedDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">Notes (optional)</label>
                        <input
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
                <h2 className="font-medium text-neutral-800">Requested products</h2>
                <div className="grid grid-cols-3 gap-3">
                    {/* ---- searchable product picker ---- */}
                    <div className="relative" ref={searchWrapRef}>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">product</label>
                        <input
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            placeholder="Search by name, generic, manufacturer…"
                            value={productSearch}
                            onFocus={() => setShowDropdown(true)}
                            onChange={(e) => {
                                setProductSearch(e.target.value);
                                setSelectedProduct(null);
                                setPickRate('');
                                setShowDropdown(true);
                            }}
                        />
                        {selectedProduct && (
                            <p className="mt-1 text-[11px] text-neutral-400">
                                GST {selectedProduct.gstPercentage}% ·{' '}
                                {((selectedProduct as unknown as { gstType?: GstType }).gstType ?? 'INCLUSIVE') === 'EXCLUSIVE'
                                    ? 'added on top'
                                    : 'included in rate'}
                            </p>
                        )}

                        {showDropdown && productSearch.trim() && (
                            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                                {filteredProducts.length === 0 && (
                                    <p className="px-3 py-2 text-sm text-neutral-400">No products found</p>
                                )}
                                {filteredProducts.map((m) => (
                                    <button
                                        type="button"
                                        key={m.id}
                                        onClick={() => pickProduct(m)}
                                        disabled={lines.some((l) => l.productId === m.id)}
                                        className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className="font-medium text-neutral-800">{m.name}</span>
                                        <span className="text-xs text-neutral-400">
                                            {m.manufacturer} · GST {m.gstPercentage}%
                                            {lines.some((l) => l.productId === m.id) ? ' · already added' : ''}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">Quantity</label>
                        <input
                            type="number"
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            value={pickQty}
                            onChange={(e) => setPickQty(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">Rate (per unit)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            value={pickRate}
                            onChange={(e) => setPickRate(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    type="button"
                    className="rounded-lg border border-secondary-300 bg-secondary-50 px-4 py-2 text-sm font-medium text-secondary-700 transition hover:bg-secondary-100"
                    onClick={addLine}
                >
                    + Add product
                </button>

                {lines.length > 0 && (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-neutral-200 text-[8px] uppercase tracking-wide text-neutral-500">
                            <tr>
                                <th className="py-2">product</th>
                                <th className="py-2">Generic Name</th>
                                <th className="py-2">Manufacturer</th>
                                <th className="py-2">Qty</th>
                                <th className="py-2">Rate (per unit)</th>
                                <th className="py-2">GST %</th>
                                <th className="py-2">GST Amt</th>
                                <th className="py-2">Total</th>
                                <th className="py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-[8px] divide-neutral-100">
                            {lines.map((l) => (
                                <tr key={l.productId} className="hover:bg-neutral-50">
                                    <td className="py-2 font-medium text-neutral-800">{l.productName}</td>
                                    <td className="py-2 font-medium text-neutral-800">{l.genericName}</td>
                                    <td className="py-2 font-medium text-neutral-800">{l.manufacturer}</td>
                                    <td className="py-2 text-neutral-600">{l.quantity}</td>
                                    <td className="py-2 text-neutral-600">₹{l.expectedRate.toFixed(2)}</td>
                                    <td className="py-2 text-neutral-600">
                                        {l.gstPercentage}% ({l.gstType === 'EXCLUSIVE' ? '+' : 'incl.'})
                                    </td>
                                    <td className="py-2 text-neutral-600">₹{lineGstAmount(l).toFixed(2)}</td>
                                    <td className="py-2 font-medium text-neutral-800">₹{lineTotal(l).toFixed(2)}</td>
                                    <td className="py-2">
                                        <button
                                            className="text-xs font-medium text-danger-600 hover:text-danger-700 hover:underline"
                                            onClick={() => removeLine(l.productId)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {lines.length > 0 && (
                    <div className="flex flex-col items-end gap-1">
                        <p className="text-xs text-neutral-500">GST Total: ₹{totalGst.toFixed(2)}</p>
                        <p className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-700">
                            Total: ₹{totalAmount.toFixed(2)}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2">
                <Link
                    href="/purchase-orders"
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                    Cancel
                </Link>
                <button
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? 'Saving…' : 'Create Purchase Order'}
                </button>
            </div>
        </div>
    );
}