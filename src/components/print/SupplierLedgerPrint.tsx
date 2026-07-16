// interface SupplierLedgerPrintProps {
//     supplier: any;
//     totalPOAmount: number;
//     totalPaid: number;
//     totalReturns: number;
//     balanceDue: number;
// }

// export default function SupplierLedgerPrint({
//     supplier,
//     totalPOAmount,
//     totalPaid,
//     totalReturns,
//     balanceDue,
// }: SupplierLedgerPrintProps) {
//     return (
//         <div
//             className="bg-white p-8 text-black"
//             style={{
//                 width: "210mm",
//                 minHeight: "297mm",
//                 margin: "0 auto",
//             }}
//         >
//             <h1 className="text-2xl font-bold text-center">
//                 Supplier Ledger
//             </h1>

//             <hr className="my-5" />

//             <h2 className="text-lg font-bold">{supplier.name}</h2>

//             <p>Contact: {supplier.contactPerson}</p>

//             <p>Phone: {supplier.phone}</p>

//             <p>Email: {supplier.email}</p>

//             <p>GSTIN: {supplier.gstin}</p>

//             <p>Drug License: {supplier.drugLicenseNo}</p>

//             <br />

//             <table className="w-full border text-sm">
//                 <tbody>
//                     <tr>
//                         <td className="border p-2">Total Purchase</td>
//                         <td className="border p-2">
//                             ₹{totalPOAmount.toFixed(2)}
//                         </td>
//                     </tr>

//                     <tr>
//                         <td className="border p-2">Total Paid</td>
//                         <td className="border p-2">
//                             ₹{totalPaid.toFixed(2)}
//                         </td>
//                     </tr>

//                     <tr>
//                         <td className="border p-2">Returns</td>
//                         <td className="border p-2">
//                             ₹{totalReturns.toFixed(2)}
//                         </td>
//                     </tr>

//                     <tr>
//                         <td className="border p-2 font-bold">
//                             Balance Due
//                         </td>

//                         <td className="border p-2 font-bold">
//                             ₹{balanceDue.toFixed(2)}
//                         </td>
//                     </tr>
//                 </tbody>
//             </table>

//             <h3 className="mt-8 font-bold text-lg">
//                 Purchase Invoices
//             </h3>

//             <table className="w-full border-collapse mt-2 text-sm">
//                 <thead>
//                     <tr>
//                         <th className="border p-2">Invoice</th>
//                         <th className="border p-2">Date</th>
//                         <th className="border p-2">Status</th>
//                         <th className="border p-2">Amount</th>
//                     </tr>
//                 </thead>

//                 <tbody>
//                     {supplier.purchaseInvoices.map((invoice: any) => (
//                         <tr key={invoice.id}>
//                             <td className="border p-2">
//                                 {invoice.invoiceNumber}
//                             </td>

//                             <td className="border p-2">
//                                 {new Date(invoice.invoiceDate).toLocaleDateString()}
//                             </td>

//                             <td className="border p-2">
//                                 {invoice.paymentStatus}
//                             </td>

//                             <td className="border p-2 text-right">
//                                 ₹{Number(invoice.totalAmount).toFixed(2)}
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// }
import PrintLayout from "@/components/print/Printlayout";

interface SupplierLedgerPrintProps {
    supplier: any;
    totalPOAmount: number;
    totalPaid: number;
    totalReturns: number;
    balanceDue: number;
}

export default function SupplierLedgerPrint({
    supplier,
    totalPOAmount,
    totalPaid,
    totalReturns,
    balanceDue,
}: SupplierLedgerPrintProps) {
    return (
        <PrintLayout
            documentTitle="Supplier Ledger"
            documentNo={supplier.name}
        >
            <h2 className="text-lg font-bold">{supplier.name}</h2>

            <p>Contact: {supplier.contactPerson}</p>
            <p>Phone: {supplier.phone}</p>
            <p>Email: {supplier.email}</p>
            <p>GSTIN: {supplier.gstin}</p>
            <p>Drug License: {supplier.drugLicenseNo}</p>

            <br />

            <table className="w-full border text-sm">
                <tbody>
                    <tr>
                        <td className="border p-2">Total Purchase</td>
                        <td className="border p-2">₹{totalPOAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td className="border p-2">Total Paid</td>
                        <td className="border p-2">₹{totalPaid.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td className="border p-2">Returns</td>
                        <td className="border p-2">₹{totalReturns.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td className="border p-2 font-bold">Balance Due</td>
                        <td className="border p-2 font-bold">₹{balanceDue.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <h3 className="mt-8 font-bold text-lg">Purchase Invoices</h3>

            <table className="w-full border-collapse mt-2 text-sm">
                <thead>
                    <tr>
                        <th className="border p-2">Invoice</th>
                        <th className="border p-2">Date</th>
                        <th className="border p-2">Status</th>
                        <th className="border p-2">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {supplier.purchaseInvoices.map((invoice: any) => (
                        <tr key={invoice.id}>
                            <td className="border p-2">{invoice.invoiceNumber}</td>
                            <td className="border p-2">
                                {new Date(invoice.invoiceDate).toLocaleDateString()}
                            </td>
                            <td className="border p-2">{invoice.paymentStatus}</td>
                            <td className="border p-2 text-right">
                                ₹{Number(invoice.totalAmount).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </PrintLayout>
    );
}