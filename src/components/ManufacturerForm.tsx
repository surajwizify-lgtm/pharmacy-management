"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Factory, User, Phone, Mail, MapPin, Receipt, ShieldCheck, Flag } from "lucide-react";

export type ManufacturerFormValues = {
  id?: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  drugLicenseNo: string;
  status: "ACTIVE" | "INACTIVE";
};

const emptyValues: ManufacturerFormValues = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  drugLicenseNo: "",
  status: "ACTIVE",
};

export default function ManufacturerForm({
  initialValues,
}: {
  initialValues?: ManufacturerFormValues;
}) {
  const router = useRouter();
  const isEdit = !!initialValues?.id;
  const [values, setValues] = useState<ManufacturerFormValues>(initialValues || emptyValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/purchase-orders/manufacturers/${values.id}`
        : `/api/purchase-orders/manufacturers`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Something went wrong");
      }

      router.push("/purchase-orders/manufacturers");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Identity */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Factory className="h-4 w-4 text-brand-600" />
          Manufacturer details
        </h3>
        <div>
          <label className="label">
            Name <span className="text-red-500">*</span>
          </label>
          <input name="name" value={values.name} onChange={handleChange} required className="input" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label !flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Contact person
            </label>
            <input name="contactPerson" value={values.contactPerson} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label !flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Phone
            </label>
            <input name="phone" value={values.phone} onChange={handleChange} className="input" />
          </div>
        </div>

        <div>
          <label className="label !flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Email
          </label>
          <input type="email" name="email" value={values.email} onChange={handleChange} className="input" />
        </div>

        <div>
          <label className="label !flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Address
          </label>
          <textarea name="address" value={values.address} onChange={handleChange} rows={2} className="input resize-y" />
        </div>
      </div>

      {/* Compliance */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <ShieldCheck className="h-4 w-4 text-brand-600" />
          Compliance
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label !flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5" /> GSTIN
            </label>
            <input name="gstin" value={values.gstin} onChange={handleChange} className="input uppercase" />
          </div>
          <div>
            <label className="label !flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Drug license no.
            </label>
            <input name="drugLicenseNo" value={values.drugLicenseNo} onChange={handleChange} className="input" />
          </div>
        </div>

        <div>
          <label className="label !flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5" /> Status
          </label>
          <div className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setValues((v) => ({ ...v, status: "ACTIVE" }))}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${values.status === "ACTIVE" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setValues((v) => ({ ...v, status: "INACTIVE" }))}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${values.status === "INACTIVE" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-slate-100 pt-4">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create manufacturer"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/purchase-orders/manufacturers")}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}