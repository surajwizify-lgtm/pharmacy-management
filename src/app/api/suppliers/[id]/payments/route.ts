import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    const payment = await prisma.supplierPayment.create({
        data: {
            supplierId: Number(params.id),
            purchaseOrderId: body.purchaseOrderId ?? null,
            amount: body.amount,
            paymentMode: body.paymentMode,
            referenceNo: body.referenceNo,
            notes: body.notes,
        },
    });
    return NextResponse.json(payment, { status: 201 });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const payments = await prisma.supplierPayment.findMany({
        where: { supplierId: Number(params.id) },
        orderBy: { paidAt: "desc" },
    });

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return NextResponse.json({ payments, totalPaid });
}