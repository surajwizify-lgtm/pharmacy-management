"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, User, Mail, Phone, MapPin, Receipt, Flag } from "lucide-react";

export default function EditSupplierPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [form, setForm] = useState({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        gstNumber: "",
        status: "ACTIVE",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;

        fetch(`/api/suppliers/${id}`)
            .then(async (res) => {
                if (!res.ok) throw new Error("Supplier not found");
                return res.json();
            })
            .then((data) => {
                setForm({
                    name: data.name || "",
                    contactPerson: data.contactPerson || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    gstNumber: data.gstNumber || "",
                    status: data.status || "ACTIVE",
                });
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.name.trim()) {
            setError("Supplier name is required");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/suppliers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to update supplier");
            }

            router.push(`/purchase-orders/suppliers/${id}`);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
                <div className="card h-96 animate-pulse p-6" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link
                    href={`/purchase-orders/suppliers/${id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to details
                </Link>
                <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
                    <Building2 className="h-6 w-6 text-brand-600" />
                    Edit Supplier
                </h1>
                <p className="text-sm text-slate-500">{form.name}</p>
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

                <div>
                    <label className="label !flex items-center gap-1.5">
                        <Flag className="h-3.5 w-3.5" /> Status
                    </label>
                    <div className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, status: "ACTIVE" }))}
                            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${form.status === "ACTIVE" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, status: "INACTIVE" }))}
                            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${form.status === "INACTIVE" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Inactive
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button type="submit" disabled={saving} className="btn-primary">
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                    <Link
                        href={`/purchase-orders/suppliers/${id}`}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}