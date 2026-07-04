import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/doctors?search=xyz
export async function GET(req: NextRequest) {
    const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';

    const doctors = await prisma.doctor.findMany({
        where: search
            ? {
                OR: [
                    { name: { contains: search } },
                    { specialization: { contains: search } },
                    { registrationNo: { contains: search } },
                ],
            }
            : undefined,
        orderBy: { name: 'asc' },
    });

    return NextResponse.json(doctors);
}

// POST /api/doctors
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);

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
            },
        });
        return NextResponse.json(doctor, { status: 201 });
    } catch (err) {
        console.error('Failed to create doctor:', err);
        return NextResponse.json({ message: 'Could not create doctor.' }, { status: 500 });
    }
}