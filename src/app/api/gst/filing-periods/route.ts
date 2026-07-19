import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const periods = await prisma.gstFilingPeriod.findMany({
            orderBy: { periodStart: 'desc' },
        });
        return NextResponse.json(periods);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to fetch filing periods' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!body.periodStart || !body.periodEnd) {
            return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 });
        }

        const summaryRes = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/gst/summary?from=${body.periodStart}&to=${body.periodEnd}`
        );
        const summary = await summaryRes.json();

        const period = await prisma.gstFilingPeriod.create({
            data: {
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