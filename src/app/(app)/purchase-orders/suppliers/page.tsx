"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Building2,
    Search,
    Plus,
    Phone,
    Mail,
} from "lucide-react";

const STATUS_OPTIONS = ["ALL", "ACTIVE", "INACTIVE"] as const;

function statusBadgeClass(status: string) {
    return status === "ACTIVE"
        ? "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200"
        : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200";
}

function statusDotClass(status: string) {
    return status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400";
}

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

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Design-only additions — filter the already-fetched list client-side.
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");

    useEffect(() => {
        setLoading(true);
        fetch("/api/suppliers")
            .then((res) => res.json())
            .then(setSuppliers)
            .finally(() => setLoading(false));
    }, []);

    const filteredSuppliers = suppliers.filter((s) => {
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            s.name?.toLowerCase().includes(q) ||
            s.phone?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const activeCount = suppliers.filter((s) => s.status === "ACTIVE").length;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                        <Building2 className="h-6 w-6 text-brand-600" />
                        Suppliers
                    </h1>
                    <p className="text-sm text-slate-500">Vendors you purchase stock from.</p>
                </div>
                <Link
                    href="/purchase-orders/suppliers/new"
                    className="btn-primary inline-flex items-center gap-2 shadow-sm shadow-brand-600/20"
                >
                    <Plus className="h-4 w-4" />
                    Add Supplier
                </Link>
            </div>

            {/* Stat chips */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                        <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Total suppliers</p>
                        <p className="text-lg font-semibold text-slate-900">{suppliers.length}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Active</p>
                        <p className="text-lg font-semibold text-slate-900">{activeCount}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar + table */}
            <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
                    <h2 className="flex items-center gap-2 font-medium text-slate-800">
                        <Building2 className="h-4 w-4 text-brand-600" />
                        All Suppliers
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {filteredSuppliers.length}
                        </span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                className="input w-56 pl-8 text-sm"
                                placeholder="Search name, phone, or email…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="input w-auto text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s === "ALL" ? "All statuses" : s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Contact</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-3" colSpan={4}>
                                            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-10">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Building2 className="mb-2 h-8 w-8" />
                                            <p className="text-sm">No suppliers found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((s) => (
                                    <tr key={s.id} className="group transition-colors hover:bg-slate-50/70">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarColor(s.name)}`}
                                                >
                                                    {initials(s.name)}
                                                </span>
                                                <span className="font-medium text-slate-800">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-slate-600">
                                            {s.phone ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                    {s.phone}
                                                </span>
                                            ) : s.email ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                    {s.email}
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(s.status)}`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(s.status)}`} />
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Link
                                                href={`/purchase-orders/suppliers/${s.id}`}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 opacity-70 transition-opacity hover:bg-brand-50 group-hover:opacity-100"
                                            >
                                                View
                                            </Link>
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