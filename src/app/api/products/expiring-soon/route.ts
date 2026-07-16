import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling } from '@/lib/api-utils';

// GET /api/products/expiring-soon?days=90 - ports productsService.expiringSoon
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession();
    const daysParam = req.nextUrl.searchParams.get('days');
    const days = daysParam ? Number(daysParam) : 90;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    return prisma.batch.findMany({
      where: { expiryDate: { lte: cutoff }, quantityAvailable: { gt: 0 } },
      include: { product: true },
      orderBy: { expiryDate: 'asc' },
    });
  });
}
