// interface BillPrintItem {
//     id: number;
//     productName: string;
//     batchNumber?: string | null;
//     quantity: number;
//     sellingPrice: string | number;
//     gstPercentage: string | number;
//     taxableValue: string | number;
//     gstAmount: string | number;
//     totalAmount: string | number;
// }

// export interface BillPrintData {
//     id: number;
//     billNumber: string;
//     billDate: string;
//     customerName?: string | null;
//     customerPhone?: string | null;
//     customerGstin?: string | null;
//     ipOp?: string | null;
//     doctorName?: string | null;
//     hospitalName?: string | null;
//     isInterState: boolean;
//     subtotal: string | number;
//     totalCgst: string | number;
//     totalSgst: string | number;
//     totalIgst?: string | number;
//     totalGst: string | number;
//     totalAmount: string | number;
//     paymentMethod?: string | null;
//     items: BillPrintItem[];
//     pharmacy?: {
//         name: string;
//         address?: string | null;
//         phone?: string | null;
//         gstin?: string | null;
//     };
// }

// export default function BillPrintTemplate({ bill }: { bill: BillPrintData | null | undefined }) {
//     const fmt = (n: string | number) => Number(n).toFixed(2);

//     // Keep this wrapped in the same hidden/print classes as the real template
//     // so it doesn't silently vanish (and doesn't leak onto the screen either).
//     if (!bill) {
//         return (
//             <div id="bill-print-area" className="hidden print:block bg-white text-black p-6 text-sm">
//                 <p>Preparing bill for print…</p>
//             </div>
//         );
//     }

//     const items = bill.items ?? [];
//     // console.log("BillPrintTemplate: bill", bill);

//     return (
//         <div id="bill-print-area" className="hidden print:block bg-white text-black p-6 text-sm">
//             <div className="flex items-start justify-between border-b border-black pb-3 mb-3">
//                 <div>
//                     <h1 className="text-lg font-bold">{bill.pharmacy?.name ?? "Pharmacy"}</h1>
//                     {bill.pharmacy?.address && <p className="text-xs">{bill.pharmacy.address}</p>}
//                     {bill.pharmacy?.phone && <p className="text-xs">Ph: {bill.pharmacy.phone}</p>}
//                     {bill.pharmacy?.gstin && <p className="text-xs">GSTIN: {bill.pharmacy.gstin}</p>}
//                 </div>
//                 <div className="text-right text-xs">
//                     <p className="font-semibold text-sm">Invoice #{bill.billNumber}</p>
//                     <p>{new Date(bill.billDate).toLocaleDateString("en-IN")}</p>
//                 </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
//                 <div>
//                     <p className="font-semibold">Bill To</p>
//                     <p>{bill.customerName || "Walk-in Customer"}</p>
//                     <p>{`IP/OP: ${bill.ipOp}`}</p>
//                     {bill.customerPhone && <p>{bill.customerPhone}</p>}
//                     {bill.customerGstin && <p>GSTIN: {bill.customerGstin}</p>}
//                 </div>
//                 <div>
//                     {bill.doctorName && <p><span className="font-semibold">Doctor:</span> {bill.doctorName}</p>}
//                     {bill.hospitalName && <p><span className="font-semibold">Hospital:</span> {bill.hospitalName}</p>}
//                     <p><span className="font-semibold">Supply type:</span> {bill.isInterState ? "Inter-state" : "Intra-state"}</p>
//                 </div>
//             </div>

//             <table className="w-full border-collapse text-xs mb-3">
//                 <thead>
//                     <tr className="border-y border-black">
//                         <th className="text-left py-1">Item</th>
//                         <th className="text-right py-1">Qty</th>
//                         <th className="text-right py-1">Rate</th>
//                         <th className="text-right py-1">GST%</th>
//                         <th className="text-right py-1">Taxable</th>
//                         <th className="text-right py-1">GST Amt</th>
//                         <th className="text-right py-1">Total</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {items.length === 0 ? (
//                         <tr>
//                             <td colSpan={7} className="py-2 text-center text-neutral-500">
//                                 No items on this bill.
//                             </td>
//                         </tr>
//                     ) : (
//                         items.map((it) => (
//                             <tr key={it.id} className="border-b border-neutral-300">
//                                 <td className="py-1">{it.productName}{it.batchNumber ? ` (${it.batchNumber})` : ""}</td>
//                                 <td className="text-right py-1">{it.quantity}</td>
//                                 <td className="text-right py-1">₹{fmt(it.sellingPrice)}</td>
//                                 <td className="text-right py-1">{it.gstPercentage}%</td>
//                                 <td className="text-right py-1">₹{fmt(it.taxableValue)}</td>
//                                 <td className="text-right py-1">₹{fmt(it.gstAmount)}</td>
//                                 <td className="text-right py-1">₹{fmt(it.totalAmount)}</td>
//                             </tr>
//                         ))
//                     )}
//                 </tbody>
//             </table>

