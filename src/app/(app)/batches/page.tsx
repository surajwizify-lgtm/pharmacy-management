// app/batches/page.tsx
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/common/Header';
import Container from '@/components/common/Container';
import BatchesTable, { BatchWithProduct } from './BatchesTable';


export default async function BatchesPage() {
  const batches = await prisma.batch.findMany({
    include: { product: { select: { name: true } } },
    orderBy: { expiryDate: 'asc' },
  });

  const data: BatchWithProduct[] = batches.map((b) => ({
    id: b.id,
    productId: b.productId,
    batchNumber: b.batchNumber,
    expiryDate: b.expiryDate.toISOString(),
    quantityAvailable: b.quantityAvailable,
    sellingPrice: Number(b.sellingPrice),
    product: b.product ? { name: b.product.name } : null,
  }));

  return (
    <div className="">
      <PageHeader
        header="Batches & Stock"
        subheader="Monitor inventory batches, expiry dates and maintain FIFO stock movement."
      />

      <Container>
        <BatchesTable data={data} />
      </Container>
    </div>
  );
}