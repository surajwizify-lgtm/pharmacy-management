'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, RotateCcw } from 'lucide-react';
import { SupplierReturnRow } from '@/components/purchase-orders/SupplierReturnRow';

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

interface SupplierReturn {
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

export default function SupplierReturnsPage() {
    const [returns, setReturns] = useState<SupplierReturn[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/supplier-returns')
            .then((res) => res.json())
            .then((data) => {
                setReturns(data);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-6 space-y-6">

            <div className="flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 to-indigo-700 px-6 py-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-overlay-white">
                        <RotateCcw className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Supplier Returns</h1>
                        <p className="text-sm text-primary-100">Goods returned to suppliers and their refunds.</p>
                    </div>
                </div>

                <Link
                    href="/purchase-orders/return/new"
                    className="flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
                >
                    <Plus className="h-4 w-4" />
                    New Return
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-sm text-neutral-400">
                    Loading returns…
                </div>
            ) : returns.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-16 text-neutral-400">
                    <RotateCcw className="mb-2 h-8 w-8" />
                    <p className="text-sm">No supplier returns found.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {returns.map((ret) => (
                        <SupplierReturnRow key={ret.id} ret={ret} />
                    ))}
                </div>
            )}
        </div>
    );
}