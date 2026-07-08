import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma, SupplierStatus } from "@prisma/client";
import DeleteManufacturerButton from "@/components/DeleteManufacturerButton";
import { Factory, Search, Plus, Phone, Mail, User } from "lucide-react";

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

  const activeCount = manufacturers.filter((m) => m.status === "ACTIVE").length;

  function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "?";
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }

  const AVATAR_COLORS = [
    "bg-brand-100 text-brand-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700",
    "bg-teal-100 text-teal-700",
  ];

  function avatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Factory className="h-6 w-6 text-brand-600" />
            Manufacturers
          </h1>
          <p className="text-sm text-slate-500">Companies that manufacture the products you stock.</p>
        </div>
        <Link
          href="/purchase-orders/manufacturers/new"
          className="btn-primary inline-flex items-center gap-2 shadow-sm shadow-brand-600/20"
        >
          <Plus className="h-4 w-4" />
          New Manufacturer
        </Link>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <Factory className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Total manufacturers</p>
            <p className="text-lg font-semibold text-slate-900">{manufacturers.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Factory className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Active</p>
            <p className="text-lg font-semibold text-slate-900">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar + table */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <form className="flex flex-wrap items-center gap-2" method="get">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search name, contact, phone, email…"
                className="input w-full pl-8 text-sm"
              />
            </div>
            <select name="status" defaultValue={status || ""} className="input w-auto text-sm">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Filter
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Contact person</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {manufacturers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Factory className="mb-2 h-8 w-8" />
                      <p className="text-sm">No manufacturers found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                manufacturers.map((m) => (
                  <tr key={m.id} className="group transition-colors hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarColor(m.name)}`}
                        >
                          {initials(m.name)}
                        </span>
                        <span className="font-medium text-slate-800">{m.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">
                      {m.contactPerson ? (
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {m.contactPerson}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      {m.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {m.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      {m.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {m.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                            : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${m.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                        <Link
                          href={`/purchase-orders/manufacturer/${m.id}`}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
                        >
                          Edit
                        </Link>
                        <DeleteManufacturerButton id={m.id} name={m.name} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}