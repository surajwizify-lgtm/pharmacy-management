import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/gst/filing-periods/[id]
// body: { filed?: boolean, amountPaid?: number }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();

        const period = await prisma.gstFilingPeriod.update({
            where: { id: Number(params.id) },
            data: {
                ...(body.filed !== undefined && { filed: body.filed, filedAt: body.filed ? new Date() : null }),
                ...(body.amountPaid !== undefined && { amountPaid: body.amountPaid }),
            },
        });

        return NextResponse.json(period);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to update filing period' }, { status: 500 });
    }
}