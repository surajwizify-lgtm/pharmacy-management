import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/customers/:id — update
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, email, address, gstin, active } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    try {
        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name: name.trim(),
                phone: phone?.trim() || null,
                email: email?.trim() || null,
                address: address?.trim() || null,
                gstin: gstin?.trim() || null,
                active: active ?? true,
            },
        });
        return NextResponse.json(customer);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return NextResponse.json({ error: 'A customer with this phone number already exists' }, { status: 409 });
        }
        if (err.code === 'P2025') {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
}

// DELETE /api/customers/:id — delete
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    try {
        const billCount = await prisma.bill.count({ where: { customerId: id } });
        if (billCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${billCount} bill(s) linked to this customer` },
                { status: 409 }
            );
        }

        await prisma.customer.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.code === 'P2025') {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }
}
// GET /api/customers/:id — full detail with bills + payment history
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            bills: {
                orderBy: { billDate: 'desc' },
                include: {
                    payments: true,
                    billItems: { select: { id: true } }, // just for item count
                },
            },
        },
    });

    if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
}