import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound, badRequest } from '@/lib/api-utils';
import { updateproductSchema } from '@/lib/schemas';

async function findOrThrow(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { batches: { orderBy: { expiryDate: 'asc' } } },
  });
  if (!product) throw notFound(`product ${id} not found`);
  return product;
}

// GET /api/products/:id - any authenticated role
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession();
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid product id');
    return findOrThrow(id);
  });
}

// PUT /api/products/:id - ADMIN/PHARMACIST, ports productsService.update
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid product id');
    const dto = updateproductSchema.parse(await req.json());

    await findOrThrow(id);
    return prisma.product.update({
      where: { id },
      data: { ...dto, version: { increment: 1 } },
    });
  });
}

// DELETE /api/products/:id - ADMIN only. Soft delete (DISCONTINUED status),
// matching MedicPOS's pattern rather than a hard delete.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN]);
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid product id');

    await findOrThrow(id);
    return prisma.product.update({ where: { id }, data: { status: 'DISCONTINUED' } });
  });
}
