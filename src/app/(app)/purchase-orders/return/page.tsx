'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, RotateCcw } from 'lucide-react';
import { SupplierReturnRow } from '@/components/purchase-orders/SupplierReturnRow';
import PageHeader from '@/components/common/Header';
import HeaderButton from '@/components/common/HeaderButton';

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
        <div className="">
            <PageHeader
                header={`Supplier Returns`}
                subheader="Goods returned to suppliers and their refunds."
            >
                <HeaderButton text="New Return" href='/purchase-orders/suppliers/new' />
            </PageHeader>

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