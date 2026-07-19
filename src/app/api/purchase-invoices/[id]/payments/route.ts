import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const invoiceId = Number(params.id);
    if (Number.isNaN(invoiceId)) {
        return NextResponse.json({ error: 'Invalid invoice id' }, { status: 400 });
    }

    const body = await req.json();

    if (!body.amount || Number(body.amount) <= 0) {
        return NextResponse.json({ error: 'Enter a valid payment amount' }, { status: 400 });
    }
    if (!body.paymentMode) {
        return NextResponse.json({ error: 'paymentMode is required' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.purchaseInvoice.findUnique({
                where: { id: invoiceId },
                include: {
                    payments: true,
                    supplierReturns: { where: { refundType: 'credit_note' } },
                },
            });
            if (!invoice) throw new Error('Purchase invoice not found');

            const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const creditedViaReturns = invoice.supplierReturns.reduce(
                (sum, r) => sum + Number(r.totalAmount),
                0
            );
            const balanceDue = Number(invoice.totalAmount) - alreadyPaid - creditedViaReturns;

            if (Number(body.amount) > balanceDue) {
                throw new Error(`Payment exceeds balance due (₹${balanceDue.toFixed(2)})`);
            }

            const payment = await tx.supplierPayment.create({
                data: {
                    supplierId: invoice.supplierId,
                    purchaseInvoiceId: invoiceId,
                    amount: Number(body.amount),
                    paymentMode: body.paymentMode,
                    referenceNo: body.referenceNo || null,
                    notes: body.notes || null,
                },
            });

            const newTotalSettled = alreadyPaid + creditedViaReturns + Number(body.amount);
            const newStatus =
                newTotalSettled >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';

            await tx.purchaseInvoice.update({
                where: { id: invoiceId },
                data: { paymentStatus: newStatus },
            });

            return payment;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        const isBusinessError =
            err.message === 'Purchase invoice not found' ||
            err.message?.startsWith('Payment exceeds balance due');
        return NextResponse.json(
            { error: err.message || 'Failed to record payment' },
            { status: isBusinessError ? (err.message.includes('not found') ? 404 : 400) : 500 }
        );
    }
}