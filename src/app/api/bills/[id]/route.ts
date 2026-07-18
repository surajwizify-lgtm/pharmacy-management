import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound, badRequest } from '@/lib/api-utils';

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
        customer: true
      },
    });
    if (!bill) throw notFound(`Bill ${id} not found`);

    const items = bill.billItems.map((bi) => {
      const quantity = bi.quantity;
      const sellingPrice = Number(bi.unitPrice);
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