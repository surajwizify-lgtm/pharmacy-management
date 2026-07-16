
// 'use client';

// type GstType = 'INCLUSIVE' | 'EXCLUSIVE';

// interface POLine {
//     productName: string;
//     genericName?: string;
//     manufacturer?: string;
//     quantity: number;
//     expectedRate: number;
//     gstPercentage: number;
//     gstType: GstType;
// }

// interface PurchaseOrderPrintProps {
//     poId: number | string;
//     supplierName: string;
//     createdDate: string;
//     expectedDate?: string;
//     notes?: string;
//     items: POLine[];
//     total: number;
// }

// // per-line helpers, same GST logic used on the "New Purchase Order" page:
// // EXCLUSIVE -> GST added on top of rate. INCLUSIVE -> rate already has GST baked in.
// function lineBase(item: POLine) {
//     return Number(item.quantity) * Number(item.expectedRate);
// }
// function lineGstAmount(item: POLine) {
//     const base = lineBase(item);
//     const gst = Number(item.gstPercentage) || 0;
//     if (item.gstType === 'EXCLUSIVE') {
//         return base * (gst / 100);
//     }
//     return base - base / (1 + gst / 100);
// }
// function lineAmount(item: POLine) {
//     const base = lineBase(item);
//     return item.gstType === 'EXCLUSIVE' ? base + lineGstAmount(item) : base;
// }

// export default function PurchaseOrderPrint({
//     poId,
//     supplierName,
//     createdDate,
//     expectedDate,
//     notes,
//     items,
//     total,
// }: PurchaseOrderPrintProps) {
//     const subtotal = items.reduce((sum, item) => sum + lineBase(item), 0);
//     const totalGst = items.reduce((sum, item) => sum + lineGstAmount(item), 0);
//     const grandTotal = items.reduce((sum, item) => sum + lineAmount(item), 0) || Number(total);

//     return (
//         <div
//             className="bg-white p-8 text-black"
//             style={{
//                 width: '210mm',
//                 minHeight: '297mm',
//                 margin: '0 auto',
//                 fontFamily: 'Arial, sans-serif',
//             }}
//         >
//             {/* Header */}
//             <div className="mb-6 border-b-2 border-black pb-4 text-center">
//                 <h1 className="text-2xl font-bold">
//                     YOUR PHARMACY NAME
//                 </h1>

//                 <p className="text-sm">
//                     Pharmacy Address
//                 </p>

//                 <p className="text-sm">
//                     Phone: +91 XXXXXXXXXX
//                 </p>

//                 <p className="text-sm">
//                     GSTIN: XXXXXXXXXXXXXXX
//                 </p>

//                 <h2 className="mt-4 text-xl font-bold">
//                     PURCHASE ORDER
//                 </h2>
//             </div>

//             {/* Order Details */}
//             <div className="mb-6 flex justify-between text-sm">
//                 <div>
//                     <p>
//                         <strong>PO No:</strong> {poId}
//                     </p>

//                     <p>
//                         <strong>Supplier:</strong> {supplierName}
//                     </p>
//                 </div>

//                 <div className="text-right">
//                     <p>
//                         <strong>Order Date:</strong> {createdDate}
//                     </p>

//                     {expectedDate && (
//                         <p>
//                             <strong>Expected Date:</strong> {expectedDate}
//                         </p>
//                     )}
//                 </div>
//             </div>

//             {/* Notes */}
//             {notes && (
//                 <div className="mb-4 rounded border p-3 text-sm">
//                     <strong>Notes:</strong> {notes}
//                 </div>
//             )}

