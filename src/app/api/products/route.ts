// import { NextRequest } from 'next/server';
// import { Role } from '@prisma/client';
// import { prisma } from '@/lib/prisma';
// import { requireSession, withErrorHandling, conflict } from '@/lib/api-utils';
// import { createproductSchema } from '@/lib/schemas';

// // GET /api/products?search=&status= - any authenticated role, ports productsService.findAll
// export async function GET(req: NextRequest) {
//   return withErrorHandling(async () => {
//     await requireSession();
//     const search = req.nextUrl.searchParams.get('search') ?? undefined;
//     const status = (req.nextUrl.searchParams.get('status') as 'ACTIVE' | 'DISCONTINUED' | null) ?? undefined;

//     return prisma.product.findMany({
//       where: {
//         status: status ?? undefined,
//         ...(search && {
//           OR: [
//             { name: { contains: search } },
//             { barcode: { contains: search } },
//             { hsnCode: { contains: search } },
//           ],
//         }),
//       },
//       include: { batches: { orderBy: { expiryDate: 'asc' } } },
//       orderBy: { name: 'asc' },
//     });
//   });
// }

// // POST /api/products - ADMIN/PHARMACIST, ports productsService.create
// export async function POST(req: NextRequest) {
//   return withErrorHandling(async () => {
//     await requireSession([Role.ADMIN, Role.PHARMACIST]);
//     const dto = createproductSchema.parse(await req.json());

//     const existing = await prisma.product.findUnique({ where: { hsnCode: dto.hsnCode } });
//     if (existing) throw conflict(`product with HSN code ${dto.hsnCode} already exists`);

//     return prisma.product.create({ data: dto });
//   });
// }
import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, withErrorHandling, conflict } from '@/lib/api-utils';
import { createproductSchema } from '@/lib/schemas';

// GET /api/products?search=&status= - any authenticated role, ports productsService.findAll
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
      include: { batches: { orderBy: { expiryDate: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  });
}

// POST /api/products - ADMIN/PHARMACIST, ports productsService.create
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession([Role.ADMIN, Role.PHARMACIST]);
    const dto = createproductSchema.parse(await req.json());

    // hsnCode is no longer @unique on Product, so findUnique won't work here.
    if (dto.hsnCode) {
      const existing = await prisma.product.findFirst({ where: { hsnCode: dto.hsnCode } });
      if (existing) throw conflict(`Product with HSN code ${dto.hsnCode} already exists`);
    }

    // dto.category is a plain string (category name) from the client,
    // but Prisma needs a relation input, nost a bare string — convert it.
    const { category, ...rest } = dto;

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