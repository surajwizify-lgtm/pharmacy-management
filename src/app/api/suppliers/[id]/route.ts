import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const supplier = await prisma.supplier.findUnique({
        where: {
            id: Number(params.id),
        },
        include: {
            purchaseOrders: {
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            },
            payments: true,
            supplierReturns: {
                include: {
                    items: {
                        include: {
                            product: true,
                            batch: true,
                        },
                    },
                    purchaseInvoice: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    if (!supplier) {
        return NextResponse.json(
            { error: "Supplier not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(supplier);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json();
    const supplier = await prisma.supplier.update({
        where: { id: Number(params.id) },
        data: body,
    });
    return NextResponse.json(supplier);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    await prisma.supplier.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ success: true });
}