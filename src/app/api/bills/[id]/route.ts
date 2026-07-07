import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound, badRequest } from '@/lib/api-utils';

// GET /api/bills/:id - any authenticated role, ports BillingService.findOne
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession();
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid bill id');

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: { billItems: { include: { product: true } }, payments: true, cashier: true },
    });
    if (!bill) throw notFound(`Bill ${id} not found`);
    return bill;
  });
}