//             {/* Items */}
//             <table className="w-full border-collapse text-sm">
//                 <thead>
//                     <tr className="border border-black bg-gray-100">
//                         <th className="border border-black p-2">#</th>
//                         <th className="border border-black p-2 text-left">
//                             Product
//                         </th>
//                         <th className="border border-black p-2 text-left">
//                             Generic
//                         </th>
//                         <th className="border border-black p-2 text-left">
//                             Manufacturer
//                         </th>
//                         <th className="border border-black p-2 text-right">
//                             Qty
//                         </th>
//                         <th className="border border-black p-2 text-right">
//                             Rate
//                         </th>
//                         <th className="border border-black p-2 text-right">
//                             GST %
//                         </th>
//                         <th className="border border-black p-2 text-right">
//                             GST Amt
//                         </th>
//                         <th className="border border-black p-2 text-right">
//                             Amount
//                         </th>
//                     </tr>
//                 </thead>

//                 <tbody>
//                     {items.map((item, index) => (
//                         <tr key={index}>
//                             <td className="border border-black p-2 text-center">
//                                 {index + 1}
//                             </td>

//                             <td className="border border-black p-2">
//                                 {item.productName}
//                             </td>

//                             <td className="border border-black p-2">
//                                 {item.genericName || '-'}
//                             </td>

//                             <td className="border border-black p-2">
//                                 {item.manufacturer || '-'}
//                             </td>

//                             <td className="border border-black p-2 text-right">
//                                 {Number(item.quantity)}
//                             </td>

//                             <td className="border border-black p-2 text-right">
//                                 ₹{Number(item.expectedRate).toFixed(2)}
//                             </td>

//                             <td className="border border-black p-2 text-right">
//                                 {Number(item.gstPercentage) || 0}%
//                                 <span className="ml-1 text-[10px] text-gray-600">
//                                     ({item.gstType === 'EXCLUSIVE' ? '+' : 'incl.'})
//                                 </span>
//                             </td>

//                             <td className="border border-black p-2 text-right">
//                                 ₹{lineGstAmount(item).toFixed(2)}
//                             </td>

//                             <td className="border border-black p-2 text-right">
//                                 ₹{lineAmount(item).toFixed(2)}
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>

//             {/* Total */}
//             <div className="mt-6 flex justify-end">
//                 <table className="w-72 border border-black text-sm">
//                     <tbody>
//                         <tr>
//                             <td className="border border-black p-2">
//                                 Subtotal (before GST)
//                             </td>
//                             <td className="border border-black p-2 text-right">
//                                 ₹{subtotal.toFixed(2)}
//                             </td>
//                         </tr>

//                         <tr>
//                             <td className="border border-black p-2">
//                                 Total GST
//                             </td>
//                             <td className="border border-black p-2 text-right">
//                                 ₹{totalGst.toFixed(2)}
//                             </td>
//                         </tr>

//                         <tr>
//                             <td className="border border-black p-2 font-semibold">
//                                 Grand Total
//                             </td>

//                             <td className="border border-black p-2 text-right font-bold">
//                                 ₹{grandTotal.toFixed(2)}
//                             </td>
//                         </tr>
//                     </tbody>
//                 </table>
//             </div>

//             {/* Signature */}
//             <div className="mt-20 flex justify-between text-sm">
//                 <div className="w-56 border-t border-black pt-2 text-center">
//                     Supplier Signature
//                 </div>

//                 <div className="w-56 border-t border-black pt-2 text-center">
//                     Authorized Signatory
//                 </div>
//             </div>
//         </div>
//     );
// }

'use client';

import PrintLayout from "@/components/print/Printlayout";

type GstType = 'INCLUSIVE' | 'EXCLUSIVE';

interface POLine {
    productName: string;
    genericName?: string;
    manufacturer?: string;
    quantity: number;
    expectedRate: number;
    gstPercentage: number;
    gstType: GstType;
}

interface PurchaseOrderPrintProps {
    poId: number | string;
    supplierName: string;
    createdDate: string;
    expectedDate?: string;
    notes?: string;
    items: POLine[];
    total: number;
}

// per-line helpers, same GST logic used on the "New Purchase Order" page:
// EXCLUSIVE -> GST added on top of rate. INCLUSIVE -> rate already has GST baked in.
function lineBase(item: POLine) {
    return Number(item.quantity) * Number(item.expectedRate);
}
function lineGstAmount(item: POLine) {
    const base = lineBase(item);
    const gst = Number(item.gstPercentage) || 0;
    if (item.gstType === 'EXCLUSIVE') {
        return base * (gst / 100);
    }
    return base - base / (1 + gst / 100);
}
function lineAmount(item: POLine) {
    const base = lineBase(item);
    return item.gstType === 'EXCLUSIVE' ? base + lineGstAmount(item) : base;
}

