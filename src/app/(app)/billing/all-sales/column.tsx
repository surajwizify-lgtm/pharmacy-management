"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    RotateCcw,
    Eye,
    FileText,
    Trash2,
} from "lucide-react";
import PrintBillButton from "@/components/billing/PrintBillButton";
import { Bill } from "@/types";

export const getColumns = ({
    handleReturnClick,
    openViewBill,
    openInvoicePopup,
    deleteBill,
    deletingId,
}: {
    handleReturnClick: (id: number) => void;
    openViewBill: (id: number) => void;
    openInvoicePopup: (id: number) => void;
    deleteBill: (id: number, billNumber: string) => void;
    deletingId: number | null;
}): ColumnDef<Bill>[] => [
        {
            accessorKey: "billNumber",
            header: "Bill",
            cell: ({ row }) => (
                <Link href={`/billing/${row.original.id}`}>
                    {row.original.billNumber}
                </Link>
            ),
        },

        {
            header: "Customer",
            cell: ({ row }) =>
                row.original.customer?.name ?? "Walk In",
        },

        {
            accessorKey: "billDate",
            header: "Date",
            cell: ({ row }) =>
                new Date(row.original.billDate).toLocaleDateString(),
        },

        {
            accessorKey: "totalAmount",
            header: "Amount",
            cell: ({ row }) => `₹${row.original.totalAmount}`,
        },

        {
            accessorKey: "paymentStatus",
            header: "Status",
        },

        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReturnClick(row.original.id)}
                    >
                        <RotateCcw />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openViewBill(row.original.id)}
                    >
                        <Eye />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openInvoicePopup(row.original.id)}
                    >
                        <FileText />
                    </Button>

                    <PrintBillButton
                        billId={row.original.id}
                        label=""
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === row.original.id}
                        onClick={() =>
                            deleteBill(
                                row.original.id,
                                row.original.billNumber
                            )
                        }
                    >
                        <Trash2 />
                    </Button>
                </div>
            ),
        },
    ];