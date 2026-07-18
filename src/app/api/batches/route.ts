import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound } from '@/lib/api-utils';
import { createBatchSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession();
    const productIdParam = req.nextUrl.searchParams.get('productId');
    const productId = productIdParam ? Number(productIdParam) : undefined;
    console.log("hello")
    return prisma.batch.findMany({
      where: productId ? { productId } : undefined,
      include: { product: true },
      orderBy: [{ product: { name: "asc" } },]
    });
  });
}
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const dto = createBatchSchema.parse(await req.json());

    const product = await prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw notFound(`product ${dto.productId} not found`);
    return prisma.batch.create({
      data: {
        productId: dto.productId,
        batchNumber: dto.batchNumber,
        manufactureDate: dto.manufactureDate
          ? new Date(dto.manufactureDate)
          : null,
        expiryDate: new Date(dto.expiryDate),
        purchasePrice: dto.purchasePrice,
        mrp: dto.mrp,
        sellingPrice: dto.sellingPrice,
        quantityAvailable: dto.quantityAvailable,
        locationId: dto.locationId ?? null,
      },
    });
  });
}
