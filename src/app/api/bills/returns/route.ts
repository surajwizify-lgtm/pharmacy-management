import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // SUPER_ADMIN can inspect a specific pharmacy via ?pharmacyId=
    const pharmacyIdParam = searchParams.get("pharmacyId");
    const pharmacyId =
        session.user.role === Role.SUPER_ADMIN && pharmacyIdParam
            ? Number(pharmacyIdParam)
            : session.user.pharmacyId;

    if (!pharmacyId) {
        return NextResponse.json({ error: "No pharmacy associated with this user" }, { status: 400 });
    }

    // Return has no pharmacyId of its own — scope via the parent Bill
    const where: Prisma.ReturnWhereInput = {
        bill: { pharmacyId },
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
                    { bill: { customer: { name: { contains: search } } } },
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
                    select: {
                        id: true,
                        billNumber: true,
                        billDate: true,
                        customer: { select: { id: true, name: true, phone: true } },
                    },
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
        console.error("GET /api/bills/returns failed", err);
        return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
    }
}