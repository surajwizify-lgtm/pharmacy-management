import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const body = await req.json();
    // body: { supplierId, purchaseOrderId?, returnNumber, reason, items: [{ batchId, productId, quantity, unitPrice }] }

    if (!body.items?.length) {
        return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Validate stock and lock in totals first
            const preparedItems = [];
            for (const it of body.items) {
                const batch = await tx.batch.findUnique({ where: { id: it.batchId } });
                if (!batch) throw new Error(`Batch ${it.batchId} not found`);
                if (batch.quantityAvailable < it.quantity) {
                    throw new Error(
                        `Cannot return ${it.quantity} units — only ${batch.quantityAvailable} available in batch ${batch.batchNumber}`
                    );
                }
                preparedItems.push({
                    batchId: it.batchId,
                    productId: it.productId,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    totalPrice: it.quantity * it.unitPrice,
                });
            }

            const totalAmount = preparedItems.reduce((sum, i) => sum + i.totalPrice, 0);

            const supplierReturn = await tx.supplierReturn.create({
                data: {
                    returnNumber: body.returnNumber,
                    supplierId: body.supplierId,
                    purchaseOrderId: body.purchaseOrderId || null,
                    reason: body.reason || null,
                    totalAmount,
                    items: { create: preparedItems },
                },
                include: { items: true },
            });

            // Deduct stock for each returned batch
            for (const it of preparedItems) {
                await tx.batch.update({
                    where: { id: it.batchId },
                    data: { quantityAvailable: { decrement: it.quantity } },
                });
            }

            return supplierReturn;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to create supplier return' }, { status: 500 });
    }
}

// export async function GET() {
//     // const returns = await prisma.supplierReturn.findMany({
//     //     include: {
//     //         supplier: true,
//     //         purchaseOrder: true,
//     //         items: { include: { product: true, batch: true } },
//     //     },
//     //     orderBy: { createdAt: 'desc' },
//     // });
//     const returns = await prisma.supplierReturn.findMany({
//         // include: {
//         //     // supplier: true,
//         //     // purchaseInvoice: true,
//         //     // items: {
//         //     //     include: {
//         //     //         product: true,
//         //     //         batch: true,
//         //     //     },
//         //     // },
//         // },
//         // orderBy: {
//         //     createdAt: "desc",
//         // },
//     });
//     return NextResponse.json(returns);
// }
// export async function GET() {
//     const returns = await prisma.supplierReturn.findMany({
//         include: {
//             supplier: true,
//             purchaseInvoice: true,
//             items: {
//                 include: {
//                     product: true,
//                     batch: true,
//                 },
//             },
//         },
//         orderBy: {
//             createdAt: "desc",
//         },
//     });

//     return NextResponse.json({
//         items: returns,
//     });
// }

export async function GET() {
    const returns = await prisma.supplierReturn.findMany({
        include: {
            supplier: true,

            purchaseInvoice: {
                include: {
                    purchaseOrder: true,
                },
            },

            items: {
                include: {
                    product: true,
                    batch: true,
                },
            },
        },

        orderBy: {
            createdAt: "desc",
        },
    });

    return NextResponse.json(returns);
}