"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CreatePurchaseOrderModal from '@/components/CreatePurchaseOrderModal';
import PageHeader from "@/components/common/Header";
import HeaderButton from "@/components/common/HeaderButton";
import Container from "@/components/common/Container";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function SuppliersPage() {

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [showCreatePO, setShowCreatePO] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);


    function openCreatePurchaseOrder(supplier: any) {
        setSelectedSupplier(supplier);
        setShowCreatePO(true);
    }

    useEffect(() => {
        fetch("/api/suppliers")
            .then((res) => res.json())
            .then(setSuppliers);
    }, []);

    return (
        <div className="">
            <PageHeader
                header={`Suppliers`}
                subheader="Manage All Supplier Here"
            >
                <HeaderButton text="Add Supplier" href='/purchase-orders/suppliers/new' />
            </PageHeader>
            <Container >
                <Table className="table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    No suppliers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell>
                                        <div>{s.name}</div>
                                        <div>{s.contactPerson || "-"}</div>
                                    </TableCell>

                                    <TableCell>
                                        {s.email || "-"}
                                    </TableCell>

                                    <TableCell>
                                        {s.phone || "-"}
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => openCreatePurchaseOrder(s)}
                                            >
                                                Create Purchase Order
                                            </Button>

                                            <Button variant="outline" >
                                                <Link href={`/purchase-orders/suppliers/${s.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Container>
            <CreatePurchaseOrderModal
                open={showCreatePO}
                supplier={selectedSupplier}
                onClose={() => {
                    setShowCreatePO(false);
                    setSelectedSupplier(null);
                }}
                onSuccess={() => {
                    setShowCreatePO(false);
                    setSelectedSupplier(null);

                    // optional if you want to refresh suppliers
                    fetch("/api/suppliers")
                        .then((res) => res.json())
                        .then(setSuppliers);
                }}
            />
        </div >
    );
}