//             <div className="flex justify-end">
//                 <div className="w-64 text-xs">
//                     <div className="flex justify-between py-0.5">
//                         <span>Subtotal</span><span>₹{fmt(bill.subtotal)}</span>
//                     </div>
//                     {bill.isInterState ? (
//                         <div className="flex justify-between py-0.5">
//                             <span>IGST</span><span>₹{fmt(bill.totalIgst ?? bill.totalGst)}</span>
//                         </div>
//                     ) : (
//                         <>
//                             <div className="flex justify-between py-0.5">
//                                 <span>CGST</span><span>₹{fmt(bill.totalCgst)}</span>
//                             </div>
//                             <div className="flex justify-between py-0.5">
//                                 <span>SGST</span><span>₹{fmt(bill.totalSgst)}</span>
//                             </div>
//                         </>
//                     )}
//                     <div className="flex justify-between border-t border-black mt-1 pt-1 font-bold text-sm">
//                         <span>Total</span><span>₹{fmt(bill.totalAmount)}</span>
//                     </div>
//                     {bill.paymentMethod && (
//                         <div className="flex justify-between py-0.5 text-neutral-600">
//                             <span>Paid via</span><span>{bill.paymentMethod}</span>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             <p className="mt-6 text-center text-[10px] text-neutral-500">
//                 This is a computer-generated invoice.
//             </p>
//         </div>
//     );
// }

import PrintLayout from "@/components/print/Printlayout";

interface BillPrintItem {
    id: number;
    productName: string;
    batchNumber?: string | null;
    quantity: number;
    sellingPrice: string | number;
    gstPercentage: string | number;
    taxableValue: string | number;
    gstAmount: string | number;
    totalAmount: string | number;
}

export interface BillPrintData {
    id: number;
    billNumber: string;
    billDate: string;
    customerName?: string | null;
    customerPhone?: string | null;
    customerGstin?: string | null;
    ipOp?: string | null;
    doctorName?: string | null;
    hospitalName?: string | null;
    isInterState: boolean;
    subtotal: string | number;
    totalCgst: string | number;
    totalSgst: string | number;
    totalIgst?: string | number;
    totalGst: string | number;
    totalAmount: string | number;
    paymentMethod?: string | null;
    items: BillPrintItem[];
    pharmacy?: {
        name: string;
        address?: string | null;
        phone?: string | null;
        gstin?: string | null;
    };
}

export default function BillPrintTemplate({ bill }: { bill: BillPrintData | null | undefined }) {
    const fmt = (n: string | number) => Number(n).toFixed(2);

    if (!bill) return null; // parent already guards on `bill` before portaling, so this never renders

    const items = bill.items ?? [];

    return (
        <PrintLayout
            documentTitle="Invoice"
            documentNo={bill.billNumber}
            documentDate={new Date(bill.billDate).toLocaleDateString("en-IN")}
            pharmacy={{
                name: bill.pharmacy?.name ?? "Pharmacy",
                address: bill.pharmacy?.address ?? undefined,
                phone: bill.pharmacy?.phone ?? undefined,
                gstNo: bill.pharmacy?.gstin ?? undefined,
            }}
        >
            <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                <div>
                    <p className="font-semibold">Bill To</p>
                    <p>{bill.customerName || "Walk-in Customer"}</p>
                    <p>{`IP/OP: ${bill.ipOp}`}</p>
                    {bill.customerPhone && <p>{bill.customerPhone}</p>}
                    {bill.customerGstin && <p>GSTIN: {bill.customerGstin}</p>}
                </div>
                <div>
                    {bill.doctorName && <p><span className="font-semibold">Doctor:</span> {bill.doctorName}</p>}
                    {bill.hospitalName && <p><span className="font-semibold">Hospital:</span> {bill.hospitalName}</p>}
                    <p><span className="font-semibold">Supply type:</span> {bill.isInterState ? "Inter-state" : "Intra-state"}</p>
                </div>
            </div>

            <table className="w-full border-collapse text-xs mb-3">
                <thead>
                    <tr className="border-y border-black">
                        <th className="text-left py-1">Item</th>
                        <th className="text-right py-1">Qty</th>
                        <th className="text-right py-1">Rate</th>
                        <th className="text-right py-1">GST%</th>
                        <th className="text-right py-1">Taxable</th>
                        <th className="text-right py-1">GST Amt</th>
                        <th className="text-right py-1">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-2 text-center text-neutral-500">
                                No items on this bill.
                            </td>
                        </tr>
                    ) : (
                        items.map((it) => (
                            <tr key={it.id} className="border-b border-neutral-300">
                                <td className="py-1">{it.productName}{it.batchNumber ? ` (${it.batchNumber})` : ""}</td>
                                <td className="text-right py-1">{it.quantity}</td>
                                <td className="text-right py-1">₹{fmt(it.sellingPrice)}</td>
                                <td className="text-right py-1">{it.gstPercentage}%</td>
                                <td className="text-right py-1">₹{fmt(it.taxableValue)}</td>
                                <td className="text-right py-1">₹{fmt(it.gstAmount)}</td>
                                <td className="text-right py-1">₹{fmt(it.totalAmount)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-64 text-xs">
                    <div className="flex justify-between py-0.5">
                        <span>Subtotal</span><span>₹{fmt(bill.subtotal)}</span>
                    </div>
                    {bill.isInterState ? (
                        <div className="flex justify-between py-0.5">
                            <span>IGST</span><span>₹{fmt(bill.totalIgst ?? bill.totalGst)}</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between py-0.5">
                                <span>CGST</span><span>₹{fmt(bill.totalCgst)}</span>
                            </div>
                            <div className="flex justify-between py-0.5">
                                <span>SGST</span><span>₹{fmt(bill.totalSgst)}</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between border-t border-black mt-1 pt-1 font-bold text-sm">
                        <span>Total</span><span>₹{fmt(bill.totalAmount)}</span>
                    </div>
                    {bill.paymentMethod && (
                        <div className="flex justify-between py-0.5 text-neutral-600">
                            <span>Paid via</span><span>{bill.paymentMethod}</span>
                        </div>
                    )}
                </div>
            </div>
        </PrintLayout>
    );
}