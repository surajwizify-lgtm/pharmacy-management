import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ManufacturerForm from "@/components/ManufacturerForm";

export const dynamic = "force-dynamic";

export default async function EditManufacturerPage({ params }: { params: { id: string } }) {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) return notFound();

    const manufacturer = await prisma.manufacturer.findUnique({ where: { id } });
    if (!manufacturer) return notFound();

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-xl font-semibold mb-6">Edit Manufacturer</h1>
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
    );
}
