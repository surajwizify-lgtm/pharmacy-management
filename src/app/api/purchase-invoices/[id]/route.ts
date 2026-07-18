import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const invoice: any = await prisma.purchaseInvoice.findUnique({
        where: { id: Number(params.id) },
        include: {
            supplier: true,
            purchaseOrder: true,
            items: { include: { product: true, batch: true } },
            payments: true,
            supplierReturns: { include: { items: true } },
        },
    });
    if (!invoice) {
        return NextResponse.json({ error: 'Purchase invoice not found' }, { status: 404 });
    }
    return NextResponse.json(invoice);
}