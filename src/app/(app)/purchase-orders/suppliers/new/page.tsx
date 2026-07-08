"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, User, Mail, Phone, MapPin, Receipt } from "lucide-react";

export default function NewSupplierPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        gstNumber: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.name.trim()) {
            setError("Supplier name is required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to create supplier");
            }

            const supplier = await res.json();
            router.push(`/purchase-orders/suppliers/${supplier.id}`);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link
                    href="/purchase-orders/suppliers"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to suppliers
                </Link>
                <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
                    <Building2 className="h-6 w-6 text-brand-600" />
                    Add Supplier
                </h1>
                <p className="text-sm text-slate-500">Add a vendor you purchase stock from.</p>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="card space-y-4 p-6">
                <div>
                    <label className="label !flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" /> Supplier name <span className="text-red-500">*</span>
                    </label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} className="input" required />
                </div>

                <div>
                    <label className="label !flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Contact person
                    </label>
                    <input
                        type="text"
                        name="contactPerson"
                        value={form.contactPerson}
                        onChange={handleChange}
                        className="input"
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label className="label !flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> Email
                        </label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} className="input" />
                    </div>
                    <div>
                        <label className="label !flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> Phone
                        </label>
                        <input type="text" name="phone" value={form.phone} onChange={handleChange} className="input" />
                    </div>
                </div>

                <div>
                    <label className="label !flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Address
                    </label>
                    <textarea name="address" value={form.address} onChange={handleChange} className="input resize-y" rows={3} />
                </div>

                <div>
                    <label className="label !flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5" /> GST number
                    </label>
                    <input
                        type="text"
                        name="gstNumber"
                        value={form.gstNumber}
                        onChange={handleChange}
                        className="input uppercase"
                    />
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? "Saving…" : "Save supplier"}
                    </button>
                    <Link
                        href="/purchase-orders/suppliers"
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}