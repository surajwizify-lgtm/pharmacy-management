import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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