import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    const poId = Number(params.id);
    console.log(body)

    try {
        const pi = await prisma.purchaseInvoice.findUnique({ where: { id: body.purchaseInvoiceId } });
        if (!pi) return NextResponse.json({ error: 'Purchase Invoice not found' }, { status: 404 });

        if (!body.amount || Number(body.amount) <= 0) {
            return NextResponse.json({ error: 'Enter a valid payment amount' }, { status: 400 });
        }

        const payment = await prisma.supplierPayment.create({
            data: {
                supplierId: pi.supplierId,
                purchaseInvoiceId: body.purchaseInvoiceId,
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