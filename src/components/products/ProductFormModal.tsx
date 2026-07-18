// 'use client';

// import { useEffect, useState, type FormEvent } from 'react';
// import { apiFetch, ApiClientError } from '@/lib/api-client';
// import type { product } from '@/types';

// type GstType = 'INCLUSIVE' | 'EXCLUSIVE';

// type ProductFormState = {
//     name: string;
//     manufacturer: string;
//     category: string;
//     barcode: string;
//     hsnCode: string;
//     mrp: string;
//     cp: string;
//     sp: string;
//     gstPercentage: string;
//     prescriptionRequired: boolean;
//     gstType: GstType;
//     genericName: string;
// };

// const EMPTY_FORM: ProductFormState = {
//     name: '',
//     manufacturer: '',
//     category: 'Medicines',
//     barcode: '',
//     hsnCode: '',
//     gstPercentage: '',
//     mrp: "",
//     cp: "",
//     sp: "",
//     genericName: '',
//     prescriptionRequired: false,
//     // MRP in Indian pharmacies is almost always GST-inclusive by default,
//     // so that's the sensible default for a new product.
//     gstType: 'INCLUSIVE',
// };

// function toFormState(m: product): ProductFormState {
//     return {
//         name: m.name,
//         manufacturer: m.manufacturer,
//         category: m.category ?? "Medicines",
//         barcode: m.barcode ?? '',
//         hsnCode: m.hsnCode,
//         mrp: String(m.mrp),
//         cp: String(m.cp),
//         sp: String(m.sp),
//         genericName: m.genericName ?? '',
//         gstPercentage: String(m.gstPercentage),
//         prescriptionRequired: m.prescriptionRequired,
//         // Falls back to INCLUSIVE for products saved before this field existed.
//         gstType: (m as unknown as { gstType?: GstType }).gstType ?? 'INCLUSIVE',
//     };
// }

// type ProductFormModalProps = {
//     open: boolean;
//     onClose: () => void;
//     /** Pass an existing product to edit it; omit/null to create a new one. */
//     product?: product | null;
//     /** Called after a successful create/update, with the saved product id. */
//     onSuccess?: (productId: number) => void;
// };

// // ---------- shared field styles ----------

// const labelCls = 'mb-1 block text-xs font-medium text-neutral-500';
// const inputCls =
//     'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-50 disabled:text-neutral-400';

// const CloseIcon = () => (
//     <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.75">
//         <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
//     </svg>
// );

// export function ProductFormModal({ open, onClose, product, onSuccess }: ProductFormModalProps) {
//     const editingId = product?.id ?? null;

//     const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
//     const [error, setError] = useState<string | null>(null);
//     const [saving, setSaving] = useState(false);

//     const options = [
//         "Medicines",
//         "Medical Supplies & Devices",
//         "Health & Nutrition",
//         "Personal & Baby Care",
//         "Homeopathy & Ayurveda",
//         "Other"
//     ]

//     // Reset form contents whenever the modal opens or the target product changes.
//     useEffect(() => {
//         if (!open) return;
//         setForm(product ? toFormState(product) : EMPTY_FORM);
//         setError(null);
//     }, [open, product]);

//     if (!open) return null;

//     async function handleSubmit(e: FormEvent) {
//         e.preventDefault();
//         setSaving(true);
//         setError(null);
//         try {
//             // const payload = {
//             //     name: form.name,
//             //     manufacturer: form.manufacturer,
//             //     category: form.category || undefined,
//             //     barcode: form.barcode || undefined,
//             //     hsnCode: form.hsnCode,
//             //     gstPercentage: Number(form.gstPercentage),
//             //     prescriptionRequired: form.prescriptionRequired,
//             //     gstType: form.gstType,
//             // };
//             const payload = {
//                 name: form.name,
//                 manufacturer: form.manufacturer,
//                 category: form.category || undefined,
//                 barcode: form.barcode || undefined,
//                 hsnCode: form.hsnCode,
//                 gstPercentage: Number(form.gstPercentage),
//                 genericName: form.genericName,
//                 mrp: Number(form.mrp),
//                 cp: Number(form.cp),
//                 sp: Number(form.sp),
//                 prescriptionRequired: form.prescriptionRequired,
//                 gstType: form.gstType,
//             };
//             console.log('Submitting product form payload:', payload);

