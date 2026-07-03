import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling } from '@/lib/api-utils';

// GET /api/medicines/low-stock?threshold=20 - ports MedicinesService.lowStock
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession();
    const thresholdParam = req.nextUrl.searchParams.get('threshold');
    const threshold = thresholdParam ? Number(thresholdParam) : 20;

    const medicines = await prisma.medicine.findMany({
      where: { status: 'ACTIVE' },
      include: { batches: true },
    });

    return medicines
      .map((m) => ({
        ...m,
        totalStock: m.batches.reduce((sum, b) => sum + b.quantityAvailable, 0),
      }))
      .filter((m) => m.totalStock <= threshold);
  });
}
