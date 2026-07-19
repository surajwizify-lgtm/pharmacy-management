
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const body = await req.json();

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