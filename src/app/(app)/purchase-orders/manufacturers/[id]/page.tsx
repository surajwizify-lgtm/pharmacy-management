import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ManufacturerForm from "@/components/ManufacturerForm";
import { ArrowLeft, Factory } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditManufacturerPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return notFound();

  const manufacturer = await prisma.manufacturer.findUnique({ where: { id } });
  if (!manufacturer) return notFound();

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
          Edit Manufacturer
        </h1>
        <p className="text-sm text-slate-500">{manufacturer.name}</p>
      </div>

      <div className="card p-6">
        <ManufacturerForm
          initialValues={{
            id: manufacturer.id,
            name: manufacturer.name,
            contactPerson: manufacturer.contactPerson || "",
            phone: manufacturer.phone || "",
            email: manufacturer.email || "",
            address: manufacturer.address || "",
            gstin: manufacturer.gstin || "",
            drugLicenseNo: manufacturer.drugLicenseNo || "",
            status: manufacturer.status,
          }}
        />
      </div>
    </div>
  );
}