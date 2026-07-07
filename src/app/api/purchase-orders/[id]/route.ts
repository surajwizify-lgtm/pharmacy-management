// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//     const po = await prisma.purchaseOrder.findUnique({
//         where: { id: Number(params.id) },
//         include: {
//             supplier: true,
//             items: { include: { product: true, batch: true } },
//             payments: true,
//         },
//     });

//     if (!po) {
//         return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
//     }

//     return NextResponse.json(po);
// }

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//     const body = await req.json();

//     try {
//         const po = await prisma.purchaseOrder.update({
//             where: { id: Number(params.id) },
//             data: {
//                 poNumber: body.poNumber,
//                 expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
//                 status: body.status,
//             },
//         });
//         return NextResponse.json(po);
//     } catch (err: any) {
//         return NextResponse.json({ error: err.message || 'Failed to update purchase order' }, { status: 500 });
//     }
// }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const po = await prisma.purchaseOrder.findUnique({
        where: { id: Number(params.id) },
        include: {
            supplier: true,
            items: { include: { product: true } },
            purchaseInvoices: { include: { items: true, payments: true } },
        },
    });
    if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    return NextResponse.json(po);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    try {
        const po = await prisma.purchaseOrder.update({
            where: { id: Number(params.id) },
            data: {
                poNumber: body.poNumber,
                expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
                notes: body.notes,
                status: body.status,
            },
        });
        return NextResponse.json(po);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to update purchase order' }, { status: 500 });
    }
}