import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const invoices = await prisma.purchaseInvoice.findMany({
        include: { supplier: true },
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(invoices);
}