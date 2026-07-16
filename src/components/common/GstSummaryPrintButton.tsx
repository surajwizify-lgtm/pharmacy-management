"use client";

import PrintButton from "@/components/common/PrintButton";
import { useEffect, useState } from "react";
import GstSummaryPrint from "../print/GstSummaryPrint";

type GstSummaryPrintButtonProps = {
    className?: string;
    summary: any,
    periods: any,
};

export default function GstSummaryPrintButton({
    summary,
    periods,
    className = "",
}: GstSummaryPrintButtonProps) {
    const [showPrint, setShowPrint] = useState(false);
    const [loading, setLoading] = useState(false);




    // useEffect(() => {
    //     const handleAfterPrint = () => setPrintPO(null);
    //     window.addEventListener('afterprint', handleAfterPrint);
    //     return () => window.removeEventListener('afterprint', handleAfterPrint);
    // }, []);

    async function handlePrint() {
        try {
            setLoading(true);
            // const po = await apiFetch<any>(`/api/purchase-orders/${poId}`);
            // setPrintPO(po);
            window.print();
            setLoading(false);
        } catch (error) {
            console.error(error);
            alert('Unable to load purchase order.');
            setLoading(false);
        }
    }


    // useEffect(() => {
    //     if (!printPO) return;

    //     // wait for the print-area DOM to actually paint before printing
    //     const timer = setTimeout(() => {
    //         window.print();
    //         setLoading(false);
    //     }, 150);

    //     return () => clearTimeout(timer);
    // }, [printPO]);

    return (
        <div>
            <PrintButton
                onClick={handlePrint}
                className={`no-print ${className}`}
            >
                🖨️ Print GST Summary
            </PrintButton>
            {showPrint && summary && (
                <div className="print-area">
                    <GstSummaryPrint
                        from={summary.from}
                        to={summary.to}
                        totalOutputGst={summary.totalOutputGst}
                        totalInputGst={summary.totalInputGst}
                        netPayable={summary.netPayable}
                        output={summary.breakdown.output}
                        input={summary.breakdown.input}
                        periods={periods}
                    />
                </div>
            )}
        </div>

    );
}