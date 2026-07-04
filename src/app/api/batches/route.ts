import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound } from '@/lib/api-utils';
import { createBatchSchema } from '@/lib/schemas';

// GET /api/batches?medicineId= - any authenticated role, ports BatchesService.findAll
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession();
    const medicineIdParam = req.nextUrl.searchParams.get('medicineId');
    const medicineId = medicineIdParam ? Number(medicineIdParam) : undefined;

    return prisma.batch.findMany({
      where: medicineId ? { medicineId } : undefined,
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
    });
  });
}

// POST /api/batches - ADMIN/PHARMACIST, ports BatchesService.create
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const dto = createBatchSchema.parse(await req.json());

    const medicine = await prisma.medicine.findUnique({ where: { id: dto.medicineId } });
    if (!medicine) throw notFound(`Medicine ${dto.medicineId} not found`);

    // return prisma.batch.create({
    //   data: {
    //     medicineId: dto.medicineId,
    //     batchNumber: dto.batchNumber,
    //     expiryDate: new Date(dto.expiryDate),
    //     purchasePrice: dto.purchasePrice,
    //     sellingPrice: dto.sellingPrice,
    //     quantityAvailable: dto.quantityAvailable,
    //   },
    // });
    return await prisma.batch.create({
      data: {
        medicineId: dto.medicineId,
        batchNumber: dto.batchNumber,
        expiryDate: new Date(dto.expiryDate),
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        quantityAvailable: dto.quantityAvailable,
        location: dto.location || null,
      },
    });
  });
}
