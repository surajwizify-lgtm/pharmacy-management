import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const search = req.nextUrl.searchParams.get('search')?.trim();

    // SUPER_ADMIN can inspect a specific pharmacy via ?pharmacyId=
    const pharmacyIdParam = req.nextUrl.searchParams.get('pharmacyId');
    const pharmacyId =
        session.user.role === Role.SUPER_ADMIN && pharmacyIdParam
            ? Number(pharmacyIdParam)
            : session.user.pharmacyId;

    if (!pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy associated with this user' }, { status: 400 });
    }

    const customers = await prisma.customer.findMany({
        where: {
            pharmacyId,
            ...(search
                ? {
                    OR: [
                        { name: { contains: search } },
                        { phone: { contains: search } },
                    ],
                }
                : {}),
        },
        orderBy: { name: 'asc' },
        include: { _count: { select: { bills: true } } },
    });

    return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pharmacyId = session.user.pharmacyId;
    if (!pharmacyId) {
        return NextResponse.json({ error: 'No pharmacy associated with this user' }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, email, address, gstin, openingBalance, active } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    try {
        const customer = await prisma.customer.create({
            data: {
                name: name.trim(),
                phone: phone?.trim() || null,
                email: email?.trim() || null,
                address: address?.trim() || null,
                gstin: gstin?.trim() || null,
                openingBalance: openingBalance ?? 0,
                currentBalance: openingBalance ?? 0,
                active: active ?? true,
                pharmacyId,
            },
        });
        return NextResponse.json(customer, { status: 201 });
    } catch (err: any) {
        if (err.code === 'P2002') {
            return NextResponse.json({ error: 'A customer with this phone number already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
}