import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/locations — list all
export async function GET() {
    const locations = await prisma.location.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { batches: true } } },
    });
    return NextResponse.json(locations);
}

// POST /api/locations — create
export async function POST(req: NextRequest) {
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