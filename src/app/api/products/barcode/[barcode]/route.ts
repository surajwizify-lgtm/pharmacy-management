import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound } from '@/lib/api-utils';

// GET /api/products/barcode/:barcode - ports productsService.findByBarcode
export async function GET(_req: Request, { params }: { params: { barcode: string } }) {
  return withErrorHandling(async () => {
    await requireSession();
    const product = await prisma.product.findFirst({
      where: { barcode: params.barcode },
      include: { batches: { orderBy: { expiryDate: 'asc' } } },
    });
    if (!product) throw notFound(`No product found for barcode ${params.barcode}`);
    return product;
  });
}
