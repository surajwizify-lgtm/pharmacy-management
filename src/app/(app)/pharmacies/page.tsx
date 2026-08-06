"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/common/Header";
import HeaderButton from "@/components/common/HeaderButton";
import Container from "@/components/common/Container";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Pharmacy {
    id: number;
    name: string;
    gstin: string;
    phone: string | null;
    address: string | null;
    _count?: {
        users: number;
        products: number;
    };
}

const EMPTY_FORM = { name: "", gstin: "", phone: "", address: "" };

export default function PharmaciesTable() {
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function fetchPharmacies() {
        setLoading(true);
        try {
            const res = await fetch("/api/pharmacies");
            if (!res.ok) throw new Error("Failed to fetch pharmacies");
            const data = await res.json();
            setPharmacies(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPharmacies();
    }, []);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        setFormError(null);
        try {
            const res = await fetch("/api/pharmacies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error ?? "Failed to create pharmacy");
            }

            setShowForm(false);
            setForm(EMPTY_FORM);
            fetchPharmacies();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    if (error) {
        return <p className="text-sm text-red-500">{error}</p>;
    }

    return (
        <div className="rounded-md border">
            <PageHeader
                header={`Pharmacies`}
                subheader="Manage all pharmaries(add, delete, edit, view)"
            >
                <HeaderButton text=" Add Pharmacy" onClick={() => setShowForm(true)} />
            </PageHeader>

            <Container>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]">ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>GSTIN</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right">Users</TableHead>
                            <TableHead className="text-right">Products</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : pharmacies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                    No pharmacies found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pharmacies.map((pharmacy) => (
                                <TableRow key={pharmacy.id}>
                                    <TableCell className="font-medium">{pharmacy.id}</TableCell>
                                    <TableCell>{pharmacy.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{pharmacy.gstin}</Badge>
                                    </TableCell>
                                    <TableCell>{pharmacy.phone ?? "—"}</TableCell>
                                    <TableCell className="max-w-[220px] truncate">
                                        {pharmacy.address ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {pharmacy._count?.users ?? 0}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {pharmacy._count?.products ?? 0}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Container>

            {showForm && (
                <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
                    <Card className="bg-bg-primary w-full max-w-xl p-6">
                        <h2 className="mb-4 text-lg font-semibold text-slate-800">Add pharmacy</h2>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Pharmacy name</Label>
                                <Input
                                    id="name"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="gstin">GSTIN</Label>
                                <Input
                                    id="gstin"
                                    required
                                    value={form.gstin}
                                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                />
                            </div>

                            {formError && <p className="text-sm text-red-600">{formError}</p>}

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setShowForm(false);
                                        setForm(EMPTY_FORM);
                                        setFormError(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}