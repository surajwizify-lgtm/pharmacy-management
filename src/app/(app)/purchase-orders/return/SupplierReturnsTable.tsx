// app/purchase-orders/return/SupplierReturnsTable.tsx
'use client';

import { RotateCcw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';

interface Supplier {
    id: number;
    name: string;
}

interface PurchaseInvoice {
    id: number;
    invoiceNumber?: string;
    grnNumber?: string;
}

interface SupplierReturnItem {
    id: number;
    supplierReturnId: number;
    batchId: number;
}

export interface SupplierReturn {
    id: number;
    returnNumber: string;
    supplierId: number;
    supplier: Supplier;
    purchaseInvoiceId: number | null;
    purchaseInvoice: PurchaseInvoice | null;
    reason: string | null;
    refundType: string;
    totalAmount: string;
    totalGst: string;
    createdAt: string;
    items: SupplierReturnItem[];
}

const columns: ColumnDef<SupplierReturn>[] = [
    {
        accessorKey: 'returnNumber',
        header: 'Return #',
    },
    {
        id: 'supplier',
        header: 'Supplier',
        accessorFn: (row) => row.supplier.name,
    },
    {
        id: 'invoice',
        header: 'Invoice',
        accessorFn: (row) => row.purchaseInvoice?.invoiceNumber ?? '',
        cell: ({ row }) => <span>{row.original.purchaseInvoice?.invoiceNumber}</span>,
    },
    {
        id: 'refundType',
        header: 'Refund Type',
        accessorFn: (row) => row.refundType,
        cell: ({ row }) => (
            <span className="capitalize">{row.original.refundType.replace('_', ' ')}</span>
        ),
    },
    {
        id: 'reason',
        header: 'Reason',
        accessorFn: (row) => row.reason ?? '-',
    },
    {
        id: 'totalAmount',
        header: 'Amount',
        accessorFn: (row) => Number(row.totalAmount),
        cell: ({ row }) => <span>₹{Number(row.original.totalAmount).toFixed(2)}</span>,
    },
    {
        id: 'totalGst',
        header: 'GST',
        accessorFn: (row) => Number(row.totalGst),
        cell: ({ row }) => <span>₹{Number(row.original.totalGst).toFixed(2)}</span>,
    },
    {
        id: 'createdAt',
        header: 'Date',
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => <span>{new Date(row.original.createdAt).toLocaleDateString()}</span>,
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: () => (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                    View
                </Button>
                <Button variant="outline" size="sm">
                    Print
                </Button>
            </div>
        ),
    },
];

export default function SupplierReturnsTable({ data }: { data: SupplierReturn[] }) {


    return <DataTable columns={columns} data={data} />;
}