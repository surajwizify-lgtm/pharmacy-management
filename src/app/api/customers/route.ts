import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/customers — list, optional ?search= for name/phone lookup (billing autocomplete)
export async function GET(req: NextRequest) {
    const search = req.nextUrl.searchParams.get('search')?.trim();

    const customers = await prisma.customer.findMany({
        where: search
            ? {
                OR: [
                    { name: { contains: search } },
                    { phone: { contains: search } },
                ],
            }
            : undefined,
        orderBy: { name: 'asc' },
        include: { _count: { select: { bills: true } } },
    });

    return NextResponse.json(customers);
}

// POST /api/customers — create
export async function POST(req: NextRequest) {
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