//             let savedId = editingId;
//             if (editingId) {
//                 await apiFetch(`/api/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
//             } else {
//                 const created = await apiFetch<product>('/api/products', {
//                     method: 'POST',
//                     body: JSON.stringify(payload),
//                 });
//                 savedId = created.id;
//             }

//             onSuccess?.(savedId as number);
//             onClose();
//         } catch (err) {
//             setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
//         } finally {
//             setSaving(false);
//         }
//     }

//     return (
//         <div className="fixed inset-0 z-10 flex items-center justify-center bg-neutral-900/40 p-4">
//             <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg">
//                 <div className="mb-5 flex items-start justify-between">
//                     <div>
//                         <h2 className="text-lg font-semibold text-neutral-900">
//                             {editingId ? 'Edit product' : 'Add product'}
//                         </h2>
//                         <p className="mt-0.5 text-xs text-neutral-400">
//                             {editingId ? 'Update catalog and GST details.' : 'Add a new item to the catalog.'}
//                         </p>
//                     </div>
//                     <button
//                         type="button"
//                         onClick={onClose}
//                         className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
//                         aria-label="Close"
//                     >
//                         <CloseIcon />
//                     </button>
//                 </div>

//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     <div className="grid grid-cols-2 gap-3">
//                         <div className="col-span-2">
//                             <label className={labelCls}>Name</label>
//                             <input
//                                 className={inputCls}
//                                 required
//                                 value={form.name}
//                                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//                             />
//                         </div>
//                         <div>
//                             <label className={labelCls}>Generic Name</label>
//                             <input
//                                 className={inputCls}
//                                 value={form.genericName}
//                                 onChange={(e) => setForm({ ...form, genericName: e.target.value })}
//                             />
//                         </div>
//                         <div>
//                             <label className={labelCls}>Manufacturer</label>
//                             <input
//                                 className={inputCls}
//                                 required
//                                 value={form.manufacturer}
//                                 onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
//                             />
//                         </div>
//                         <div>
//                             <label className={labelCls}>Category</label>
//                             <select value={form.category} className={inputCls} onChange={(e) => setForm({ ...form, category: e.target.value })} name="" id="">
//                                 {
//                                     options.map((option) => (
//                                         <option key={option} value={option}>{option}</option>
//                                     ))
//                                 }
//                             </select>
//                         </div>
//                         <div>
//                             <label className={labelCls}>Barcode</label>
//                             <input
//                                 className={inputCls}
//                                 value={form.barcode}
//                                 onChange={(e) => setForm({ ...form, barcode: e.target.value })}
//                             />
//                         </div>
//                         <div>
//                             <label className={labelCls}>HSN code</label>
//                             <input
//                                 className={`${inputCls} font-mono`}
//                                 required
//                                 value={form.hsnCode}
//                                 onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
//                             />
//                         </div>
//                         <div className="col-span-2 sm:col-span-1">
//                             <label className={labelCls}>GST %</label>
//                             <input
//                                 className={inputCls}
//                                 required
//                                 type="number"
//                                 step="0.01"
//                                 min={0}
//                                 max={28}
//                                 value={form.gstPercentage}
//                                 onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })}
//                             />
//                         </div>
//                         <div className="col-span-2 sm:col-span-1">
//                             <label className={labelCls}>Mrp</label>
//                             <input
//                                 className={inputCls}
//                                 required
//                                 type="number"
//                                 value={form.mrp}
//                                 onChange={(e) => setForm({ ...form, mrp: e.target.value })}
//                             />
//                         </div>
//                         <div className="col-span-2 sm:col-span-1">
//                             <label className={labelCls}>Cost Price</label>
//                             <input
//                                 className={inputCls}
//                                 required
//                                 type="number"
//                                 value={form.cp}
//                                 onChange={(e) => setForm({ ...form, cp: e.target.value })}
//                             />
//                         </div>
//                         <div className="col-span-2 sm:col-span-1">
//                             <label className={labelCls}>Selling Price</label>
//                             <input
//                                 className={inputCls}
//                                 required
//                                 type="number"
//                                 value={form.sp}
//                                 onChange={(e) => setForm({ ...form, sp: e.target.value })}
//                             />
//                         </div>

