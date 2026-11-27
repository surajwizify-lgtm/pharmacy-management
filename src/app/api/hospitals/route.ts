import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
    const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === Role.SUPER_ADMIN) {
        const hospitals = await prisma.hospital.findMany({
            where: search
                ? {
                    OR: [
                        { name: { contains: search } },
                        { address: { contains: search } },
                        { gstin: { contains: search } },
                    ],
                }
                : {},
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(hospitals);
    }

    // Admin
    if (session.user.pharmacyId == null) {
        return NextResponse.json(
            { message: "Pharmacy not assigned." },
            { status: 400 }
        );
    }

    const hospitals = await prisma.hospital.findMany({
        where: {
            pharmacyId: session.user.pharmacyId,
            ...(search && {
                OR: [
                    { name: { contains: search } },
                    { address: { contains: search } },
                    { gstin: { contains: search } },
                ],
            }),
        },
        orderBy: {
            name: "asc",
        },
    });

    return NextResponse.json(hospitals);
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const session = await getServerSession(authOptions);
    if (!body?.name?.trim()) {
        return NextResponse.json({ message: 'Hospital name is required.' }, { status: 400 });
    }

    try {
        const hospital = await prisma.hospital.create({
            data: {
                name: body.name.trim(),
                address: body.address?.trim() || null,
                phone: body.phone?.trim() || null,
                gstin: body.gstin?.trim().toUpperCase() || null,
                pharmacyId: Number(session?.user.pharmacyId)
            },
        });
        return NextResponse.json(hospital, { status: 201 });
    } catch (err) {
        console.error('Failed to create hospital:', err);
        return NextResponse.json({ message: 'Could not create hospital.' }, { status: 500 });
    }
}