export default function PurchaseOrderPrint({
    poId,
    supplierName,
    createdDate,
    expectedDate,
    notes,
    items,
    total,
}: PurchaseOrderPrintProps) {
    const subtotal = items.reduce((sum, item) => sum + lineBase(item), 0);
    const totalGst = items.reduce((sum, item) => sum + lineGstAmount(item), 0);
    const grandTotal = items.reduce((sum, item) => sum + lineAmount(item), 0) || Number(total);

    return (
        <PrintLayout
            documentTitle="Purchase Order"
            documentNo={String(poId)}
            documentDate={createdDate}
            showSignature={false}
        >
            {/* Order Details */}
            <div className="mb-6 flex justify-between text-sm">
                <div>
                    <p>
                        <strong>PO No:</strong> {poId}
                    </p>

                    <p>
                        <strong>Supplier:</strong> {supplierName}
                    </p>
                </div>

                <div className="text-right">
                    <p>
                        <strong>Order Date:</strong> {createdDate}
                    </p>

                    {expectedDate && (
                        <p>
                            <strong>Expected Date:</strong> {expectedDate}
                        </p>
                    )}
                </div>
            </div>

            {/* Notes */}
            {notes && (
                <div className="mb-4 rounded border p-3 text-sm">
                    <strong>Notes:</strong> {notes}
                </div>
            )}

            {/* Items */}
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border border-black bg-gray-100">
                        <th className="border border-black p-2">#</th>
                        <th className="border border-black p-2 text-left">Product</th>
                        <th className="border border-black p-2 text-left">Generic</th>
                        <th className="border border-black p-2 text-left">Manufacturer</th>
                        <th className="border border-black p-2 text-right">Qty</th>
                        <th className="border border-black p-2 text-right">Rate</th>
                        <th className="border border-black p-2 text-right">GST %</th>
                        <th className="border border-black p-2 text-right">GST Amt</th>
                        <th className="border border-black p-2 text-right">Amount</th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="border border-black p-2 text-center">{index + 1}</td>
                            <td className="border border-black p-2">{item.productName}</td>
                            <td className="border border-black p-2">{item.genericName || '-'}</td>
                            <td className="border border-black p-2">{item.manufacturer || '-'}</td>
                            <td className="border border-black p-2 text-right">{Number(item.quantity)}</td>
                            <td className="border border-black p-2 text-right">₹{Number(item.expectedRate).toFixed(2)}</td>
                            <td className="border border-black p-2 text-right">
                                {Number(item.gstPercentage) || 0}%
                                <span className="ml-1 text-[10px] text-gray-600">
                                    ({item.gstType === 'EXCLUSIVE' ? '+' : 'incl.'})
                                </span>
                            </td>
                            <td className="border border-black p-2 text-right">₹{lineGstAmount(item).toFixed(2)}</td>
                            <td className="border border-black p-2 text-right">₹{lineAmount(item).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Total */}
            <div className="mt-6 flex justify-end">
                <table className="w-72 border border-black text-sm">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2">Subtotal (before GST)</td>
                            <td className="border border-black p-2 text-right">₹{subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2">Total GST</td>
                            <td className="border border-black p-2 text-right">₹{totalGst.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-semibold">Grand Total</td>
                            <td className="border border-black p-2 text-right font-bold">₹{grandTotal.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Signature — two parties, so kept local instead of PrintLayout's single-signature footer */}
            <div className="mt-20 flex justify-between text-sm">
                <div className="w-56 border-t border-black pt-2 text-center">
                    Supplier Signature
                </div>

                <div className="w-56 border-t border-black pt-2 text-center">
                    Authorized Signatory
                </div>
            </div>
        </PrintLayout>
    );
}