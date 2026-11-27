import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pharmacyId = session.user.pharmacyId;
    if (!pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy associated with this user' }, { status: 400 });
    }

    const body = await req.json();

    if (!body.items?.length) {
        return NextResponse.json({ error: 'Add at least one product' }, { status: 400 });
    }

    try {
        // verify supplier belongs to this pharmacy
        const supplier = await prisma.supplier.findUnique({ where: { id: body.supplierId } });
        if (!supplier || supplier.pharmacyId !== pharmacyId) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        // verify every product belongs to this pharmacy
        const productIds = [...new Set(body.items.map((it: any) => it.productId))];
        const products = await prisma.product.findMany({
            where: { id: { in: productIds as number[] }, pharmacyId },
        });
        if (products.length !== productIds.length) {
            return NextResponse.json({ error: 'One or more products were not found' }, { status: 404 });
        }

        const lastPO = await prisma.purchaseOrder.findFirst({
            where: { pharmacyId },
            orderBy: { id: 'desc' },
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
                pharmacyId,
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

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SUPER_ADMIN can inspect a specific pharmacy via ?pharmacyId=
    const pharmacyIdParam = req.nextUrl.searchParams.get('pharmacyId');
    const pharmacyId =
        session.user.role === Role.SUPER_ADMIN && pharmacyIdParam
            ? Number(pharmacyIdParam)
            : session.user.pharmacyId;

    if (!pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy associated with this user' }, { status: 400 });
    }

    const orders = await prisma.purchaseOrder.findMany({
        where: { pharmacyId },
        include: {
            supplier: true,
            items: { include: { product: true } },
            purchaseInvoices: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
}