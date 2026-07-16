import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const purchaseOrderId = Number(id);

        if (isNaN(purchaseOrderId)) {
            return NextResponse.json(
                { error: "Invalid purchase order id" },
                { status: 400 }
            );
        }

        const batches = await prisma.batch.findMany({
            where: {
                purchaseInvoiceItem: {
                    purchaseInvoice: {
                        purchaseOrderId,
                    },
                },
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                {
                    product: {
                        name: "asc",
                    },
                },
                {
                    batchNumber: "asc",
                },
            ],
        });

        return NextResponse.json(
            batches.map((batch) => ({
                id: batch.id,
                batchNumber: batch.batchNumber,
                quantityAvailable: batch.quantityAvailable,
                purchasePrice: batch.purchasePrice.toString(),
                productId: batch.product.id,
                product: {
                    name: batch.product.name,
                },
            }))
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}