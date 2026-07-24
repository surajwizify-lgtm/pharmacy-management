// // app/dashboard-preview/page.tsx
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";
// import Link from "next/link";
// import {
//     Plus,
//     Package,
//     Receipt,
//     IndianRupee,
//     AlertTriangle,
//     Clock,
//     ArrowRight,
// } from "lucide-react";
// import PageHeader from "@/components/common/Header";
// import Container from "@/components/common/Container";
// import HeaderButton from "@/components/common/HeaderButton";

// async function getStats() {
//     const [productCount, activeproducts, allproductsWithBatches, expiringBatches, billsToday, revenueAgg] =
//         await Promise.all([
//             prisma.product.count(),
//             prisma.product.count({ where: { status: "ACTIVE" } }),
//             prisma.product.findMany({ where: { status: "ACTIVE" }, include: { batches: true } }),
//             prisma.batch.findMany({
//                 where: {
//                     expiryDate: { lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
//                     quantityAvailable: { gt: 0 },
//                 },
//                 include: { product: true },
//                 orderBy: { expiryDate: "asc" },
//                 take: 5,
//             }),
//             prisma.bill.count({ where: { billDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
//             prisma.bill.aggregate({
//                 _sum: { totalAmount: true },
//                 where: { billDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
//             }),
//         ]);

//     const lowStock = allproductsWithBatches
//         .map((m) => ({ ...m, totalStock: m.batches.reduce((s, b) => s + b.quantityAvailable, 0) }))
//         .filter((m) => m.totalStock <= 20)
//         .sort((a, b) => a.totalStock - b.totalStock)
//         .slice(0, 5);

//     return { productCount, activeproducts, lowStock, expiringBatches, billsToday, revenueToday: revenueAgg._sum.totalAmount };
// }

// export default async function DashboardPreviewPage() {
//     const session = await getServerSession(authOptions);
//     const stats = await getStats();

//     return (
//         <div className="min-h-screen bg-neutral-50 p-2 md:p-6 space-y-6">
//             {/* Page Header */}
//             <PageHeader
//                 header="Dashboard Overview"
//                 subheader="Track your key metrics, recent activity, and team performance in one place."
//             >
//                 <HeaderButton text="Create New Bill" href="/billing/all-sales/new" />
//             </PageHeader>

//             {/* Stat Cards */}
//             <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
//                 <StatCard
//                     label="Active products"
//                     value={stats.activeproducts}
//                     sub={`${stats.productCount} total`}
//                     icon={Package}
//                     tone="primary"
//                 />
//                 <StatCard label="Bills today" value={stats.billsToday} icon={Receipt} tone="indigo" />
//                 <StatCard
//                     label="Revenue today"
//                     value={`₹${Number(stats.revenueToday ?? 0).toFixed(2)}`}
//                     icon={IndianRupee}
//                     tone="secondary"
//                 />
//                 <StatCard
//                     label="Low stock items"
//                     value={stats.lowStock.length}
//                     icon={AlertTriangle}
//                     tone={stats.lowStock.length > 0 ? "amber" : "secondary"}
//                 />
//             </div>

//             {/* Two Column Lists */}
//             <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//                 {/* Low Stock Container */}
//                 <Container
//                     title="Low Stock (≤ 20 units)"
//                     description="Products that need immediate restocking"
//                     action={<HeaderButton text="View All" href="/products" />}
//                     variant="card"
//                 >
//                     {stats.lowStock.length === 0 ? (
//                         <p className="py-4 text-sm text-neutral-400">All products are well stocked.</p>
//                     ) : (
//                         <ul className="divide-y divide-neutral-100">
//                             {stats.lowStock.map((m) => (
//                                 <li key={m.id} className="flex items-center justify-between py-2.5 text-sm">
//                                     <span className="font-medium text-neutral-700">{m.name}</span>
//                                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
//                                         {m.totalStock} left
//                                     </span>
//                                 </li>
//                             ))}
//                         </ul>
//                     )}
//                 </Container>

