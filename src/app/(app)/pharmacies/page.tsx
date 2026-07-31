"use client";

import { useEffect, useState } from "react";
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

export default function PharmaciesTable() {
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const fetchPharmacies = async () => {
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
        };

        fetchPharmacies();
    }, []);

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

        </div>
    );
}