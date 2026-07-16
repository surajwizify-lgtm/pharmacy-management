// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// export async function POST(req: NextRequest) {
//     const body = await req.json();
//     // body: { supplierId, poNumber, expectedDate, items: [{ productId, quantity, unitPrice, batchNumber, expiryDate, sellingPrice, location }] }

//     if (!body.items?.length) {
//         return NextResponse.json({ error: 'At least one product is required' }, { status: 400 });
//     }

//     try {
//         const result = await prisma.$transaction(async (tx) => {
//             const totalAmount = body.items.reduce(
//                 (sum: number, it: any) => sum + it.quantity * it.unitPrice,
//                 0
//             );

//             const po = await tx.purchaseOrder.create({
//                 data: {
//                     poNumber: body.poNumber,
//                     supplierId: body.supplierId,
//                     expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
//                     totalAmount,
//                     status: 'RECEIVED',
//                 },
//             });

//             const items = [];
//             for (const it of body.items) {
//                 // 1. create the batch (adds real stock to inventory)
//                 const batch = await tx.batch.create({
//                     data: {
//                         productId: it.productId,
//                         batchNumber: it.batchNumber,
//                         expiryDate: new Date(it.expiryDate),
//                         purchasePrice: it.unitPrice,
//                         sellingPrice: it.sellingPrice,
//                         quantityAvailable: it.quantity,
//                         location: it.location || null,
//                     },
//                 });

//                 // 2. create the PO line item, linked to that batch
//                 const item = await tx.purchaseOrderItem.create({
//                     data: {
//                         purchaseOrderId: po.id,
//                         productId: it.productId,
//                         quantity: it.quantity,
//                         unitPrice: it.unitPrice,
//                         totalPrice: it.quantity * it.unitPrice,
//                         batchNumber: it.batchNumber,
//                         expiryDate: new Date(it.expiryDate),
//                         sellingPrice: it.sellingPrice,
//                         location: it.location || null,
//                         batchId: batch.id,
//                     },
//                 });
//                 items.push(item);
//             }

//             return { ...po, items };
//         });

//         return NextResponse.json(result, { status: 201 });
//     } catch (err: any) {
//         return NextResponse.json({ error: err.message || 'Failed to create purchase order' }, { status: 500 });
//     }
// }

// export async function GET() {
//     const orders = await prisma.purchaseOrder.findMany({
//         include: {
//             supplier: true,
//             items: { include: { product: true, batch: true } },
//         },
//         orderBy: { createdAt: 'desc' },
//     });
//     return NextResponse.json(orders);
// }
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const body = await req.json();
    // body: { supplierId, poNumber, expectedDate, notes, items: [{ productId, quantity, expectedRate }] }

    if (!body.items?.length) {
        return NextResponse.json({ error: 'Add at least one product' }, { status: 400 });
    }

    try {
        const lastPO = await prisma.purchaseOrder.findFirst({
            orderBy: {
                id: 'desc',
            },
        });

        const nextNumber = (lastPO?.id ?? 0) + 1;

        const poNumber = `PO-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`;
        const po = await prisma.purchaseOrder.create({
            data: {
                poNumber: poNumber,
                supplierId: body.supplierId,
                expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
                notes: body.notes || null,
                status: 'SENT',
                items: {
                    create: body.items.map((it: any) => ({
                        productId: it.productId,
                        quantity: it.quantity,
                        expectedRate: it.expectedRate,
                    })),
                },
            },
            include: { items: { include: { product: true } } },
        });

        return NextResponse.json(po, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to create purchase order' }, { status: 500 });
    }
}

export async function GET() {
    const orders = await prisma.purchaseOrder.findMany({
        include: {
            supplier: true,
            items: { include: { product: true } },
            purchaseInvoices: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
}