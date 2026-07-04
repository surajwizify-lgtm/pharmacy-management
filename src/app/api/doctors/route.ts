import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const search = req.nextUrl.searchParams.get('search')?.trim();

    const doctors = await prisma.doctor.findMany({
        where: search ? { name: { contains: search } } : undefined,
        orderBy: { name: 'asc' },
        take: 10,
    });

    return NextResponse.json(doctors);
}