import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling } from '@/lib/api-utils';

// GET /api/products/low-stock?threshold=20 - ports productsService.lowStock
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession();
    const thresholdParam = req.nextUrl.searchParams.get('threshold');
    const threshold = thresholdParam ? Number(thresholdParam) : 20;

    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { batches: true },
    });

    return products
      .map((m) => ({
        ...m,
        totalStock: m.batches.reduce((sum, b) => sum + b.quantityAvailable, 0),
      }))
      .filter((m) => m.totalStock <= threshold);
  });
}
