import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const ret = await prisma.supplierReturn.findUnique({
        where: { id: Number(params.id) },
        include: {
            supplier: true,
            purchaseOrder: true,
            items: { include: { product: true, batch: true } },
        },
    });
    if (!ret) return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    return NextResponse.json(ret);
}