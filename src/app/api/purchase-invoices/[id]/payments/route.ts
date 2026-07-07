import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const invoiceId = Number(params.id);
    const body = await req.json();

    try {
        const invoice = await prisma.purchaseInvoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true },
        });
        if (!invoice) return NextResponse.json({ error: 'Purchase invoice not found' }, { status: 404 });

        if (!body.amount || Number(body.amount) <= 0) {
            return NextResponse.json({ error: 'Enter a valid payment amount' }, { status: 400 });
        }

        const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balanceDue = Number(invoice.totalAmount) - alreadyPaid;

        if (Number(body.amount) > balanceDue) {
            return NextResponse.json(
                { error: `Payment exceeds balance due (₹${balanceDue.toFixed(2)})` },
                { status: 400 }
            );
        }

        const payment = await prisma.supplierPayment.create({
            data: {
                supplierId: invoice.supplierId,
                purchaseInvoiceId: invoiceId,
                amount: Number(body.amount),
                paymentMode: body.paymentMode,
                referenceNo: body.referenceNo || null,
                notes: body.notes || null,
            },
        });

        // update invoice payment status
        const newTotalPaid = alreadyPaid + Number(body.amount);
        const newStatus = newTotalPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';
        await prisma.purchaseInvoice.update({
            where: { id: invoiceId },
            data: { paymentStatus: newStatus },
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to record payment' }, { status: 500 });
    }
}