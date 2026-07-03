import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, conflict } from '@/lib/api-utils';
import { createMedicineSchema } from '@/lib/schemas';

// GET /api/medicines?search=&status= - any authenticated role, ports MedicinesService.findAll
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession();
    const search = req.nextUrl.searchParams.get('search') ?? undefined;
    const status = (req.nextUrl.searchParams.get('status') as 'ACTIVE' | 'DISCONTINUED' | null) ?? undefined;

    return prisma.medicine.findMany({
      where: {
        status: status ?? undefined,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search } },
            { hsnCode: { contains: search } },
          ],
        }),
      },
      include: { batches: { orderBy: { expiryDate: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  });
}

// POST /api/medicines - ADMIN/PHARMACIST, ports MedicinesService.create
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const dto = createMedicineSchema.parse(await req.json());

    const existing = await prisma.medicine.findUnique({ where: { hsnCode: dto.hsnCode } });
    if (existing) throw conflict(`Medicine with HSN code ${dto.hsnCode} already exists`);

    return prisma.medicine.create({ data: dto });
  });
}