//                         {/* GST type — inclusive (MRP already has GST, common for most retail
//                 products) vs exclusive (GST added on top, common for B2B/hospital supply) */}
//                         <div className="col-span-2">
//                             <label className={labelCls}>GST type</label>
//                             <div className="inline-flex w-full rounded-lg border border-neutral-200 bg-neutral-50 p-1">
//                                 <button
//                                     type="button"
//                                     onClick={() => setForm({ ...form, gstType: 'INCLUSIVE' })}
//                                     className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${form.gstType === 'INCLUSIVE'
//                                         ? 'bg-white text-primary-700 shadow-sm'
//                                         : 'text-neutral-500 hover:text-neutral-700'
//                                         }`}
//                                 >
//                                     Inclusive (MRP)
//                                 </button>
//                                 <button
//                                     type="button"
//                                     onClick={() => setForm({ ...form, gstType: 'EXCLUSIVE' })}
//                                     className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${form.gstType === 'EXCLUSIVE'
//                                         ? 'bg-white text-primary-700 shadow-sm'
//                                         : 'text-neutral-500 hover:text-neutral-700'
//                                         }`}
//                                 >
//                                     Exclusive (+GST)
//                                 </button>
//                             </div>
//                             <p className="mt-1.5 text-xs text-neutral-400">
//                                 {form.gstType === 'INCLUSIVE'
//                                     ? 'Selling price already includes GST — usual for MRP-based retail sales.'
//                                     : 'GST will be added on top of the selling price — usual for B2B / hospital billing.'}
//                             </p>
//                         </div>

//                         <label className="col-span-2 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
//                             <input
//                                 type="checkbox"
//                                 className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-400"
//                                 checked={form.prescriptionRequired}
//                                 onChange={(e) => setForm({ ...form, prescriptionRequired: e.target.checked })}
//                             />
//                             Prescription required
//                         </label>
//                     </div>

//                     {error && (
//                         <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>
//                     )}

//                     <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
//                         <button
//                             type="button"
//                             className="rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
//                             onClick={onClose}
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             type="submit"
//                             className="rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
//                             disabled={saving}
//                         >
//                             {saving ? 'Saving…' : 'Save'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { product } from '@/types';

type GstType = 'INCLUSIVE' | 'EXCLUSIVE';

type ProductFormState = {
    name: string;
    manufacturer: string;
    category: string;
    barcode: string;
    hsnCode: string;
    mrp: string;
    cp: string;
    sp: string;
    gstPercentage: string;
    prescriptionRequired: boolean;
    gstType: GstType;
    genericName: string;
};

const EMPTY_FORM: ProductFormState = {
    name: '',
    manufacturer: '',
    category: 'Medicines',
    barcode: '',
    hsnCode: '',
    gstPercentage: '',
    mrp: "",
    cp: "",
    sp: "",
    genericName: '',
    prescriptionRequired: false,
    // MRP in Indian pharmacies is almost always GST-inclusive by default,
    // so that's the sensible default for a new product.
    gstType: 'INCLUSIVE',
};

function toFormState(m: any): ProductFormState {
    return {
        name: m.name,
        manufacturer: m.manufacturer,
        category: m.category.name ?? "Medicines",
        barcode: m.barcode ?? '',
        hsnCode: m.hsnCode,
        mrp: String(m.mrp),
        cp: String(m.cp),
        sp: String(m.sp),
        genericName: m.genericName ?? '',
        gstPercentage: String(m.gstPercentage),
        prescriptionRequired: m.prescriptionRequired,
        // Falls back to INCLUSIVE for products saved before this field existed.
        gstType: (m as unknown as { gstType?: GstType }).gstType ?? 'INCLUSIVE',
    };
}

type ProductFormModalProps = {
    open: boolean;
    onClose: () => void;
    /** Pass an existing product to edit it; omit/null to create a new one. */
    product?: product | null;
    /** Called after a successful create/update, with the saved product id. */
    onSuccess?: (productId: number) => void;
};


const labelCls = 'mb-0.5 block text-xs font-medium text-neutral-500';
const inputCls =
    'w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-50 disabled:text-neutral-400';

const CloseIcon = () => (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.75">
        <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
);

