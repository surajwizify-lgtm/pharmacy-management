'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { apiFetch } from '@/lib/api-client';
import PrintButton from '@/components/common/PrintButton';
import PurchaseOrderPrint from '@/components/print/PurchaseOrderPrint';

interface PurchaseOrderPrintButtonProps {
    poId: number;
    className?: string;
}

export default function PurchaseOrderPrintButton({
    poId,
    className,
}: PurchaseOrderPrintButtonProps) {
    const [printPO, setPrintPO] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        const handleAfterPrint = () => setPrintPO(null);
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, []);

    async function handlePrint() {
        try {
            setLoading(true);
            const po = await apiFetch<any>(`/api/purchase-orders/${poId}`);
            setPrintPO(po);
        } catch (error) {
            console.error(error);
            alert('Unable to load purchase order.');
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!printPO) return;
        const timer = setTimeout(() => {
            window.print();
            setLoading(false);
        }, 150);
        return () => clearTimeout(timer);
    }, [printPO]);

    return (
        <>
            <PrintButton
                onClick={handlePrint}
                className={`no-print ${className ?? ''}`}
            >
                {loading ? 'Loading...' : ' Print'}
            </PrintButton>

            {mounted && printPO && createPortal(
                <PurchaseOrderPrint
                    poId={printPO.poNumber}
                    supplierName={printPO.supplier.name}
                    createdDate={new Date(printPO.orderDate).toLocaleDateString()}
                    expectedDate={
                        printPO.expectedDate
                            ? new Date(printPO.expectedDate).toLocaleDateString()
                            : undefined
                    }
                    notes={printPO.notes}
                    items={printPO.items.map((item: any) => ({
                        productName: item.product.name,
                        genericName: item.product.genericName,
                        manufacturer: item.product.manufacturer,
                        quantity: Number(item.quantity),
                        expectedRate: Number(item.expectedRate),
                        gstPercentage: Number(
                            item.gstPercentage ?? item.product?.gstPercentage ?? 0
                        ),
                        gstType: item.gstType ?? item.product?.gstType ?? 'INCLUSIVE',
                    }))}
                    total={printPO.items.reduce(
                        (sum: number, item: any) =>
                            sum + Number(item.quantity) * Number(item.expectedRate),
                        0
                    )}
                />,
                document.body
            )}
        </>
    );
}