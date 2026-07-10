import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/returns?search=&dateFrom=&dateTo=
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Prisma.ReturnWhereInput = {
        ...(dateFrom || dateTo
            ? {
                createdAt: {
                    ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                    ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59`) } : {}),
                },
            }
            : {}),
        ...(search
            ? {
                OR: [
                    { bill: { billNumber: { contains: search } } },
                    { bill: { customerName: { contains: search } } },
                    { reason: { contains: search } },
                ],
            }
            : {}),
    };

    try {
        const returns = await prisma.return.findMany({
            where,
            include: {
                bill: {
                    select: { id: true, billNumber: true, customerName: true, billDate: true },
                },
                returnItems: {
                    include: {
                        batch: {
                            select: { batchNumber: true, product: { select: { name: true } } },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ data: returns });
    } catch (err) {
        console.error("GET /api/returns failed", err);
        return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
    }
}