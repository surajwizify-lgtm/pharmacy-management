import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/hospitals?search=xyz
export async function GET(req: NextRequest) {
    const search = req.nextUrl.searchParams.get('search')?.trim() ?? '';

    const hospitals = await prisma.hospital.findMany({
        where: search
            ? {
                OR: [
                    { name: { contains: search } },
                    { address: { contains: search } },
                    { gstin: { contains: search } },
                ],
            }
            : undefined,
        orderBy: { name: 'asc' },
    });

    return NextResponse.json(hospitals);
}

// POST /api/hospitals
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);

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
            },
        });
        return NextResponse.json(hospital, { status: 201 });
    } catch (err) {
        console.error('Failed to create hospital:', err);
        return NextResponse.json({ message: 'Could not create hospital.' }, { status: 500 });
    }
}