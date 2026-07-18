import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound, badRequest } from '@/lib/api-utils';
import { updateproductSchema } from '@/lib/schemas';

async function findOrThrow(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      batches: { orderBy: { expiryDate: 'asc' } },
      category: true,
    },
  });
  if (!product) throw notFound(`product ${id} not found`);
  return product;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession();
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid product id');
    return findOrThrow(id);
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid product id');
    const dto = updateproductSchema.parse(await req.json());
    const { category, ...rest } = dto;

    console.log('RAW BODY category:', JSON.stringify(category));
    console.log('typeof category:', typeof category);

    await findOrThrow(id);

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        version: { increment: 1 },
        ...(category !== undefined && {
          category: category
            ? { connectOrCreate: { where: { name: category }, create: { name: category } } }
            : { disconnect: true },
        }),
      },
      include: { category: true },
    });

    console.log('UPDATED product.categoryId:', updated.categoryId);
    console.log('UPDATED product.category:', updated.category);

    return updated;
  });
}


export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN]);
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid product id');

    const product = await findOrThrow(id);
    const newStatus = product.status === 'ACTIVE' ? 'DISCONTINUED' : 'ACTIVE';

    return prisma.product.update({
      where: { id },
      data: { status: newStatus },
    });
  });
}