export function ProductFormModal({ open, onClose, product, onSuccess }: ProductFormModalProps) {
    const editingId = product?.id ?? null;

    const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const options = [
        "Medicines",
        "Medical Supplies & Devices",
        "Health & Nutrition",
        "Personal & Baby Care",
        "Homeopathy & Ayurveda",
        "Other"
    ]

    // Reset form contents whenever the modal opens or the target product changes.
    useEffect(() => {
        if (!open) return;
        setForm(product ? toFormState(product) : EMPTY_FORM);
        setError(null);
    }, [open, product]);

    if (!open) return null;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: form.name,
                manufacturer: form.manufacturer,
                category: form.category || undefined,
                barcode: form.barcode || undefined,
                hsnCode: form.hsnCode,
                gstPercentage: Number(form.gstPercentage),
                genericName: form.genericName,
                mrp: Number(form.mrp),
                cp: Number(form.cp),
                sp: Number(form.sp),
                prescriptionRequired: form.prescriptionRequired,
                gstType: form.gstType,
            };
            console.log('Submitting product form payload:', payload);

            let savedId = editingId;
            if (editingId) {
                await apiFetch(`/api/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
            } else {
                const created = await apiFetch<product>('/api/products', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                savedId = created.id;
            }

            onSuccess?.(savedId as number);
            onClose();
        } catch (err) {
            setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-neutral-900/40 p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
                <div className="mb-3 flex items-start justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-neutral-900">
                            {editingId ? 'Edit product' : 'Add product'}
                        </h2>
                        <p className="text-xs text-neutral-400">
                            {editingId ? 'Update catalog and GST details.' : 'Add a new item to the catalog.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                            <label className={labelCls}>Name</label>
                            <input
                                className={inputCls}
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Generic Name</label>
                            <input
                                className={inputCls}
                                value={form.genericName}
                                onChange={(e) => setForm({ ...form, genericName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Manufacturer</label>
                            <input
                                className={inputCls}
                                required
                                value={form.manufacturer}
                                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Category</label>
                            <select value={form.category} className={inputCls} onChange={(e) => setForm({ ...form, category: e.target.value })} name="" id="">
                                {
                                    options.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Barcode</label>
                            <input
                                className={inputCls}
                                value={form.barcode}
                                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>HSN code</label>
                            <input
                                className={`${inputCls} font-mono`}
                                required
                                value={form.hsnCode}
                                onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelCls}>GST %</label>
                            <input
                                className={inputCls}
                                required
                                type="number"
                                step="0.01"
                                min={0}
                                max={28}
                                value={form.gstPercentage}
                                onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelCls}>Mrp</label>
                            <input
                                className={inputCls}
                                required
                                type="number"
                                value={form.mrp}
                                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelCls}>Cost Price</label>
                            <input
                                className={inputCls}
                                required
                                type="number"
                                value={form.cp}
                                onChange={(e) => setForm({ ...form, cp: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelCls}>Selling Price</label>
                            <input
                                className={inputCls}
                                required
                                type="number"
                                value={form.sp}
                                onChange={(e) => setForm({ ...form, sp: e.target.value })}
                            />
                        </div>

                        {/* GST type — inclusive (MRP already has GST, common for most retail
                products) vs exclusive (GST added on top, common for B2B/hospital supply) */}
                        <div className="col-span-2">
                            <label className={labelCls}>GST type</label>
                            <div className="inline-flex w-full rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, gstType: 'INCLUSIVE' })}
                                    className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${form.gstType === 'INCLUSIVE'
                                        ? 'bg-white text-primary-700 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    Inclusive (MRP)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, gstType: 'EXCLUSIVE' })}
                                    className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${form.gstType === 'EXCLUSIVE'
                                        ? 'bg-white text-primary-700 shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    Exclusive (+GST)
                                </button>
                            </div>
                            <p className="mt-1 text-[11px] leading-tight text-neutral-400">
                                {form.gstType === 'INCLUSIVE'
                                    ? 'Selling price already includes GST — usual for MRP-based retail sales.'
                                    : 'GST will be added on top of the selling price — usual for B2B / hospital billing.'}
                            </p>
                        </div>

                        <label className="col-span-2 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-400"
                                checked={form.prescriptionRequired}
                                onChange={(e) => setForm({ ...form, prescriptionRequired: e.target.checked })}
                            />
                            Prescription required
                        </label>
                    </div>

                    {error && (
                        <p className="rounded-lg bg-danger-50 px-3 py-1.5 text-sm text-danger-700">{error}</p>
                    )}

                    <div className="flex justify-end gap-2 border-t border-neutral-100 pt-2.5">
                        <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={saving}
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}