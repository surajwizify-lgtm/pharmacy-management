import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound, badRequest, conflict } from '@/lib/api-utils';
import { updateStockSchema } from '@/lib/schemas';

/**
 * PATCH /api/batches/:id/stock - ADMIN/PHARMACIST
 *
 * Optimistic locking, same as the NestJS version: the update is scoped to
 * `{ id, version: dto.version }`. If another request already bumped the
 * version, `count` comes back 0 and we throw a 409 instead of silently
 * corrupting the stock count.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid batch id');
    const dto = updateStockSchema.parse(await req.json());

    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch) throw notFound(`Batch ${id} not found`);

    const newQuantity = batch.quantityAvailable + dto.quantityDelta;
    if (newQuantity < 0) throw badRequest('Adjustment would result in negative stock');

    const result = await prisma.batch.updateMany({
      where: { id, version: dto.version },
      data: { quantityAvailable: newQuantity, version: { increment: 1 } },
    });

    if (result.count === 0) {
      throw conflict('Batch was modified by another request - refetch and retry (optimistic lock failure)');
    }

    return prisma.batch.findUnique({ where: { id }, include: { product: true } });
  });
}
