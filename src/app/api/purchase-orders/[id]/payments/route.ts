import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    const poId = Number(params.id);

    try {
        const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
        if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });

        if (!body.amount || Number(body.amount) <= 0) {
            return NextResponse.json({ error: 'Enter a valid payment amount' }, { status: 400 });
        }

        const payment = await prisma.supplierPayment.create({
            data: {
                supplierId: po.supplierId,
                purchaseOrderId: poId,
                amount: Number(body.amount),
                paymentMode: body.paymentMode,
                referenceNo: body.referenceNo || null,
                notes: body.notes || null,
            },
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to record payment' }, { status: 500 });
    }
}