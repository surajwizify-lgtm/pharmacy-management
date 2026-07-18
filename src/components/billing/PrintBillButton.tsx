"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import BillPrintTemplate, { BillPrintData } from "./BillPrintTemplate";

interface PrintBillButtonProps {
    billId: number;
    label?: string;
    className?: string;
}


interface RawBillItem {
    id: number;
    productId: number;
    product?: { name: string } | null;
    batchNumber?: string | null;
    quantity: number;
    unitPrice: string | number;
    gstPercentage: string | number;
    gstAmount: string | number;
    cgstAmount: string | number;
    sgstAmount: string | number;
    igstAmount: string | number;
    totalAmount: string | number;
}

interface RawBill {
    id: number;
    billNumber: string;
    billDate: string;
    customer?: any;
    ipOp?: string | null;
    doctor?: { name: string } | null;
    hospital?: { name: string } | null;
    isInterState: boolean;
    subtotal: string | number;
    totalCgst: string | number;
    totalSgst: string | number;
    totalIgst?: string | number;
    totalGst: string | number;
    totalAmount: string | number;
    payments?: { method: string }[];
    billItems: RawBillItem[];
    pharmacy?: BillPrintData["pharmacy"];
}

function toBillPrintData(raw: RawBill): BillPrintData {
    return {
        id: raw.id,
        billNumber: raw.billNumber,
        billDate: raw.billDate,
        customer: raw.customer,
        ipOp: raw.ipOp,
        doctorName: raw.doctor?.name ?? null,
        hospitalName: raw.hospital?.name ?? null,
        isInterState: raw.isInterState,
        subtotal: raw.subtotal,
        totalCgst: raw.totalCgst,
        totalSgst: raw.totalSgst,
        totalIgst: raw.totalIgst,
        totalGst: raw.totalGst,
        totalAmount: raw.totalAmount,
        paymentMethod: raw.payments?.[0]?.method ?? null,
        items: (raw.billItems ?? []).map((it) => ({
            id: it.id,
            productName: it.product?.name ?? `Product #${it.productId}`,
            batchNumber: it.batchNumber,
            quantity: it.quantity,
            sellingPrice: it.unitPrice,
            gstPercentage: it.gstPercentage,
            taxableValue: Number(it.totalAmount) - Number(it.gstAmount),
            gstAmount: it.gstAmount,
            totalAmount: it.totalAmount,
        })),
        pharmacy: raw.pharmacy,
    };
}

export default function PrintBillButton({ billId, label = "Print", className }: PrintBillButtonProps) {
    const [bill, setBill] = useState<BillPrintData | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const handleAfterPrint = () => setBill(null);
        window.addEventListener("afterprint", handleAfterPrint);
        return () => window.removeEventListener("afterprint", handleAfterPrint);
    }, []);

    async function handlePrint() {
        setLoading(true);
        try {
            const data = await apiFetch<RawBill>(`/api/bills/${billId}?include=full`);
            setBill(toBillPrintData(data));
            console.log(data)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    window.print();
                });
            });
        } catch (err) {
            console.error("Failed to load bill for printing", err);
            alert("Could not load bill for printing.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={handlePrint}
                disabled={loading}
                className={className ?? "flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                {label}
            </button>
            {bill && typeof document !== "undefined"
                ? createPortal(<BillPrintTemplate bill={bill} />, document.body)
                : null}
        </>
    );
}

