import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound } from '@/lib/api-utils';

// GET /api/medicines/barcode/:barcode - ports MedicinesService.findByBarcode
export async function GET(_req: Request, { params }: { params: { barcode: string } }) {
  return withErrorHandling(async () => {
    await requireSession();
    const medicine = await prisma.medicine.findFirst({
      where: { barcode: params.barcode },
      include: { batches: { orderBy: { expiryDate: 'asc' } } },
    });
    if (!medicine) throw notFound(`No medicine found for barcode ${params.barcode}`);
    return medicine;
  });
}