//                 {/* Expiring Soon Container */}
//                 <Container
//                     title="Expiring Soon (90 days)"
//                     description="Batches nearing expiration date"
//                     action={<HeaderButton text="Manage" href="/batches" />}
//                     variant="card"
//                 >
//                     {stats.expiringBatches.length === 0 ? (
//                         <p className="py-4 text-sm text-neutral-400">Nothing expiring in the next 90 days.</p>
//                     ) : (
//                         <ul className="divide-y divide-neutral-100">
//                             {stats.expiringBatches.map((b) => (
//                                 <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
//                                     <span className="text-neutral-700">
//                                         <span className="font-medium">{b.product.name}</span>{" "}
//                                         <span className="text-neutral-400">· {b.batchNumber}</span>
//                                     </span>
//                                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-700">
//                                         {new Date(b.expiryDate).toLocaleDateString()}
//                                     </span>
//                                 </li>
//                             ))}
//                         </ul>
//                     )}
//                 </Container>
//             </div>

//             {/* Overdue Payables Container */}
//             <Container
//                 title="Overdue Payables"
//                 description="Pending payments to suppliers"
//                 action={<HeaderButton text="Pay Now" href="/payables" />}
//                 variant="elevated"
//                 footer={
//                     <Link href="/payables" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline">
//                         View all payables <ArrowRight className="h-3 w-3" />
//                     </Link>
//                 }
//             >
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-sm text-left">
//                         <thead className="text-xs text-neutral-500 uppercase bg-neutral-50">
//                             <tr>
//                                 <th className="px-4 py-3 rounded-l-lg">Supplier</th>
//                                 <th className="px-4 py-3">Invoice</th>
//                                 <th className="px-4 py-3">Amount</th>
//                                 <th className="px-4 py-3">Due Date</th>
//                                 <th className="px-4 py-3 rounded-r-lg">Status</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-neutral-100">
//                             <tr className="hover:bg-neutral-50">
//                                 <td className="px-4 py-3 font-medium text-neutral-700">MediSupply Co.</td>
//                                 <td className="px-4 py-3 text-neutral-500">INV-2024-089</td>
//                                 <td className="px-4 py-3 font-medium text-neutral-900">₹45,000</td>
//                                 <td className="px-4 py-3 text-neutral-500">Jul 10, 2026</td>
//                                 <td className="px-4 py-3">
//                                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-700">
//                                         8 days overdue
//                                     </span>
//                                 </td>
//                             </tr>
//                         </tbody>
//                     </table>
//                 </div>
//             </Container>
//         </div>
//     );
// }

// const TONE_STYLES: Record<string, { bg: string; icon: string; value: string }> = {
//     primary: { bg: "bg-primary-50", icon: "text-primary-600", value: "text-neutral-900" },
//     indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", value: "text-neutral-900" },
//     secondary: { bg: "bg-secondary-50", icon: "text-secondary-600", value: "text-neutral-900" },
//     amber: { bg: "bg-amber-50", icon: "text-amber-600", value: "text-amber-600" },
// };

// function StatCard({
//     label,
//     value,
//     sub,
//     icon: Icon,
//     tone = "primary",
// }: {
//     label: string;
//     value: string | number;
//     sub?: string;
//     icon: React.ElementType;
//     tone?: keyof typeof TONE_STYLES;
// }) {
//     const styles = TONE_STYLES[tone];
//     return (
//         <Container variant="flat" size="sm" noHeaderDivider>
//             <div className="flex items-start justify-between">
//                 <div>
//                     <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
//                     <p className={`mt-1 text-2xl font-semibold ${styles.value}`}>{value}</p>
//                     {sub && <p className="text-xs text-neutral-400">{sub}</p>}
//                 </div>
//                 <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.bg}`}>
//                     <Icon className={`h-4.5 w-4.5 ${styles.icon}`} />
//                 </div>
//             </div>
//         </Container>
//     );
// }