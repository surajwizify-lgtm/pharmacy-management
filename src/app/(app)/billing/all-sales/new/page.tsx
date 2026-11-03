"use client"
import PrintBillButton from "@/components/billing/PrintBillButton";
import { Button } from "@/components/ui/button";
import CreateDoctor from "@/components/doctor/CreateDoctor";
import CreateHospital from "@/components/hospitals/CreateHospital";
import Input from "@/components/Input";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { product } from "@/types";
import { Bill, PaymentMethod } from "@prisma/client";
import { ArrowLeft, Building2, FileText, IndianRupee, Plus, Search, ShoppingCart, Stethoscope, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CreateCustomer from "@/components/customer/CreateCustomer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import BackButton from "@/components/common/BackButton";
import { useDispatch } from "react-redux";
import { setCollapsed, toggleSideBar } from "@/store/slices/uiSlice";
import Container from "@/components/common/Container";
import DetailPageHeader from "@/components/common/DetailPageHeader";

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
    const dispatch = useDispatch();
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
    const [createPaymentMethod, setCreatePaymentMethod] = useState<PaymentMethod>('CASH');
    const [showCreateDoctor, setShowCreateDoctor] = useState(false);
    const [showCreateHospital, setShowCreateHospital] = useState(false);
    const [ipOp, setIpOp] = useState('');
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [customerSuggestions, setCustomerSuggestions] = useState<CustomerOption[]>([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const [showCreateCustomer, setShowCreateCustomer] = useState(false);
    const customerBoxRef = useRef<HTMLDivElement>(null);

    function updateQty(batchId: number, quantity: number | "") {
        setCart(prev =>
            prev.map(item => {
                if (item.batchId !== batchId) return item;
                if (quantity === "") {
                    return { ...item, quantity: "" };
                }
                quantity = Math.min(quantity, item.availableStock);
                return { ...item, quantity };
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
    const ColGroup = () => (
        <colgroup>
            <col style={{ width: '250px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '80px' }} />
            {isInterState ? (
                <col style={{ width: '80px' }} />
            ) : (
                <>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '80px' }} />
                </>
            )}
            <col style={{ width: '100px' }} />
            <col style={{ width: '80px' }} />
        </colgroup>
    );

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
    useEffect(() => {
        dispatch(setCollapsed(true))
    }, [])
    return (
        <div>
            <div className="h-screen w-full overflow-hidden grid grid-rows-12 bg-[var(--color-bg-secondary)]">
                <div className="row-span-12 grid grid-cols-12 min-h-0">
                    <div className="col-span-12 flex flex-col min-h-0 border-r border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)]">
                        {/* <div className="flex items-center gap-3 border-b border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] px-5 py-3 shrink-0">
                            <div onClick={() => { dispatch(setCollapsed(false)) }}>
                                <BackButton />
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--text-link)]/10">
                                <ShoppingCart className="h-5 w-5 text-[var(--text-link)]" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-[var(--text-primary)] leading-tight">Customer Invoice</h1>
                                <p className="text-xs text-[var(--text-secondary)]">Search products and build the bill</p>
                            </div>
                        </div> */}
                        <DetailPageHeader title="Customer Invoice" subtitle='Search products and build the bill'></DetailPageHeader>
                        <Container>
                            <section>
                                <div className="col-span-3 flex min-h-0 flex-col p-3">
                                    <div className="grid grid-cols-3 gap-4 border-b border-b-gray-300 pb-2">
                                        <div className="grid grid-cols-4 gap-2 border-r border-r-gray-300 pr-4">
                                            <div className="relative col-span-3" ref={customerBoxRef}>
                                                <div className="mb-1 flex items-center justify-between">
                                                    <label className=" font-medium text-[var(--text-secondary)]">Customer</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCreateCustomer(true)}
                                                        className="flex items-center gap-1 text-xs font-medium text-[var(--text-link)] hover:underline"
                                                    >
                                                        <UserPlus className="h-3.5 w-3.5" /> Customer
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
                                                {customerId && <p className="mt-1 text-xs text-[var(--text-success)]">Existing customer selected ✓</p>}
                                                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                                                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] shadow-lg">
                                                        {customerSuggestions.map((c) => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                                                onClick={() => selectCustomer(c)}
                                                            >
                                                                <span className="font-medium text-[var(--text-primary)]">{c.name}</span>
                                                                {c.phone && <span className="text-xs text-[var(--text-secondary)]">{c.phone}</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {showCustomerSuggestions && customerName.trim() && customerSuggestions.length === 0 && (
                                                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] p-3 text-xs shadow-lg">
                                                        <p className="mb-2 text-[var(--text-secondary)]">No customer named "{customerName.trim()}" found.</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCreateCustomer(true)}
                                                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-bg-tertiary)] py-1.5 font-medium text-[var(--text-link)] hover:opacity-80"
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
                                        <div className="relative border-r border-r-gray-300 pr-4 " ref={doctorBoxRef}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <label className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
                                                    <Stethoscope className="h-3.5 w-3.5" /> Referring doctor
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCreateDoctor(true)}
                                                    className="flex items-center gap-1 text-xs font-medium text-[var(--text-link)] hover:underline"
                                                >
                                                    <UserPlus className="h-3.5 w-3.5" /> New doctor
                                                </button>
                                            </div>
                                            <Input
                                                type="text"
                                                id="doctorSearch"
                                                label=""
                                                placeholder="Search doctor by name…"
                                                value={doctorName}
                                                onChange={(e) => handleDoctorNameChange(e.target.value)}
                                            />
                                            {doctorId && <p className="mt-1 text-xs text-[var(--text-success)]">Existing doctor selected ✓</p>}
                                            {showDoctorSuggestions && doctorSuggestions.length > 0 && (
                                                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] shadow-lg">
                                                    {doctorSuggestions.map((d) => (
                                                        <button
                                                            key={d.id}
                                                            type="button"
                                                            className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                                            onClick={() => selectDoctor(d)}
                                                        >
                                                            <span className="font-medium text-[var(--text-primary)]">{d.name}</span>
                                                            {d.specialization && <span className="text-xs text-[var(--text-secondary)]">{d.specialization}</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {showDoctorSuggestions && doctorName.trim() && doctorSuggestions.length === 0 && (
                                                <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] p-3 text-xs shadow-lg">
                                                    <p className="mb-2 text-[var(--text-secondary)]">No doctor named "{doctorName.trim()}" found.</p>
                                                    <button
                                                        type="button"
                                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-bg-tertiary)] py-1.5 font-medium text-[var(--text-link)] hover:opacity-80"
                                                    >
                                                        <UserPlus className="h-3.5 w-3.5" /> Create "{doctorName.trim()}" as new doctor
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative " ref={hospitalBoxRef}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <label className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
                                                    <Building2 className="h-3.5 w-3.5" /> Referring hospital
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCreateHospital(true)}
                                                    className="flex items-center gap-1 text-xs font-medium text-[var(--text-link)] hover:underline"
                                                >
                                                    <Plus className="h-3.5 w-3.5" /> New hospital
                                                </button>
                                            </div>
                                            <Input
                                                id="hospitalSearch"
                                                label=""
                                                type="text"
                                                placeholder="Search hospital by name…"
                                                value={hospitalName}
                                                onChange={(e) => handleHospitalNameChange(e.target.value)}
                                            />
                                            {hospitalId && <p className="mt-1 text-xs text-[var(--text-success)]">Existing hospital selected ✓</p>}
                                            {showHospitalSuggestions && hospitalSuggestions.length > 0 && (
                                                <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] shadow-lg">
                                                    {hospitalSuggestions.map((h) => (
                                                        <button
                                                            key={h.id}
                                                            type="button"
                                                            className="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                                            onClick={() => selectHospital(h)}
                                                        >
                                                            <span className="font-medium text-[var(--text-primary)]">{h.name}</span>
                                                            {h.address && <span className="text-xs text-[var(--text-secondary)]">{h.address}</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {showHospitalSuggestions && hospitalName.trim() && hospitalSuggestions.length === 0 && (
                                                <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] p-3 text-xs shadow-lg">
                                                    <p className="mb-2 text-[var(--text-secondary)]">No hospital named "{hospitalName.trim()}" found.</p>
                                                    <button
                                                        type="button"
                                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-bg-tertiary)] py-1.5 font-medium text-[var(--text-link)] hover:opacity-80"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" /> Create "{hospitalName.trim()}" as new hospital
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    {/* <div className="mt-3 shrink-0 overflow-hidden rounded-xl border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] shadow-sm">
                                    <div className="border-b border-[var(--color-bg-tertiary)] bg-[var(--color-bg-secondary)] px-4 py-3">
                                        <p className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">Amount Payable</p>
                                        <div className="flex items-center gap-1 text-2xl font-bold text-[var(--text-primary)]">
                                            <IndianRupee className="h-5 w-5" />
                                            {(estimatedSubtotal + estimatedGst).toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="p-3 space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-[var(--text-secondary)]">Method</label>
                                            <select
                                                className="mt-1 w-full rounded-lg border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none"
                                                value={createPaymentMethod}
                                                onChange={(e) => setCreatePaymentMethod(e.target.value as PaymentMethod)}
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="CARD">Card</option>
                                                <option value="UPI">UPI</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 rounded-lg bg-[var(--color-bg-tertiary)] p-2">
                                            <div className="text-center">
                                                <p className="text-[11px] text-[var(--text-secondary)]">Subtotal</p>
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">₹{estimatedSubtotal.toFixed(2)}</p>
                                            </div>

                                            {isInterState ? (
                                                <div className="col-span-2 text-center">
                                                    <p className="text-[11px] text-[var(--text-secondary)]">IGST</p>
                                                    <p className="text-sm font-semibold text-[var(--text-controlled)]">₹{estimatedIgst.toFixed(2)}</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-center">
                                                        <p className="text-[11px] text-[var(--text-secondary)]">CGST</p>
                                                        <p className="text-sm font-semibold text-[var(--text-link)]">₹{estimatedCgst.toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[11px] text-[var(--text-secondary)]">SGST</p>
                                                        <p className="text-sm font-semibold text-[var(--text-controlled)]">₹{estimatedSgst.toFixed(2)}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            className="w-full rounded-lg bg-[var(--text-success)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                                            disabled={cart.length === 0 || submitting}
                                            onClick={submitBill}
                                        >
                                            {submitting ? "Creating…" : "Create Bill"}
                                        </button>
                                    </div>
                                </div> */}
                                </div>
                                <div>
                                    <div className="row-span-1 grid grid-cols-12 items-center gap-3 w-full  px-5">
                                        <div className="col-span-4 flex items-center gap-2">
                                            <label htmlFor="prescription" className="shrink-0 text-sm font-medium text-[var(--text-rx)]">Prescription</label>
                                            <Input
                                                className="text-sm"
                                                label=""
                                                id="prescription"
                                                type="file"
                                                onChange={(e) => setPrescriptionFile(e.target.files?.[0] ?? null)}
                                            />
                                        </div>
                                        <div className="col-span-4" />

                                        <label
                                            className="col-span-2 flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-xs font-medium text-[var(--text-warning)] cursor-pointer select-none"
                                            htmlFor="interstate"
                                        >
                                            <input
                                                id="interstate"
                                                type="checkbox"
                                                checked={isInterState}
                                                onChange={(e) => setIsInterState(e.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-[var(--color-bg-tertiary)]"
                                            />
                                            <span>Interstate</span>
                                        </label>

                                        <div className="col-span-2 inline-flex h-9 w-full rounded-lg border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] p-0.5 text-xs font-medium">
                                            <button
                                                type="button"
                                                onClick={() => setGstMode('EXCLUSIVE')}
                                                className={`flex-1 rounded-md transition-colors ${gstMode === 'EXCLUSIVE'
                                                    ? 'bg-[var(--text-link)]/10 text-[var(--text-link)]'
                                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                                    }`}
                                            >
                                                Excl.
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setGstMode('INCLUSIVE')}
                                                className={`flex-1 rounded-md transition-colors ${gstMode === 'INCLUSIVE'
                                                    ? 'bg-[var(--text-link)]/10 text-[var(--text-link)]'
                                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                                    }`}
                                            >
                                                Incl.
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </Container>

                        <Container className="flex relative flex-1">
                            <div className="relative flex flex-1 min-h-0 flex-col p-4 gap-3">
                                {/* Product search */}
                                <div className="relative shrink-0">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
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
                                        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] shadow-xl">
                                            {results.map((m) => (
                                                <div key={m.id}>
                                                    {m.batches.map((b) => (
                                                        <button
                                                            key={`${m.id}-${b.batchNumber}`}
                                                            className="grid w-full grid-cols-6 items-center gap-2 border-b border-[var(--color-bg-tertiary)] px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[var(--color-bg-tertiary)]"
                                                            onClick={() => addToCart(m, b)}
                                                        >
                                                            <span className="col-span-3 truncate text-sm font-medium text-[var(--text-primary)]">{m.name}</span>
                                                            <span className="text-xs text-[var(--text-secondary)]">{"Batch " + b.batchNumber}</span>
                                                            <span className="text-xs text-[var(--text-secondary)]">{"Exp " + new Date(b.expiryDate).toLocaleDateString("en-IN")}</span>
                                                            <span className="justify-self-end rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-success)]">
                                                                {b.quantityAvailable} in stock
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Cart */}
                                {cart.length === 0 ? (
                                    <div className="flex flex-1 min-h-0 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-bg-tertiary)] bg-[var(--color-bg-secondary)] text-[var(--text-secondary)]">
                                        <ShoppingCart className="mb-2 h-8 w-8" />
                                        <p className="text-sm">Search and add products to start a bill.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-1 min-h-0  flex-col overflow-hidden border  border-[var(--color-bg-tertiary)]">
                                        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-bg-tertiary)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                                            <span>Cart · {cart.length} item{cart.length > 1 ? 's' : ''}</span>
                                            <span className="normal-case tracking-normal text-[var(--text-secondary)]">
                                                Prices shown {gstMode === 'INCLUSIVE' ? 'inclusive' : 'exclusive'} of GST · {isInterState ? 'IGST' : 'CGST + SGST'}
                                            </span>
                                        </div>
                                        <table className="table-fixed w-full [&_th]:p-0 [&_th]:pl-1 &_td]:border-r [&_th]:border-r [&_td]:border-gray-200 [&_th]:border-gray-200">
                                            <ColGroup />
                                            <TableHeader>
                                                <TableRow className="bg-white rounded-xs text-black">
                                                    <TableHead className="text-black">Name And Generic Name</TableHead>
                                                    <TableHead className="text-black text-center">Qty</TableHead>
                                                    <TableHead className="text-black text-center">Unit Price</TableHead>
                                                    <TableHead className="text-black text-center">GST%</TableHead>
                                                    {isInterState ? (
                                                        <TableHead className="text-black text-center">IGST</TableHead>
                                                    ) : (
                                                        <>
                                                            <TableHead className="text-black text-center">CGST</TableHead>
                                                            <TableHead className="text-black text-center">SGST</TableHead>
                                                        </>
                                                    )}
                                                    <TableHead className="text-black text-center">Line Total</TableHead>
                                                    <TableHead className="text-black text-center">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                        </table>

                                        {/* ── Scrollable Body Table ── */}
                                        <div className="flex-1 min-h-0 overflow-y-auto">
                                            <table className="table-fixed w-full [&_tr]:p-5 [&_td]:p-0  [&_td]:border [&_th]:border [&_td]:border-gray-200 [&_th]:border-gray-200">
                                                <ColGroup />
                                                <TableBody>
                                                    {cart.map((l) => {
                                                        const { base, cgst, sgst, igst, total } = lineAmounts(l, gstMode, isInterState);
                                                        return (
                                                            <TableRow key={l.productId}>

                                                                {/* Name + Generic */}
                                                                <TableCell className="">
                                                                    <div className="pl-2">
                                                                        <h1 className="text-sm font-medium text-[var(--text-primary)]">{l.name}</h1>
                                                                        <p className="text-xs text-[var(--text-secondary)]">{l.genericName}</p>
                                                                    </div>
                                                                </TableCell>

                                                                {/* Qty */}
                                                                <TableCell className="h-px p-0">
                                                                    <input
                                                                        className="w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none"
                                                                        type="number"
                                                                        max={l.availableStock}
                                                                        value={l.quantity}
                                                                        onChange={(e) =>
                                                                            updateQty(l.batchId!, e.target.value === "" ? "" : Number(e.target.value))
                                                                        }
                                                                        onBlur={() => {
                                                                            if (l.quantity === "" || Number(l.quantity) < 1) updateQty(l.batchId!, 1);
                                                                        }}
                                                                    />
                                                                </TableCell>

                                                                {/* Unit Price */}
                                                                <TableCell className="h-px p-0">
                                                                    <div className="relative flex items-center h-full">
                                                                        <span className="absolute left-2 text-[var(--text-secondary)]">₹</span>
                                                                        <input
                                                                            className="h-full w-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none"
                                                                            type="number"
                                                                            step="0.01"
                                                                            min={0}
                                                                            max={1000}
                                                                            value={l.sellingPrice}
                                                                            onChange={(e) => updateRate(l.batchId!, e.target.value)}
                                                                            onBlur={() => {
                                                                                if (l.sellingPrice === "" || Number(l.sellingPrice) < 0)
                                                                                    updateRate(l.batchId!, "0");
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </TableCell>

                                                                {/* GST% */}
                                                                <TableCell className="h-px p-0">
                                                                    <div className="relative flex items-center h-full">
                                                                        <input
                                                                            className="h-full w-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none"
                                                                            type="number"
                                                                            step="0.01"
                                                                            min={0}
                                                                            max={28}
                                                                            value={l.gstPercentage}
                                                                            onChange={(e) => updateGst(l.batchId!, e.target.value)}
                                                                            onBlur={() => {
                                                                                if (l.gstPercentage === "" || Number(l.gstPercentage) < 0)
                                                                                    updateGst(l.batchId!, "0");
                                                                            }}
                                                                        />
                                                                        <span className="absolute right-4 text-[var(--text-secondary)]">%</span>
                                                                    </div>
                                                                </TableCell>

                                                                {/* IGST or CGST + SGST */}
                                                                {isInterState ? (
                                                                    <TableCell className="text-center">
                                                                        <span className="rounded-md bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs font-medium text-center text-[var(--text-controlled)]">
                                                                            ₹{igst.toFixed(2)}
                                                                        </span>
                                                                    </TableCell>
                                                                ) : (
                                                                    <>
                                                                        <TableCell className="text-center">
                                                                            <span className="rounded-md text-center bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--text-link)]">
                                                                                ₹{cgst.toFixed(2)}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            <span className="rounded-md bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--text-controlled)]">
                                                                                ₹{sgst.toFixed(2)}
                                                                            </span>
                                                                        </TableCell>
                                                                    </>
                                                                )}

                                                                {/* Line Total */}
                                                                <TableCell className="font-semibold text-center text-[var(--text-primary)]">
                                                                    ₹{total.toFixed(2)}
                                                                </TableCell>

                                                                {/* Actions */}
                                                                <TableCell className="text-right">
                                                                    <button
                                                                        className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--text-critical)]"
                                                                        onClick={() => removeLine(l.productId)}
                                                                        title="Remove"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                </TableCell>

                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </table>
                                        </div>

                                        {/* ── Footer Table ── */}
                                        <table className="table-fixed w-full border-t [&_td]:p-1 [&_td]:pl-1">
                                            <ColGroup />
                                            <tfoot className="font-bold">
                                                <tr>
                                                    <td className="py-2 pl-1">Total</td>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    {!isInterState && <td>₹{estimatedCgst.toFixed(2)}</td>}
                                                    {!isInterState && <td>₹{estimatedSgst.toFixed(2)}</td>}
                                                    {isInterState && <td>₹{estimatedIgst.toFixed(2)}</td>}
                                                    <td>₹{(estimatedSubtotal + estimatedGst).toFixed(2)}</td>
                                                    <td className=" pr-1">
                                                        <button
                                                            className="w-full rounded-lg bg-[var(--text-success)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                                                            disabled={cart.length === 0 || submitting}
                                                            onClick={submitBill}
                                                        >
                                                            {submitting ? "Creating…" : "Create Bill"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}

                                {error && (
                                    <div className="shrink-0 rounded-lg border border-[var(--text-error)]/30 bg-[var(--text-error)]/10 px-3 py-2 text-sm text-[var(--text-error)]">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </Container>
                    </div>


                </div>




                {showCreateDoctor && <CreateDoctor onClose={onClose} />}
                {showCreateHospital && <CreateHospital onClose={onClose} />}
                {showCreateCustomer && <CreateCustomer onClose={onClose} initialName={customerName} />}

                {createdBillId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--text-primary)]/30 no-print">
                        <div className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-primary)] p-6 shadow-xl text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--text-success)]/10">
                                <FileText className="h-6 w-6 text-[var(--text-success)]" />
                            </div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bill created</h2>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">Print a copy for the customer or continue.</p>

                            <div className="mt-5 flex flex-col gap-2">
                                <PrintBillButton
                                    billId={createdBillId}
                                    label="Print Bill"
                                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--text-link)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                />
                                <button
                                    type="button"
                                    onClick={() => router.push('/billing/all-sales')}
                                    className="rounded-lg border border-[var(--color-bg-tertiary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                                >
                                    Go to bill list
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
