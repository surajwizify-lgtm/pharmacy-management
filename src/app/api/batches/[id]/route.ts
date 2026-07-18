import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound, badRequest } from '@/lib/api-utils';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession();
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid batch id');

    const batch = await prisma.batch.findUnique({ where: { id }, include: { product: true } });
    if (!batch) throw notFound(`Batch ${id} not found`);
    return batch;
  });
}
