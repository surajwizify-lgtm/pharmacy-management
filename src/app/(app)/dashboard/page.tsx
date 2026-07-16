import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Plus,
  Package,
  Receipt,
  IndianRupee,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import OverduePayablesList from '@/components/dashboard/OverduePayablesList';
import CashFlowChart from '@/components/dashboard/CashFlowChart';

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
    <div className="space-y-8 p-2">

      {/* -------- Header -------- */}
      <div className="flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 to-indigo-700 px-6 py-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Welcome back, {session?.user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-sm text-primary-100">Here&apos;s what&apos;s happening at the pharmacy today.</p>
        </div>
        <Link
          href="/billing/all-sales/new"
          className="flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
        >
          <Plus className="h-4 w-4" />
          Create New Bill
        </Link>
      </div>

      {/* -------- Stat cards -------- */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Active products"
          value={stats.activeproducts}
          sub={`${stats.productCount} total`}
          icon={Package}
          tone="primary"
        />
        <StatCard label="Bills today" value={stats.billsToday} icon={Receipt} tone="indigo" />
        <StatCard
          label="Revenue today"
          value={`₹${Number(stats.revenueToday ?? 0).toFixed(2)}`}
          icon={IndianRupee}
          tone="secondary"
        />
        <StatCard
          label="Low stock items"
          value={stats.lowStock.length}
          icon={AlertTriangle}
          tone={stats.lowStock.length > 0 ? 'amber' : 'secondary'}
        />
      </div>

      {/* -------- Lists -------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-medium text-neutral-800">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low stock (≤ 20 units)
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5 pt-2">
            {stats.lowStock.length === 0 ? (
              <p className="py-4 text-sm text-neutral-400">All products are well stocked.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {stats.lowStock.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-neutral-700">{m.name}</span>
                    <span className="badge bg-amber-100 text-amber-700">{m.totalStock} left</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-medium text-neutral-800">
              <Clock className="h-4 w-4 text-danger-500" />
              Expiring soon (90 days)
            </h2>
            <Link
              href="/batches"
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5 pt-2">
            {stats.expiringBatches.length === 0 ? (
              <p className="py-4 text-sm text-neutral-400">Nothing expiring in the next 90 days.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {stats.expiringBatches.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-neutral-700">
                      <span className="font-medium">{b.product.name}</span>{' '}
                      <span className="text-neutral-400">· {b.batchNumber}</span>
                    </span>
                    <span className="badge bg-danger-100 text-danger-700">
                      {new Date(b.expiryDate).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <OverduePayablesList />

        <CashFlowChart />
      </div>
    </div>
  );
}

const TONE_STYLES: Record<string, { bg: string; icon: string; value: string }> = {
  primary: { bg: 'bg-primary-50', icon: 'text-primary-600', value: 'text-neutral-900' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', value: 'text-neutral-900' },
  secondary: { bg: 'bg-secondary-50', icon: 'text-secondary-600', value: 'text-neutral-900' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-600' },
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  tone?: keyof typeof TONE_STYLES;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="card flex items-start justify-between p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${styles.value}`}>{value}</p>
        {sub && <p className="text-xs text-neutral-400">{sub}</p>}
      </div>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.bg}`}>
        <Icon className={`h-4.5 w-4.5 ${styles.icon}`} />
      </div>
    </div>
  );
}