// 'use client';

// interface GstBreakdown {
//     cgst: number;
//     sgst: number;
//     igst: number;
//     taxableValue: number;
// }

// interface FilingPeriod {
//     id: number;
//     periodStart: string;
//     periodEnd: string;
//     totalOutputGst: number;
//     totalInputGst: number;
//     netPayable: number;
//     amountPaid: number;
//     filed: boolean;
//     filedAt: string | null;
// }

// interface GstSummaryPrintProps {
//     from: string;
//     to: string;

//     totalOutputGst: number;
//     totalInputGst: number;
//     netPayable: number;

//     output: GstBreakdown;
//     input: GstBreakdown;

//     periods: FilingPeriod[];
// }

// const money = (n: number) =>
//     new Intl.NumberFormat("en-IN", {
//         style: "currency",
//         currency: "INR",
//     }).format(n);

// export default function GstSummaryPrint({
//     from,
//     to,
//     totalOutputGst,
//     totalInputGst,
//     netPayable,
//     output,
//     input,
//     periods,
// }: GstSummaryPrintProps) {
//     return (
//         <div
//             className="bg-white text-black p-8"
//             style={{
//                 width: "210mm",
//                 minHeight: "297mm",
//                 margin: "0 auto",
//                 fontFamily: "Arial, sans-serif",
//             }}
//         >
//             {/* Header */}

//             <div className="text-center border-b-2 border-black pb-4 mb-6">
//                 <h1 className="text-2xl font-bold">
//                     YOUR PHARMACY NAME
//                 </h1>

//                 <p>GST SUMMARY REPORT</p>

//                 <p className="text-sm mt-2">
//                     Period: <strong>{from}</strong> to{" "}
//                     <strong>{to}</strong>
//                 </p>
//             </div>

//             {/* Summary */}

//             <table className="w-full border border-black text-sm mb-8">
//                 <tbody>
//                     <tr>
//                         <td className="border border-black p-2 font-semibold">
//                             Total Output GST
//                         </td>

//                         <td className="border border-black p-2 text-right">
//                             {money(totalOutputGst)}
//                         </td>
//                     </tr>

//                     <tr>
//                         <td className="border border-black p-2 font-semibold">
//                             Total Input GST
//                         </td>

//                         <td className="border border-black p-2 text-right">
//                             {money(totalInputGst)}
//                         </td>
//                     </tr>

//                     <tr>
//                         <td className="border border-black p-2 font-bold">
//                             Net GST Payable
//                         </td>

//                         <td className="border border-black p-2 text-right font-bold">
//                             {money(netPayable)}
//                         </td>
//                     </tr>
//                 </tbody>
//             </table>

//             {/* GST Breakdown */}

//             <div className="grid grid-cols-2 gap-6 mb-8">

//                 <div>
//                     <h2 className="font-bold mb-2">
//                         Output GST (Sales)
//                     </h2>

//                     <table className="w-full border border-black text-sm">
//                         <tbody>
//                             <Row label="Taxable Value" value={output.taxableValue} />
//                             <Row label="CGST" value={output.cgst} />
//                             <Row label="SGST" value={output.sgst} />
//                             <Row label="IGST" value={output.igst} />
//                         </tbody>
//                     </table>
//                 </div>

//                 <div>
//                     <h2 className="font-bold mb-2">
//                         Input GST (Purchases)
//                     </h2>

//                     <table className="w-full border border-black text-sm">
//                         <tbody>
//                             <Row label="Taxable Value" value={input.taxableValue} />
//                             <Row label="CGST" value={input.cgst} />
//                             <Row label="SGST" value={input.sgst} />
//                             <Row label="IGST" value={input.igst} />
//                         </tbody>
//                     </table>
//                 </div>

//             </div>

//             {/* Filing History */}

//             <h2 className="font-bold text-lg mb-3">
//                 GST Filing History
//             </h2>

//             <table className="w-full border-collapse text-sm">

//                 <thead>

//                     <tr className="bg-gray-100">

//                         <th className="border border-black p-2">
//                             Period
//                         </th>

//                         <th className="border border-black p-2">
//                             Output
//                         </th>

//                         <th className="border border-black p-2">
//                             Input
//                         </th>

//                         <th className="border border-black p-2">
//                             Net
//                         </th>

//                         <th className="border border-black p-2">
//                             Paid
//                         </th>

//                         <th className="border border-black p-2">
//                             Status
//                         </th>

//                     </tr>

//                 </thead>

//                 <tbody>

//                     {periods.map((p) => (

//                         <tr key={p.id}>

//                             <td className="border border-black p-2">
//                                 {p.periodStart.slice(0, 10)} - {p.periodEnd.slice(0, 10)}
//                             </td>

//                             <td className="border border-black p-2 text-right">
//                                 {money(p.totalOutputGst)}
//                             </td>

