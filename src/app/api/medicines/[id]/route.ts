import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, notFound, badRequest } from '@/lib/api-utils';
import { updateMedicineSchema } from '@/lib/schemas';

async function findOrThrow(id: number) {
  const medicine = await prisma.medicine.findUnique({
    where: { id },
    include: { batches: { orderBy: { expiryDate: 'asc' } } },
  });
  if (!medicine) throw notFound(`Medicine ${id} not found`);
  return medicine;
}

// GET /api/medicines/:id - any authenticated role
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession();
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid medicine id');
    return findOrThrow(id);
  });
}

// PUT /api/medicines/:id - ADMIN/PHARMACIST, ports MedicinesService.update
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid medicine id');
    const dto = updateMedicineSchema.parse(await req.json());

    await findOrThrow(id);
    return prisma.medicine.update({
      where: { id },
      data: { ...dto, version: { increment: 1 } },
    });
  });
}

// DELETE /api/medicines/:id - ADMIN only. Soft delete (DISCONTINUED status),
// matching MedicPOS's pattern rather than a hard delete.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN]);
    const id = Number(params.id);
    if (Number.isNaN(id)) throw badRequest('Invalid medicine id');

    await findOrThrow(id);
    return prisma.medicine.update({ where: { id }, data: { status: 'DISCONTINUED' } });
  });
}
