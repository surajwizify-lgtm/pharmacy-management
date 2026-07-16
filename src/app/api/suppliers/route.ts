import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const suppliers = await prisma.supplier.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(suppliers);
}
export async function POST(req: NextRequest) {
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
        },
    });
    return NextResponse.json(supplier, { status: 201 });
}