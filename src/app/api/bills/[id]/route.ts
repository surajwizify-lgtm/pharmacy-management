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
      include: {
        billItems: { include: { product: true, batch: true } },
        payments: true,
        cashier: true,
      },
    });
    if (!bill) throw notFound(`Bill ${id} not found`);

    // Shape the response so it matches BillPrintData exactly —
    // the print template expects `items` (flat product/tax fields),
    // not the raw Prisma `billItems` (nested product/batch relations).
    const items = bill.billItems.map((bi) => {
      const quantity = bi.quantity;
      const sellingPrice = Number(bi.sellingPrice);
      const gstPercentage = Number(bi.gstPercentage);
      const taxableValue = quantity * sellingPrice;
      const gstAmount = (taxableValue * gstPercentage) / 100;
      const totalAmount = taxableValue + gstAmount;

      return {
        id: bi.id,
        productName: bi.product?.name ?? 'Unknown product',
        batchNumber: bi.batch?.batchNumber ?? null,
        quantity,
        sellingPrice,
        gstPercentage,
        taxableValue,
        gstAmount,
        totalAmount,
      };
    });

    return {
      ...bill,
      items,
    };
  });
}