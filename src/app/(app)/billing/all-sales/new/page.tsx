
"use client"
import PrintBillButton from "@/components/billing/PrintBillButton";
import Button from "@/components/Button";
import CreateDoctor from "@/components/doctor/CreateDoctor";
import CreateHospital from "@/components/hospitals/CreateHospital";
import Input from "@/components/Input";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { product } from "@/types";
import { Bill, PaymentMethod } from "@prisma/client";
import { Building2, FileText, IndianRupee, Minus, Plus, Search, ShoppingCart, Stethoscope, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CreateCustomer from "@/components/customer/CreateCustomer";

interface CustomerOption {
    id: number;
    name: string;
    phone?: string | null;
    gstin?: string | null;
}

type GstMode = 'EXCLUSIVE' | 'INCLUSIVE';
interface DoctorOption {
    id: number;
    name: string;
    specialization?: string | null;
    phone?: string | null;
}

interface HospitalOption {
    id: number;
    name: string;
    address?: string | null;
    phone?: string | null;
}

interface CartLine {
    productId: number;
    name: string;
    gstPercentage: string;
    quantity: number | "";
    genericName?: string;
    batchId?: number;
    availableStock: number;
    sellingPrice: string;
}

export default function CreateBillPage() {
    const router = useRouter();
    const [createdBillId, setCreatedBillId] = useState<number | null>(null);

    const [results, setResults] = useState<product[]>([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartLine[]>([]);
    const [gstMode, setGstMode] = useState<GstMode>('EXCLUSIVE');
    const [isInterState, setIsInterState] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);

    const [doctorId, setDoctorId] = useState<number | null>(null);
    const [doctorName, setDoctorName] = useState('');
    const [doctorSuggestions, setDoctorSuggestions] = useState<DoctorOption[]>([]);
    const [showDoctorSuggestions, setShowDoctorSuggestions] = useState(false);
    const doctorBoxRef = useRef<HTMLDivElement>(null);

    const [hospitalId, setHospitalId] = useState<number | null>(null);
    const [hospitalName, setHospitalName] = useState('');
    const [hospitalSuggestions, setHospitalSuggestions] = useState<HospitalOption[]>([]);
    const [showHospitalSuggestions, setShowHospitalSuggestions] = useState(false);
    const hospitalBoxRef = useRef<HTMLDivElement>(null);

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerGstin, setCustomerGstin] = useState('');
    const [createPaymentMethod, setCreatePaymentMethod] = useState<PaymentMethod>('CASH');
    const [showCreateDoctor, setShowCreateDoctor] = useState(false);
    const [showCreateHospital, setShowCreateHospital] = useState(false);
    const [ipOp, setIpOp] = useState('');
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [customerSuggestions, setCustomerSuggestions] = useState<CustomerOption[]>([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const [showCreateCustomer, setShowCreateCustomer] = useState(false);
    const customerBoxRef = useRef<HTMLDivElement>(null);

    // function updateQty(batchId: number, quantity: number) {
    //     setCart(prev =>
    //         prev.map(item => {
    //             if (item.batchId !== batchId)
    //                 return item;

    //             quantity = Math.max(
    //                 1,
    //                 Math.min(quantity, item.availableStock)
    //             );

    //             return {
    //                 ...item,
    //                 quantity
    //             };
    //         })
    //     );
    // }
    function updateQty(batchId: number, quantity: number | "") {
        setCart(prev =>
            prev.map(item => {
                if (item.batchId !== batchId) return item;

                if (quantity === "") {
                    return {
                        ...item,
                        quantity: "",
                    };
                }

                quantity = Math.min(quantity, item.availableStock);

                return {
                    ...item,
                    quantity,
                };
            })
        );
    }
    function updateRate(batchId: number, sellingPrice: string) {
        setCart(prev =>
            prev.map(item =>
                item.batchId !== batchId ? item : { ...item, sellingPrice }
            )
        );
    }

    function updateGst(batchId: number, gstPercentage: string) {
        setCart(prev =>
            prev.map(item =>
                item.batchId !== batchId ? item : { ...item, gstPercentage }
            )
        );
    }

    function handleHospitalNameChange(value: string) {
        setHospitalName(value);
        setHospitalId(null);
        setShowHospitalSuggestions(true);
    }

    const onClose = async () => {
        setShowCreateDoctor(false)
        setShowCreateHospital(false)
        setShowCreateCustomer(false)
    }

    function addToCart(m: product, batch: product["batches"][number]) {
        if (batch.quantityAvailable <= 0) {
            alert(`${m.name} (${batch.batchNumber}) has no available stock.`);
            return;
        }

        setCart((prev) => {
            const existing = prev.find(
                (l) => l.productId === m.id && l.batchId === batch.id
            );

            if (existing) {
                return prev.map((l) =>
                    l.productId === m.id && l.batchId === batch.id
                        ? { ...l, quantity: Number(l.quantity) + 1 }
                        : l
                );
            }

            return [
                ...prev,
                {
                    productId: m.id,
                    batchId: batch.id,
                    name: `${m.name} (${batch.batchNumber})`,
                    genericName: m.genericName ?? undefined,
                    gstPercentage: m.gstPercentage,
                    quantity: 1,
                    availableStock: batch.quantityAvailable,
                    sellingPrice: batch.sellingPrice,
                },
            ];
        });

        setSearch("");
        setResults([]);
    }

    function removeLine(productId: number) {
        setCart((prev) => prev.filter((l) => l.productId !== productId));
    }

    function lineAmounts(l: CartLine, mode: GstMode, interState: boolean) {
        const price = Number(l.sellingPrice);
        const gstPct = Number(l.gstPercentage);
        const lineTotal = price * Number(l.quantity);

        let base: number;
        let gst: number;

        if (mode === 'INCLUSIVE') {
            base = lineTotal / (1 + gstPct / 100);
            gst = lineTotal - base;
        } else {
            base = lineTotal;
            gst = (lineTotal * gstPct) / 100;
        }

        const cgst = interState ? 0 : gst / 2;
        const sgst = interState ? 0 : gst / 2;
        const igst = interState ? gst : 0;

        return { base, gst, cgst, sgst, igst, total: base + gst };
    }

    function selectHospital(h: HospitalOption) {
        setHospitalId(h.id);
        setHospitalName(h.name);
        setShowHospitalSuggestions(false);
    }

    function handleDoctorNameChange(value: string) {
        setDoctorName(value);
        setDoctorId(null);
        setShowDoctorSuggestions(true);
    }

    async function submitBill() {
        if (cart.length === 0) return;
        setSubmitting(true);
        setError(null);
        try {
            let uploadedPrescription: { prescriptionFile: string; prescriptionName: string; prescriptionType: string } | undefined;

            if (prescriptionFile) {
                const formData = new FormData();
                formData.append('file', prescriptionFile);

                const uploadRes = await fetch('/api/prescriptions/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const body = await uploadRes.json().catch(() => ({}));
                    throw new ApiClientError(uploadRes.status, body.message ?? 'Prescription upload failed');
                }
                uploadedPrescription = await uploadRes.json();
            }

            const bill = await apiFetch<Bill>('/api/bills', {
                method: 'POST',
                body: JSON.stringify({
                    items: cart.map((l) => ({
                        productId: l.productId,
                        quantity: l.quantity,
                        batchId: l.batchId
                    })),
                    customerName: customerName || undefined,
                    customerPhone: customerPhone || undefined,
                    customerGstin: customerGstin || undefined,
                    customerId: customerId || undefined,
                    doctorId: doctorId || undefined,
                    doctorName: !doctorId && doctorName.trim() ? doctorName.trim() : undefined,
                    hospitalId: hospitalId || undefined,
                    hospitalName: !hospitalId && hospitalName.trim() ? hospitalName.trim() : undefined,
                    prescriptionFile: uploadedPrescription?.prescriptionFile,
                    prescriptionName: uploadedPrescription?.prescriptionName,
                    prescriptionType: uploadedPrescription?.prescriptionType,
                    isInterState,
                    ipOp: ipOp || undefined,
                }),
            });
            await apiFetch(`/api/bills/${bill.id}/payments`, {
                method: "POST",
                body: JSON.stringify({
                    amount: Number(estimatedSubtotal + estimatedGst),
                    method: createPaymentMethod,
                }),
            });
            setCreatedBillId(bill.id);
        } catch (err: any) {
            setError(err instanceof ApiClientError ? err.message : "Something went wrong while creating the bill");
        } finally {
            setSubmitting(false);
        }
    }

    const estimatedSubtotal = cart.reduce((sum, l) => sum + lineAmounts(l, gstMode, isInterState).base, 0);
    const estimatedGst = cart.reduce((sum, l) => sum + lineAmounts(l, gstMode, isInterState).gst, 0);
    const estimatedCgst = isInterState ? 0 : estimatedGst / 2;
    const estimatedSgst = isInterState ? 0 : estimatedGst / 2;
    const estimatedIgst = isInterState ? estimatedGst : 0;

    function selectDoctor(d: DoctorOption) {
        setDoctorId(d.id);
        setDoctorName(d.name);
        setShowDoctorSuggestions(false);
    }
    function handleCustomerNameChange(value: string) {
        setCustomerName(value);
        setCustomerId(null);
        setShowCustomerSuggestions(true);
    }

    function selectCustomer(c: CustomerOption) {
        setCustomerId(c.id);
        setCustomerName(c.name);
        setShowCustomerSuggestions(false);
    }
    useEffect(() => {
        if (!search) {
            setResults([]);
            return;
        }
        const t = setTimeout(async () => {
            const data = await apiFetch<product[]>(`/api/products?search=${encodeURIComponent(search)}&status=ACTIVE`);
            setResults(data);
        }, 250);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        if (!doctorName.trim()) {
            setDoctorSuggestions([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const data = await apiFetch<DoctorOption[]>(`/api/doctors?search=${encodeURIComponent(doctorName)}`);
                setDoctorSuggestions(data);
            } catch {
                setDoctorSuggestions([]);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [doctorName]);

    useEffect(() => {
        if (!hospitalName.trim()) {
            setHospitalSuggestions([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const data = await apiFetch<HospitalOption[]>(`/api/hospitals?search=${encodeURIComponent(hospitalName)}`);
                setHospitalSuggestions(data);
            } catch {
                setHospitalSuggestions([]);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [hospitalName]);

    useEffect(() => {
        if (!customerName.trim()) {
            setCustomerSuggestions([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const data = await apiFetch<CustomerOption[]>(`/api/customers?search=${encodeURIComponent(customerName)}`);
                setCustomerSuggestions(data);
            } catch {
                setCustomerSuggestions([]);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [customerName]);

    return (
        <div className="h-screen w-full overflow-hidden grid grid-rows-12 bg-neutral-100">
            <div className="row-span-11 grid grid-cols-12 min-h-0">

                {/* -------- Left: product search + cart -------- */}
                <div className="col-span-9 flex flex-col min-h-0 border-r border-neutral-200 bg-white">
                    <div className="flex items-center gap-3 border-b border-neutral-200 bg-primary-100 px-5 py-3 shrink-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-300">
                            <ShoppingCart className="h-5 w-5 text-primary-950" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-primary-950 leading-tight">Customer Invoice</h1>
                            <p className="text-xs text-primary-950">Search products and build the bill</p>
                        </div>
                    </div>

                    <div className="relative flex flex-1 min-h-0 flex-col p-4 gap-3">
                        <div className="relative shrink-0">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <Input
                                id="productSearch"
                                label=""
                                type="text"
                                className="pl-9"
                                placeholder="Search product by name, barcode, or HSN..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {results.length > 0 && (
                                <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl">
                                    {results.map((m) => (
                                        <div key={m.id}>
                                            {m.batches.map((b) => (
                                                <button
                                                    key={`${m.id}-${b.batchNumber}`}
                                                    className="grid w-full grid-cols-6 items-center gap-2 border-b border-neutral-100 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-primary-50"
                                                    onClick={() => addToCart(m, b)}
                                                >
                                                    <span className="col-span-3 truncate text-sm font-medium text-neutral-800">{m.name}</span>
                                                    <span className="text-xs text-neutral-500">{"Batch " + b.batchNumber}</span>
                                                    <span className="text-xs text-neutral-500">{"Exp " + new Date(b.expiryDate).toLocaleDateString("en-IN")}</span>
                                                    <span className="justify-self-end rounded-full bg-secondary-100 px-2 py-0.5 text-[11px] font-medium text-secondary-700">
                                                        {b.quantityAvailable} in stock
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex flex-1 min-h-0 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400">
                                <ShoppingCart className="mb-2 h-8 w-8" />
                                <p className="text-sm">Search and add products to start a bill.</p>
                            </div>
                        ) : (
                            <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-neutral-200">
                                <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    <span>Cart · {cart.length} item{cart.length > 1 ? 's' : ''}</span>
                                    <span className="normal-case tracking-normal text-neutral-400">
                                        Prices shown {gstMode === 'INCLUSIVE' ? 'inclusive' : 'exclusive'} of GST · {isInterState ? 'IGST' : 'CGST + SGST'}
                                    </span>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto">
                                    <table className="w-full border border-surface-200 text-left text-[8px]">
                                        <thead className="sticky top-0 border-b border-surface-200 bg-neutral-50 uppercase tracking-wide text-neutral-500">
                                            <tr className="divide-x divide-surface-200">
                                                <th className="py-2.5 px-3">Item</th>
                                                <th className="py-2.5 px-3">Generic Name</th>
                                                <th className="py-2.5 px-3">Qty</th>
                                                <th className="py-2.5 px-3">Unit Price</th>
                                                <th className="py-2.5 px-3">GST%</th>
                                                <th className="py-2.5 px-3">Taxable Value</th>
                                                {isInterState ? (
                                                    <th className="py-2.5 px-3">IGST</th>
                                                ) : (
                                                    <>
                                                        <th className="py-2.5 px-3">CGST</th>
                                                        <th className="py-2.5 px-3">SGST</th>
                                                    </>
                                                )}
                                                <th className="py-2.5 px-3">Line Total</th>
                                                <th className="py-2.5 px-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-200">
                                            {cart.map((l) => {
                                                // console.log("Line item:", l);
                                                const { base, cgst, sgst, igst, total } = lineAmounts(l, gstMode, isInterState);
                                                return (
                                                    <tr key={l.productId} className="divide-x divide-surface-200 hover:bg-neutral-50">
                                                        <td className="px-3 py-2.5 font-medium text-neutral-700">{l.name}</td>
                                                        <td className="px-3 py-2.5 font-medium text-neutral-700">{l.genericName}</td>
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-1">
                                                                {/* <input
                                                                    className="input h-8 w-14 text-center"
                                                                    type="number"
                                                                    min={1}
                                                                    max={l.availableStock}
                                                                    value={l.quantity}
                                                                    onChange={(e) => updateQty(l.batchId!, Number(e.target.value))}
                                                                    onChange={(e) => {
                                                                        if (e.target.value === "") return;
                                                                        updateQty(l.batchId!, Number(e.target.value));
                                                                    }}
                                                                    
                                                                /> */}
                                                                <input
                                                                    className="input h-8 w-14 text-center"
                                                                    type="number"
                                                                    max={l.availableStock}
                                                                    value={l.quantity}
                                                                    onChange={(e) => {
                                                                        updateQty(
                                                                            l.batchId!,
                                                                            e.target.value === "" ? "" : Number(e.target.value)
                                                                        );
                                                                    }}
                                                                    onBlur={() => {
                                                                        if (l.quantity === "" || Number(l.quantity) < 1) {
                                                                            updateQty(l.batchId!, 1);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                        {/* <td className="px-3 py-2.5 text-neutral-600">₹{l.sellingPrice}</td> */}
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-neutral-400">₹</span>
                                                                <input
                                                                    className="input h-8 w-20 text-center"
                                                                    type="number"
                                                                    step="0.01"
                                                                    min={0}
                                                                    value={l.sellingPrice}
                                                                    onChange={(e) => updateRate(l.batchId!, e.target.value)}
                                                                    onBlur={() => {
                                                                        if (l.sellingPrice === "" || Number(l.sellingPrice) < 0) {
                                                                            updateRate(l.batchId!, "0");
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>
                                                        {/* <td className="px-3 py-2.5 text-neutral-600">{l.gstPercentage}%</td> */}
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    className="input h-8 w-14 text-center"
                                                                    type="number"
                                                                    step="0.01"
                                                                    min={0}
                                                                    max={28}
                                                                    value={l.gstPercentage}
                                                                    onChange={(e) => updateGst(l.batchId!, e.target.value)}
                                                                    onBlur={() => {
                                                                        if (l.gstPercentage === "" || Number(l.gstPercentage) < 0) {
                                                                            updateGst(l.batchId!, "0");
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-neutral-400">%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-neutral-600">₹{base.toFixed(2)}</td>
                                                        {isInterState ? (
                                                            <td className="px-3 py-2.5">
                                                                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                                                    ₹{igst.toFixed(2)}
                                                                </span>
                                                            </td>
                                                        ) : (
                                                            <>
                                                                <td className="px-3 py-2.5">
                                                                    <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                                                                        ₹{cgst.toFixed(2)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    <span className="rounded-md bg-secondary-50 px-2 py-0.5 text-xs font-medium text-secondary-700">
                                                                        ₹{sgst.toFixed(2)}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="px-3 py-2.5 font-medium text-neutral-800">₹{total.toFixed(2)}</td>
                                                        <td className="px-3 py-2.5 text-right">
                                                            <button
                                                                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                                                                onClick={() => removeLine(l.productId)}
                                                                title="Remove"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="shrink-0 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* -------- Right: customer / payment panel -------- */}
                <div className="col-span-3 flex min-h-0 flex-col bg-neutral-50 p-3">
                    <div className="flex min-h-0 flex-1 flex-col gap-3 pr-1 overflow-y-auto">
                        {/* <div className="grid grid-cols-4 gap-1">
                            <div className="col-span-3">
                                <Input
                                    label="Customer Name"
                                    id="customerName"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>
                            <div className="col-span-1">
                                <Input
                                    label="IP/OP"
                                    id="ipOp"
                                    value={ipOp}
                                    onChange={(e) => setIpOp(e.target.value)}
                                />
                            </div>
                        </div> */}
                        <div className="grid grid-cols-4 gap-1">
                            <div className="relative col-span-3" ref={customerBoxRef}>
                                <div className="mb-1 flex items-center justify-between">
                                    <label className="label !flex m-0 items-center gap-1.5">Customer</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateCustomer(true)}
                                        className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                    >
                                        <UserPlus className="h-3.5 w-3.5" /> New customer
                                    </button>
                                </div>
                                <Input
                                    id="customerSearch"
                                    label=""
                                    type="text"
                                    placeholder="Search customer by name or phone…"
                                    value={customerName}
                                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                                />
                                {customerId && <p className="mt-1 text-xs text-secondary-600">Existing customer selected ✓</p>}
                                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                                        {customerSuggestions.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50"
                                                onClick={() => selectCustomer(c)}
                                            >
                                                <span className="font-medium text-neutral-700">{c.name}</span>
                                                {c.phone && <span className="text-xs text-neutral-400">{c.phone}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showCustomerSuggestions && customerName.trim() && customerSuggestions.length === 0 && (
                                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white p-3 text-xs shadow-lg">
                                        <p className="mb-2 text-neutral-400">No customer named "{customerName.trim()}" found.</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateCustomer(true)}
                                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-50 py-1.5 font-medium text-primary-700 hover:bg-primary-100"
                                        >
                                            <UserPlus className="h-3.5 w-3.5" /> Create "{customerName.trim()}" as new customer
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="col-span-1">
                                <Input
                                    label="IP/OP"
                                    id="ipOp"
                                    value={ipOp}
                                    onChange={(e) => setIpOp(e.target.value)}
                                />
                            </div>
                        </div>
                        {/* <Input
                            label="Customer Mobile"
                            id="customerPhone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        /> */}

                        <div className="relative sm:col-span-2" ref={doctorBoxRef}>
                            <div className="mb-1 flex items-center justify-between">
                                <label className="label !flex m-0 items-center gap-1.5">
                                    <Stethoscope className="h-3.5 w-3.5" /> Referring doctor
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateDoctor(true)}
                                    className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                >
                                    <UserPlus className="h-3.5 w-3.5" /> New doctor
                                </button>
                            </div>
                            <Input
                                type="text"
                                id="doctorSearch"
                                label=""
                                className="input"
                                placeholder="Search doctor by name…"
                                value={doctorName}
                                onChange={(e) => handleDoctorNameChange(e.target.value)}
                            />
                            {doctorId && <p className="mt-1 text-xs text-secondary-600">Existing doctor selected ✓</p>}
                            {showDoctorSuggestions && doctorSuggestions.length > 0 && (
                                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                                    {doctorSuggestions.map((d) => (
                                        <button
                                            key={d.id}
                                            type="button"
                                            className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50"
                                            onClick={() => selectDoctor(d)}
                                        >
                                            <span className="font-medium text-neutral-700">{d.name}</span>
                                            {d.specialization && <span className="text-xs text-neutral-400">{d.specialization}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showDoctorSuggestions && doctorName.trim() && doctorSuggestions.length === 0 && (
                                <div className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white p-3 text-xs shadow-lg">
                                    <p className="mb-2 text-neutral-400">No doctor named "{doctorName.trim()}" found.</p>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-50 py-1.5 font-medium text-primary-700 hover:bg-primary-100"
                                    >
                                        <UserPlus className="h-3.5 w-3.5" /> Create "{doctorName.trim()}" as new doctor
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="relative sm:col-span-2" ref={hospitalBoxRef}>
                            <div className="mb-1 flex items-center justify-between">
                                <label className="label !flex m-0 items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" /> Referring hospital
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateHospital(true)}
                                    className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                >
                                    <Plus className="h-3.5 w-3.5" /> New hospital
                                </button>
                            </div>
                            <Input
                                id="hospitalSearch"
                                label=""
                                type="text"
                                className="input"
                                placeholder="Search hospital by name…"
                                value={hospitalName}
                                onChange={(e) => handleHospitalNameChange(e.target.value)}
                            />
                            {hospitalId && <p className="mt-1 text-xs text-secondary-600">Existing hospital selected ✓</p>}
                            {showHospitalSuggestions && hospitalSuggestions.length > 0 && (
                                <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
                                    {hospitalSuggestions.map((h) => (
                                        <button
                                            key={h.id}
                                            type="button"
                                            className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50"
                                            onClick={() => selectHospital(h)}
                                        >
                                            <span className="font-medium text-neutral-700">{h.name}</span>
                                            {h.address && <span className="text-xs text-neutral-400">{h.address}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showHospitalSuggestions && hospitalName.trim() && hospitalSuggestions.length === 0 && (
                                <div className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white p-3 text-xs shadow-lg">
                                    <p className="mb-2 text-neutral-400">No hospital named "{hospitalName.trim()}" found.</p>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-50 py-1.5 font-medium text-primary-700 hover:bg-primary-100"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Create "{hospitalName.trim()}" as new hospital
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary — pinned at bottom */}
                    <div className="mt-3 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-primary-700 to-indigo-700 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wide text-primary-100">Amount Payable</p>
                            <div className="flex items-center gap-1 text-2xl font-bold text-white">
                                <IndianRupee className="h-5 w-5" />
                                {(estimatedSubtotal + estimatedGst).toFixed(2)}
                            </div>
                        </div>

                        <div className="p-3 space-y-3">
                            <div>
                                <label className="label">Method</label>
                                <select
                                    className="input"
                                    value={createPaymentMethod}
                                    onChange={(e) => setCreatePaymentMethod(e.target.value as PaymentMethod)}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="UPI">UPI</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2 rounded-lg bg-neutral-50 p-2">
                                <div className="text-center">
                                    <p className="text-[11px] text-neutral-400">Subtotal</p>
                                    <p className="text-sm font-semibold text-neutral-700">₹{estimatedSubtotal.toFixed(2)}</p>
                                </div>

                                {isInterState ? (
                                    <div className="col-span-2 text-center">
                                        <p className="text-[11px] text-neutral-400">IGST</p>
                                        <p className="text-sm font-semibold text-neutral-700">₹{estimatedIgst.toFixed(2)}</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center">
                                            <p className="text-[11px] text-neutral-400">CGST</p>
                                            <p className="text-sm font-semibold text-neutral-700">₹{estimatedCgst.toFixed(2)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] text-neutral-400">SGST</p>
                                            <p className="text-sm font-semibold text-neutral-700">₹{estimatedSgst.toFixed(2)}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button
                                variant="success"
                                className="btn-primary w-full justify-center"
                                disabled={cart.length === 0 || submitting}
                                onClick={submitBill}
                            >
                                {submitting ? "Creating…" : "Create Bill"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* -------- Footer strip -------- */}
            <div className="row-span-1 grid grid-cols-12 items-center gap-3 w-full border-t border-neutral-200 bg-sky-100 px-5">

                <div className="col-span-4 flex items-center gap-2">
                    <label htmlFor="prescription" className="shrink-0 text-sm font-medium text-neutral-700">Prescription</label>
                    <Input
                        className="text-sm"
                        label=""
                        id="prescription"
                        type="file"
                        onChange={(e) => setPrescriptionFile(e.target.files?.[0] ?? null)}
                    />
                </div>

                {/* <div className="col-span-4 flex items-center gap-2">
                    <label htmlFor="gstin" className="shrink-0 text-sm font-medium text-neutral-700">GSTIN</label>
                    <Input
                        className="text-sm"
                        label=""
                        id="gstin"
                        value={customerGstin}
                        onChange={(e) => setCustomerGstin(e.target.value)}
                    />
                </div> */}
                <div className="col-span-4" />

                <label
                    className="col-span-2 flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-600 cursor-pointer select-none"
                    htmlFor="interstate"
                >
                    <input
                        id="interstate"
                        type="checkbox"
                        checked={isInterState}
                        onChange={(e) => setIsInterState(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>Interstate</span>
                </label>

                <div className="col-span-2 inline-flex h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 text-xs font-medium">
                    <button
                        type="button"
                        onClick={() => setGstMode('EXCLUSIVE')}
                        className={`flex-1 rounded-md transition-colors ${gstMode === 'EXCLUSIVE'
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                    >
                        Excl.
                    </button>
                    <button
                        type="button"
                        onClick={() => setGstMode('INCLUSIVE')}
                        className={`flex-1 rounded-md transition-colors ${gstMode === 'INCLUSIVE'
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                    >
                        Incl.
                    </button>
                </div>
            </div>
            {
                showCreateDoctor && <CreateDoctor onClose={onClose} />
            }
            {
                showCreateHospital && <CreateHospital onClose={onClose} />
            }
            {
                showCreateCustomer && <CreateCustomer onClose={onClose} initialName={customerName} />
            }
            {createdBillId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 no-print">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100">
                            <FileText className="h-6 w-6 text-secondary-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-neutral-800">Bill created</h2>
                        <p className="mt-1 text-sm text-neutral-500">Print a copy for the customer or continue.</p>

                        <div className="mt-5 flex flex-col gap-2">
                            <PrintBillButton
                                billId={createdBillId}
                                label="Print Bill"
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                            />
                            <button
                                type="button"
                                onClick={() => router.push('/billing/all-sales')}
                                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                            >
                                Go to bill list
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}