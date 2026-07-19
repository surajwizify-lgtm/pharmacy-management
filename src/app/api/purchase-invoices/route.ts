
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGstLedgerEntry } from '@/lib/gst-ledger';

export async function GET() {
    const invoices = await prisma.purchaseInvoice.findMany({
        include: { supplier: true, payments: true },
        orderBy: { createdAt: 'desc' },
    });
    const result = invoices.map((invoice) => {
        const totalPaid = invoice.payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
        );

        const remainingAmount = Number(invoice.totalAmount) - totalPaid;

        return {
            ...invoice,
            remainingAmount,
        };
    });

    return NextResponse.json(result);
}

// export async function POST(req: NextRequest) {
//     const body = await req.json();

//     if (!body.supplierId || !body.invoiceNumber || !body.items?.length) {
//         return NextResponse.json(
//             { error: 'supplierId, invoiceNumber, and items are required' },
//             { status: 400 }
//         );
//     }

//     try {
//         const result = await prisma.$transaction(async (tx) => {
//             const preparedItems = [];

//             for (const it of body.items) {
//                 console.log(it.location)
//                 const batch = await tx.batch.create({
//                     data: {
//                         productId: it.productId,
//                         batchNumber: it.batchNumber,
//                         manufactureDate: it.manufactureDate ? new Date(it.manufactureDate) : null,
//                         expiryDate: new Date(it.expiryDate),
//                         purchasePrice: it.purchaseRate,
//                         mrp: it.mrp,
//                         sellingPrice: it.sellingPrice,
//                         quantityAvailable: it.quantity + (it.freeQuantity || 0),
//                     },
//                 });

//                 const discountPercent = it.discountPercent || 0;
//                 const gross = it.quantity * it.purchaseRate;
//                 const discountAmount = gross * (discountPercent / 100);
//                 const taxableValue = Math.round((gross - discountAmount) * 100) / 100;

//                 const gstAmount = Math.round(taxableValue * (it.gstPercentage / 100) * 100) / 100;
//                 const cgstAmount = body.isInterState ? 0 : Math.round((gstAmount / 2) * 100) / 100;
//                 const sgstAmount = body.isInterState ? 0 : Math.round((gstAmount / 2) * 100) / 100;
//                 const igstAmount = body.isInterState ? gstAmount : 0;

//                 const totalAmount = Math.round((taxableValue + gstAmount) * 100) / 100;

//                 preparedItems.push({
//                     productId: it.productId,
//                     batchNumber: it.batchNumber,
//                     manufactureDate: it.manufactureDate ? new Date(it.manufactureDate) : null,
//                     expiryDate: new Date(it.expiryDate),
//                     quantity: it.quantity,
//                     freeQuantity: it.freeQuantity || 0,
//                     purchaseRate: it.purchaseRate,
//                     mrp: it.mrp,
//                     sellingPrice: it.sellingPrice,
//                     discountPercent,
//                     hsnCode: it.hsnCode,
//                     gstPercentage: it.gstPercentage,
//                     cgstAmount,
//                     sgstAmount,
//                     igstAmount,
//                     taxableValue,
//                     totalAmount,
//                     batchId: batch.id,
//                     _gross: gross,
//                     _discountAmount: discountAmount,
//                     _gstAmount: gstAmount,
//                 });
//             }
//             const subtotal = preparedItems.reduce((sum, i) => sum + i._gross, 0);
//             const totalDiscount = preparedItems.reduce((sum, i) => sum + i._discountAmount, 0);
//             const totalCgst = preparedItems.reduce((sum, i) => sum + i.cgstAmount, 0);
//             const totalSgst = preparedItems.reduce((sum, i) => sum + i.sgstAmount, 0);
//             const totalIgst = preparedItems.reduce((sum, i) => sum + i.igstAmount, 0);
//             const totalGst = preparedItems.reduce((sum, i) => sum + i._gstAmount, 0);
//             const totalAmount = preparedItems.reduce((sum, i) => sum + i.totalAmount, 0);

//             const invoiceCount = await tx.purchaseInvoice.count();
//             const grnNumber = `GRN-${String(invoiceCount + 1).padStart(6, '0')}`;

//             const itemsToCreate = preparedItems.map(({ _gross, _discountAmount, _gstAmount, ...rest }) => rest);

//             const invoice = await tx.purchaseInvoice.create({
//                 data: {
//                     invoiceNumber: body.invoiceNumber,
//                     grnNumber,
//                     supplierId: body.supplierId,
//                     purchaseOrderId: body.purchaseOrderId || null,
//                     isInterState: !!body.isInterState,
//                     subtotal: Math.round(subtotal * 100) / 100,
//                     totalDiscount: Math.round(totalDiscount * 100) / 100,
//                     totalCgst: Math.round(totalCgst * 100) / 100,
//                     totalSgst: Math.round(totalSgst * 100) / 100,
//                     totalIgst: Math.round(totalIgst * 100) / 100,
//                     totalGst: Math.round(totalGst * 100) / 100,
//                     totalAmount: Math.round(totalAmount * 100) / 100,
//                     items: { create: itemsToCreate },
//                 },
//                 include: { items: true },
//             });

//             await createGstLedgerEntry(tx, {
//                 type: 'INPUT',
//                 taxableValue: Number(invoice.subtotal) - Number(invoice.totalDiscount),
//                 cgstAmount: Number(invoice.totalCgst),
//                 sgstAmount: Number(invoice.totalSgst),
//                 igstAmount: Number(invoice.totalIgst),
//                 totalGst: Number(invoice.totalGst),
//                 purchaseInvoiceId: invoice.id,
//             });
//             if (body.purchaseOrderId) {
//                 await tx.purchaseOrder.update({
//                     where: { id: body.purchaseOrderId },
//                     data: { status: 'RECEIVED' },
//                 });
//             }

//             return invoice;
//         });

//         return NextResponse.json(result, { status: 201 });
//     } catch (err: any) {
//         return NextResponse.json(
//             { error: err.message || 'Failed to create purchase invoice' },
//             { status: 500 }
//         );
//     }
// }