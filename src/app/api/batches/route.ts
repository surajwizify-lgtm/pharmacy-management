import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound, forbidden } from '@/lib/api-utils';
import { createBatchSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession();

    const productIdParam = req.nextUrl.searchParams.get('productId');
    const productId = productIdParam ? Number(productIdParam) : undefined;

    // SUPER_ADMIN can optionally inspect a specific pharmacy via ?pharmacyId=
    const pharmacyIdParam = req.nextUrl.searchParams.get('pharmacyId');
    const pharmacyId =
      session.user.role === Role.SUPER_ADMIN && pharmacyIdParam
        ? Number(pharmacyIdParam)
        : session.user.pharmacyId;

    if (!pharmacyId) {
      throw notFound('No pharmacy associated with this user');
    }

    return prisma.batch.findMany({
      where: {
        pharmacyId,
        ...(productId ? { productId } : {}),
      },
      include: { product: true },
      orderBy: [{ product: { name: 'asc' } }],
    });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const dto = createBatchSchema.parse(await req.json());

    const pharmacyId = session.user.pharmacyId;
    if (!pharmacyId) {
      throw notFound('No pharmacy associated with this user');
    }

    const product = await prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw notFound(`product ${dto.productId} not found`);

    // guard against creating a batch for a product that belongs to a different pharmacy
    if (product.pharmacyId !== pharmacyId) {
      throw forbidden(`product ${dto.productId} does not belong to your pharmacy`);
    }

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
        pharmacyId,
      },
    });
  });
}