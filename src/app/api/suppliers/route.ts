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

    const suppliers = await prisma.supplier.findMany({
        where: { pharmacyId },
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(suppliers);
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
    const supplier = await prisma.supplier.create({
        data: {
            name: body.name,
            contactPerson: body.contactPerson,
            email: body.email,
            phone: body.phone,
            address: body.address,
            gstin: body.gstin,
            drugLicenseNo: body.drugLicenseNo,
            pharmacyId,
        },
    });
    return NextResponse.json(supplier, { status: 201 });
}