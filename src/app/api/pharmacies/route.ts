import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const pharmacies = await prisma.pharmacy.findMany({
            orderBy: { id: "asc" },
            include: {
                _count: {
                    select: { users: true, products: true },
                },
            },
        });

        return NextResponse.json(pharmacies);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to fetch pharmacies" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, gstin, phone, address } = body;

    if (!name || !gstin) {
        return NextResponse.json(
            { error: "Name and GSTIN are required" },
            { status: 400 }
        );
    }

    const pharmacy = await prisma.pharmacy.create({
        data: {
            name,
            gstin,
            phone: phone || null,
            address: address || null,
        },
    });

    return NextResponse.json(pharmacy, { status: 201 });
}