//                             <td className="border border-black p-2 text-right">
//                                 {money(p.totalInputGst)}
//                             </td>

//                             <td className="border border-black p-2 text-right">
//                                 {money(p.netPayable)}
//                             </td>

//                             <td className="border border-black p-2 text-right">
//                                 {money(p.amountPaid)}
//                             </td>

//                             <td className="border border-black p-2 text-center">
//                                 {p.filed ? "Filed" : "Pending"}
//                             </td>

//                         </tr>

//                     ))}

//                 </tbody>

//             </table>

//             <div className="mt-20 flex justify-end">

//                 <div className="w-56 border-t border-black pt-2 text-center">
//                     Authorized Signatory
//                 </div>

//             </div>
//         </div>
//     );
// }

// function Row({
//     label,
//     value,
// }: {
//     label: string;
//     value: number;
// }) {
//     return (
//         <tr>
//             <td className="border border-black p-2">
//                 {label}
//             </td>

//             <td className="border border-black p-2 text-right">
//                 {money(value)}
//             </td>
//         </tr>
//     );
// }

'use client';

import PrintLayout from "@/components/print/Printlayout";

interface GstBreakdown {
    cgst: number;
    sgst: number;
    igst: number;
    taxableValue: number;
}

interface FilingPeriod {
    id: number;
    periodStart: string;
    periodEnd: string;
    totalOutputGst: number;
    totalInputGst: number;
    netPayable: number;
    amountPaid: number;
    filed: boolean;
    filedAt: string | null;
}

interface GstSummaryPrintProps {
    from: string;
    to: string;

    totalOutputGst: number;
    totalInputGst: number;
    netPayable: number;

    output: GstBreakdown;
    input: GstBreakdown;

    periods: FilingPeriod[];
}

const money = (n: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(n);

export default function GstSummaryPrint({
    from,
    to,
    totalOutputGst,
    totalInputGst,
    netPayable,
    output,
    input,
    periods,
}: GstSummaryPrintProps) {
    return (
        <PrintLayout
            documentTitle="GST Summary Report"
            documentDate={`${from} to ${to}`}
            showSignature={true}
        >
            {/* Summary */}
            <table className="w-full border border-black text-sm mb-8">
                <tbody>
                    <tr>
                        <td className="border border-black p-2 font-semibold">
                            Total Output GST
                        </td>
                        <td className="border border-black p-2 text-right">
                            {money(totalOutputGst)}
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2 font-semibold">
                            Total Input GST
                        </td>
                        <td className="border border-black p-2 text-right">
                            {money(totalInputGst)}
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2 font-bold">
                            Net GST Payable
                        </td>
                        <td className="border border-black p-2 text-right font-bold">
                            {money(netPayable)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* GST Breakdown */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                    <h2 className="font-bold mb-2">Output GST (Sales)</h2>
                    <table className="w-full border border-black text-sm">
                        <tbody>
                            <Row label="Taxable Value" value={output.taxableValue} />
                            <Row label="CGST" value={output.cgst} />
                            <Row label="SGST" value={output.sgst} />
                            <Row label="IGST" value={output.igst} />
                        </tbody>
                    </table>
                </div>

                <div>
                    <h2 className="font-bold mb-2">Input GST (Purchases)</h2>
                    <table className="w-full border border-black text-sm">
                        <tbody>
                            <Row label="Taxable Value" value={input.taxableValue} />
                            <Row label="CGST" value={input.cgst} />
                            <Row label="SGST" value={input.sgst} />
                            <Row label="IGST" value={input.igst} />
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Filing History */}
            <h2 className="font-bold text-lg mb-3">GST Filing History</h2>
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2">Period</th>
                        <th className="border border-black p-2">Output</th>
                        <th className="border border-black p-2">Input</th>
                        <th className="border border-black p-2">Net</th>
                        <th className="border border-black p-2">Paid</th>
                        <th className="border border-black p-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {periods.map((p) => (
                        <tr key={p.id}>
                            <td className="border border-black p-2">
                                {p.periodStart.slice(0, 10)} - {p.periodEnd.slice(0, 10)}
                            </td>
                            <td className="border border-black p-2 text-right">
                                {money(p.totalOutputGst)}
                            </td>
                            <td className="border border-black p-2 text-right">
                                {money(p.totalInputGst)}
                            </td>
                            <td className="border border-black p-2 text-right">
                                {money(p.netPayable)}
                            </td>
                            <td className="border border-black p-2 text-right">
                                {money(p.amountPaid)}
                            </td>
                            <td className="border border-black p-2 text-center">
                                {p.filed ? "Filed" : "Pending"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </PrintLayout>
    );
}

function Row({ label, value }: { label: string; value: number }) {
    return (
        <tr>
            <td className="border border-black p-2">{label}</td>
            <td className="border border-black p-2 text-right">{money(value)}</td>
        </tr>
    );
}