import Link from "next/link";
import ManufacturerForm from "@/components/ManufacturerForm";
import { ArrowLeft, Factory } from "lucide-react";

export default function NewManufacturerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/purchase-orders/manufacturers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to manufacturers
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <Factory className="h-6 w-6 text-brand-600" />
          New Manufacturer
        </h1>
        <p className="text-sm text-slate-500">Add a company that manufactures the products you stock.</p>
      </div>

      <div className="card p-6">
        <ManufacturerForm />
      </div>
    </div>
  );
}