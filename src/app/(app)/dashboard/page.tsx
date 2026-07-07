import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

async function getStats() {
  const [productCount, activeproducts, allproductsWithBatches, expiringBatches, billsToday, revenueAgg] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.findMany({ where: { status: 'ACTIVE' }, include: { batches: true } }),
      prisma.batch.findMany({
        where: {
          expiryDate: { lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
          quantityAvailable: { gt: 0 },
        },
        include: { product: true },
        orderBy: { expiryDate: 'asc' },
        take: 5,
      }),
      prisma.bill.count({ where: { billDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: { billDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

  const lowStock = allproductsWithBatches
    .map((m) => ({ ...m, totalStock: m.batches.reduce((s, b) => s + b.quantityAvailable, 0) }))
    .filter((m) => m.totalStock <= 20)
    .sort((a, b) => a.totalStock - b.totalStock)
    .slice(0, 5);

  return { productCount, activeproducts, lowStock, expiringBatches, billsToday, revenueToday: revenueAgg._sum.totalAmount };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back, {session?.user?.fullName?.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening at the pharmacy today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active products" value={stats.activeproducts} sub={`${stats.productCount} total`} />
        <StatCard label="Bills today" value={stats.billsToday} />
        <StatCard label="Revenue today" value={`₹${Number(stats.revenueToday ?? 0).toFixed(2)}`} />
        <StatCard label="Low stock items" value={stats.lowStock.length} accent={stats.lowStock.length > 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-slate-800">Low stock (≤ 20 units)</h2>
            <Link href="/products" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-slate-400">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.lowStock.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-700">{m.name}</span>
                  <span className="badge bg-amber-100 text-amber-700">{m.totalStock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-slate-800">Expiring soon (90 days)</h2>
            <Link href="/batches" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {stats.expiringBatches.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing expiring in the next 90 days.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.expiringBatches.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-700">
                    {b.product.name} <span className="text-slate-400">· {b.batchNumber}</span>
                  </span>
                  <span className="badge bg-red-100 text-red-700">
                    {new Date(b.expiryDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? 'text-amber-600' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
