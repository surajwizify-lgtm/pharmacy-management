import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SUPER_ADMIN can inspect a specific pharmacy via ?pharmacyId=
    const pharmacyIdParam = req.nextUrl.searchParams.get("pharmacyId");
    const pharmacyId =
        session.user.role === Role.SUPER_ADMIN && pharmacyIdParam
            ? Number(pharmacyIdParam)
            : session.user.pharmacyId;

    if (!pharmacyId) {
        return NextResponse.json({ error: "No pharmacy associated with this user" }, { status: 400 });
    }

    const locations = await prisma.location.findMany({
        where: { pharmacyId },
        orderBy: { name: "asc" },
        include: { _count: { select: { batches: true } } },
    });
    return NextResponse.json(locations);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = session.user.pharmacyId;
    if (!pharmacyId) {
        return NextResponse.json({ error: "No pharmacy associated with this user" }, { status: 400 });
    }

    const body = await req.json();
    const { name, code, type, description, active } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    try {
        const location = await prisma.location.create({
            data: {
                name: name.trim(),
                code: code?.trim() || null,
                type: type || "RACK",
                description: description?.trim() || null,
                active: active ?? true,
                pharmacyId,
            },
        });
        return NextResponse.json(location, { status: 201 });
    } catch (err: any) {
        if (err.code === "P2002") {
            return NextResponse.json({ error: "Location code already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
    }
}