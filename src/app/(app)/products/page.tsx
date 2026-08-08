import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ProductsClient from './ProductsClient';
import { prisma } from '@/lib/prisma';

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const products = await prisma.product.findMany({
    include: {
      category: true,
      batches: true,
    },
    orderBy: { name: 'asc' }
  });

  const serializedProducts = products.map((p) => ({
    ...p,
    gstPercentage: p.gstPercentage.toString(),
    mrp: Number(p.mrp),
    cp: Number(p.cp),
    sp: Number(p.sp),
    defaultMrp: Number(p.defaultMrp),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    batches: p.batches.map((b) => ({
      ...b,
      mrp: Number(b.mrp),
      purchasePrice: b.purchasePrice.toString(),
      sellingPrice: b.sellingPrice.toString(),
      expiryDate: b.expiryDate.toISOString(),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    })),
  }));

  return (
    <ProductsClient
      initialProducts={serializedProducts}
      role={session.user.role}
    />
  );
}