"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 max-w-xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Edit Supplier</h1>
                <Link href={`/purchase-orders/suppliers/${id}`} className="text-blue-600">Back to details</Link>
            </div>

            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Supplier Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Contact Person</label>
                    <input
                        type="text"
                        name="contactPerson"
                        value={form.contactPerson}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <textarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                        rows={3}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">GST Number</label>
                    <input
                        type="text"
                        name="gstNumber"
                        value={form.gstNumber}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                    >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <Link href={`/purchase-orders/suppliers/${id}`} className="border px-4 py-2 rounded">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}