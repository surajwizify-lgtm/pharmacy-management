import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound } from '@/lib/api-utils';
import { createBatchSchema } from '@/lib/schemas';

// GET /api/batches?productId= - any authenticated role, ports BatchesService.findAll
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession();
    const productIdParam = req.nextUrl.searchParams.get('productId');
    const productId = productIdParam ? Number(productIdParam) : undefined;

    return prisma.batch.findMany({
      where: productId ? { productId } : undefined,
      include: { product: true },
      orderBy: { expiryDate: 'asc' },
    });
  });
}

// POST /api/batches - ADMIN/PHARMACIST, ports BatchesService.create
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const dto = createBatchSchema.parse(await req.json());

    const product = await prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw notFound(`product ${dto.productId} not found`);

    return await prisma.batch.create({
      data: {
        productId: dto.productId,
        batchNumber: dto.batchNumber,
        expiryDate: new Date(dto.expiryDate),
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        quantityAvailable: dto.quantityAvailable,
        location: dto.location || null,
      },
    });
  });
}
