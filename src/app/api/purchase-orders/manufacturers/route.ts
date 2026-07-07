import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, SupplierStatus } from "@prisma/client";

// GET /api/purchase-orders/manufacturer?search=&status=&page=1&pageSize=20
// Lists manufacturers with optional search (name/contact/phone/email) and status filter.
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search")?.trim() || "";
        const status = searchParams.get("status") as SupplierStatus | null;
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

        const where: Prisma.ManufacturerWhereInput = {
            ...(status && (status === "ACTIVE" || status === "INACTIVE") ? { status } : {}),
            ...(search
                ? {
                    OR: [
                        { name: { contains: search } },
                        { contactPerson: { contains: search } },
                        { phone: { contains: search } },
                        { email: { contains: search } },
                        { drugLicenseNo: { contains: search } },
                    ],
                }
                : {}),
        };

        const [data, total] = await Promise.all([
            prisma.manufacturer.findMany({
                where,
                orderBy: { name: "asc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.manufacturer.count({ where }),
        ]);

        return NextResponse.json({
            data,
            pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        });
    } catch (err) {
        console.error("GET /api/purchase-orders/manufacturer failed", err);
        return NextResponse.json({ error: "Failed to fetch manufacturers" }, { status: 500 });
    }
}

// POST /api/purchase-orders/manufacturer
// Creates a new manufacturer. Body: { name, contactPerson?, phone?, email?, address?, gstin?, drugLicenseNo?, status? }
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
            return NextResponse.json({ error: "'name' is required" }, { status: 400 });
        }

        const manufacturer = await prisma.manufacturer.create({
            data: {
                name: body.name.trim(),
                contactPerson: body.contactPerson || null,
                phone: body.phone || null,
                email: body.email || null,
                address: body.address || null,
                gstin: body.gstin || null,
                drugLicenseNo: body.drugLicenseNo || null,
                status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            },
        });

        return NextResponse.json({ data: manufacturer }, { status: 201 });
    } catch (err) {
        console.error("POST /api/purchase-orders/manufacturer failed", err);
        return NextResponse.json({ error: "Failed to create manufacturer" }, { status: 500 });
    }
}
