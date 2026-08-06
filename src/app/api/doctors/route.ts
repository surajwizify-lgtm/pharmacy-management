import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
    const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const doctors = await prisma.doctor.findMany({
        where:
            session.user.role === Role.SUPER_ADMIN
                ? search
                    ? {
                        OR: [
                            { name: { contains: search } },
                            { specialization: { contains: search } },
                            { registrationNo: { contains: search } },
                        ],
                    }
                    : {}
                : {
                    pharmacyId: session.user.pharmacyId!,
                    ...(search && {
                        OR: [
                            { name: { contains: search } },
                            { specialization: { contains: search } },
                            { registrationNo: { contains: search } },
                        ],
                    }),
                },
        orderBy: {
            name: "asc",
        },
    });

    return NextResponse.json(doctors);
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const session = await getServerSession(authOptions);

    if (!body?.name?.trim()) {
        return NextResponse.json({ message: 'Doctor name is required.' }, { status: 400 });
    }

    try {
        const doctor = await prisma.doctor.create({
            data: {
                name: body.name.trim(),
                registrationNo: body.registrationNo?.trim() || null,
                specialization: body.specialization?.trim() || null,
                phone: body.phone?.trim() || null,
                pharmacyId: Number(session?.user.pharmacyId)
            },
        });
        return NextResponse.json(doctor, { status: 201 });
    } catch (err) {
        console.error('Failed to create doctor:', err);
        return NextResponse.json({ message: 'Could not create doctor.' }, { status: 500 });
    }
}