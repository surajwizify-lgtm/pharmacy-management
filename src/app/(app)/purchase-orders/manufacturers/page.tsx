import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma, SupplierStatus } from "@prisma/client";
import DeleteManufacturerButton from "@/components/DeleteManufacturerButton";

export const dynamic = "force-dynamic";

export default async function ManufacturerListPage({
    searchParams,
}: {
    searchParams: { search?: string; status?: string };
}) {
    const search = searchParams.search?.trim() || "";
    const status = searchParams.status as SupplierStatus | undefined;

    const where: Prisma.ManufacturerWhereInput = {
        ...(status === "ACTIVE" || status === "INACTIVE" ? { status } : {}),
        ...(search
            ? {
                OR: [
                    { name: { contains: search } },
                    { contactPerson: { contains: search } },
                    { phone: { contains: search } },
                    { email: { contains: search } },
                ],
            }
            : {}),
    };

    const manufacturers = await prisma.manufacturer.findMany({
        where,
        orderBy: { name: "asc" },
    });

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold">Manufacturers</h1>
                <Link
                    href="/purchase-orders/manufacturers/new"
                    className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
                >
                    + New Manufacturer
                </Link>
            </div>

            <form className="flex gap-3 mb-4" method="get">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search name, contact, phone, email..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <select
                    name="status"
                    defaultValue={status || ""}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
                <button
                    type="submit"
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                    Filter
                </button>
            </form>

            <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">Name</th>
                            <th className="px-4 py-2 font-medium">Contact Person</th>
                            <th className="px-4 py-2 font-medium">Phone</th>
                            <th className="px-4 py-2 font-medium">Email</th>
                            <th className="px-4 py-2 font-medium">Status</th>
                            <th className="px-4 py-2 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {manufacturers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                    No manufacturers found.
                                </td>
                            </tr>
                        )}
                        {manufacturers.map((m) => (
                            <tr key={m.id} className="border-t">
                                <td className="px-4 py-2">{m.name}</td>
                                <td className="px-4 py-2">{m.contactPerson || "-"}</td>
                                <td className="px-4 py-2">{m.phone || "-"}</td>
                                <td className="px-4 py-2">{m.email || "-"}</td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`inline-block rounded-full px-2 py-0.5 text-xs ${m.status === "ACTIVE"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {m.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-right space-x-3">
                                    <Link
                                        href={`/purchase-orders/manufacturer/${m.id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Edit
                                    </Link>
                                    <DeleteManufacturerButton id={m.id} name={m.name} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
