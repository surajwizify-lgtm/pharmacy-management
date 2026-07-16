import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/locations/:id — update
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    const { name, code, type, description, active } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    try {
        const location = await prisma.location.update({
            where: { id },
            data: {
                name: name.trim(),
                code: code?.trim() || null,
                type: type || "RACK",
                description: description?.trim() || null,
                active: active ?? true,
            },
        });
        return NextResponse.json(location);
    } catch (err: any) {
        if (err.code === "P2002") {
            return NextResponse.json({ error: "Location code already exists" }, { status: 409 });
        }
        if (err.code === "P2025") {
            return NextResponse.json({ error: "Location not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
    }
}

// DELETE /api/locations/:id — delete
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    try {
        const batchCount = await prisma.batch.count({ where: { locationId: id } });
        if (batchCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${batchCount} batch(es) still assigned to this location` },
                { status: 409 }
            );
        }

        await prisma.location.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.code === "P2025") {
            return NextResponse.json({ error: "Location not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
    }
}