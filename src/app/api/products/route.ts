
import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, conflict } from '@/lib/api-utils';
import { createproductSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession();
    const search = req.nextUrl.searchParams.get('search') ?? undefined;
    const status = (req.nextUrl.searchParams.get('status') as 'ACTIVE' | 'DISCONTINUED' | null) ?? undefined;

    return prisma.product.findMany({
      where: {
        status: status ?? undefined,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { barcode: { contains: search } },
            { hsnCode: { contains: search } },
          ],
        }),
      },
      include: {
        batches: { orderBy: { expiryDate: 'asc' } },
        category: true,   // 👈
      },
      orderBy: { name: 'asc' },
    });
  });
}
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const dto = createproductSchema.parse(await req.json());
    const { category, ...rest } = dto;
    console.log(category)

    return prisma.product.create({
      data: {
        ...rest,
        category: category
          ? {
            connectOrCreate: {
              where: { name: category },
              create: { name: category },
            },
          }
          : undefined,
      },
    });
  });
}