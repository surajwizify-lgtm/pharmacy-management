// app/api/gst/filing-periods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { computeGstSummary } from '@/lib/gst-ledger';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.pharmacyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const periods = await prisma.gstFilingPeriod.findMany({
            where: { pharmacyId: session.user.pharmacyId },
            orderBy: { periodStart: 'desc' },
        });
        return NextResponse.json(periods);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to fetch filing periods' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.pharmacyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        if (!body.periodStart || !body.periodEnd) {
            return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 });
        }

        const summary = await computeGstSummary(session.user.pharmacyId, body.periodStart, body.periodEnd);

        const period = await prisma.gstFilingPeriod.create({
            data: {
                pharmacyId: session.user.pharmacyId,
                periodStart: new Date(body.periodStart),
                periodEnd: new Date(body.periodEnd),
                totalOutputGst: summary.totalOutputGst,
                totalInputGst: summary.totalInputGst,
                netPayable: summary.netPayable,
            },
        });

        return NextResponse.json(period, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to create filing period' }, { status: 500 });
    }
}