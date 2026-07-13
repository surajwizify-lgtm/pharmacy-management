// src/components/purchase-orders/SupplierReturnRow.tsx
'use client';

import { Building2, FileText, Package, Calendar, IndianRupee, RotateCcw } from 'lucide-react';

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

const REFUND_TYPE_STYLES: Record<string, string> = {
    CREDIT_NOTE: 'bg-primary-100 text-primary-700',
    REPLACEMENT: 'bg-secondary-100 text-secondary-700',
    CASH_REFUND: 'bg-amber-100 text-amber-700',
};

function refundTypeBadgeClass(type: string) {
    return REFUND_TYPE_STYLES[type] ?? 'bg-neutral-100 text-neutral-600';
}

function formatRefundType(type: string) {
    return type.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function SupplierReturnRow({ ret }: { ret: SupplierReturn }) {
    return (
        <div className="card flex items-center gap-4 px-4 py-3 transition-shadow hover:shadow-md">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                <RotateCcw className="h-4.5 w-4.5 text-primary-600" />
            </div>

            {/* Return number + refund type */}
            <div className="w-36 shrink-0">
                <p className="truncate font-mono text-sm font-semibold text-neutral-800">{ret.returnNumber}</p>
                <span className={`badge mt-1 ${refundTypeBadgeClass(ret.refundType)}`}>
                    {formatRefundType(ret.refundType)}
                </span>
            </div>

            {/* Supplier */}
            <div className="hidden min-w-0 flex-1 items-start gap-2 sm:flex">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <div className="min-w-0">
                    <p className="text-xs text-neutral-400">Supplier</p>
                    <p className="truncate text-sm font-medium text-neutral-800">{ret.supplier?.name ?? '—'}</p>
                </div>
            </div>

            {/* Invoice / GRN */}
            <div className="hidden min-w-0 flex-1 items-start gap-2 lg:flex">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <div className="min-w-0">
                    <p className="text-xs text-neutral-400">Invoice / GRN</p>
                    <p className="truncate text-sm font-medium text-neutral-800">
                        {ret.purchaseInvoice?.invoiceNumber ?? ret.purchaseInvoice?.grnNumber ?? '—'}
                    </p>
                </div>
            </div>

            {/* Reason */}
            {ret.reason ? (
                <div className="hidden max-w-[180px] shrink-0 truncate rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800 xl:block">
                    {ret.reason}
                </div>
            ) : (
                <div className="hidden w-[180px] shrink-0 xl:block" />
            )}

            {/* Items + date */}
            <div className="hidden shrink-0 flex-col gap-1 text-neutral-500 sm:flex">
                <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    <span className="text-xs">{ret.items.length} item{ret.items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-xs">{new Date(ret.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Amount */}
            <div className="ml-auto shrink-0 text-right">
                <p className="text-xs text-neutral-400">GST ₹{Number(ret.totalGst).toFixed(2)}</p>
                <p className="flex items-center justify-end gap-0.5 text-lg font-bold text-secondary-700">
                    <IndianRupee className="h-4 w-4" />
                    {Number(ret.totalAmount).toFixed(2)}
                </p>
            </div>
        </div>
    );
}