"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Plus, Package, Receipt, IndianRupee, AlertTriangle, Clock,
    ArrowRight, TrendingUp, TrendingDown, Activity, Pill, Calendar,
    Search, Bell, Settings, User, BarChart3, FileText, Users,
    ShieldAlert, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight,
    MoreHorizontal, Printer, Eye, ChevronDown, Menu, X, HeartPulse,
    Zap, ChevronUp,
} from "lucide-react";

// ============================================
// TYPE DEFINITIONS
// ============================================
interface StatCardProps {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; tone: "primary" | "success" | "warning" | "error" | "info" | "neutral";
    trend?: { value: number; direction: "up" | "down" | "neutral" };
}

interface LowStockItem {
    id: string; name: string; totalStock: number; category: string;
    reorderPoint: number; sku: string;
}

interface ExpiringBatch {
    id: string; batchNumber: string; product: { name: string };
    expiryDate: string; quantityAvailable: number; daysUntilExpiry: number; mrp: number;
}

export interface RecentBill {
    id: string; billNumber: string; customerName: string;
    totalAmount: number; billDate: string;
    status: "completed" | "pending" | "cancelled";
    items: number; paymentMethod: string;
}

export interface DashboardProps {
    stats?: {
        productCount?: number;
        activeProducts?: number;
        billsToday?: number;
        revenueToday?: number | null;
        lowStockCount?: number;
        expiringCount?: number;
        totalCustomers?: number;
        pendingOrders?: number;
    };
    lowStock?: LowStockItem[];
    expiringBatches?: ExpiringBatch[];
    recentBills?: RecentBill[];
    userName?: string | null;
    userRole?: string | null;
}

// ============================================
// SAFE DEFAULTS
// ============================================
const DEFAULT_STATS = {
    productCount: 0, activeProducts: 0, billsToday: 0,
    revenueToday: 0, lowStockCount: 0, expiringCount: 0,
    totalCustomers: 0, pendingOrders: 0,
};

const DEFAULT_LOW_STOCK: LowStockItem[] = [];
const DEFAULT_EXPIRING: ExpiringBatch[] = [];
const DEFAULT_BILLS: RecentBill[] = [];

// ============================================
// TONE STYLES
// ============================================
const TONE_STYLES: Record<string, { bgSoft: string; icon: string; accent: string; text: string }> = {
    primary: { bgSoft: "bg-[#2563eb]/8", icon: "text-[#2563eb]", accent: "bg-[#2563eb]", text: "text-[#1a1a2e]" },
    success: { bgSoft: "bg-[#059669]/8", icon: "text-[#059669]", accent: "bg-[#059669]", text: "text-[#1a1a2e]" },
    warning: { bgSoft: "bg-[#d97706]/8", icon: "text-[#d97706]", accent: "bg-[#d97706]", text: "text-[#d97706]" },
    error: { bgSoft: "bg-[#dc2626]/8", icon: "text-[#dc2626]", accent: "bg-[#dc2626]", text: "text-[#1a1a2e]" },
    info: { bgSoft: "bg-[#0d9488]/8", icon: "text-[#0d9488]", accent: "bg-[#0d9488]", text: "text-[#1a1a2e]" },
    neutral: { bgSoft: "bg-[#f1f5f9]", icon: "text-[#4a5568]", accent: "bg-[#4a5568]", text: "text-[#1a1a2e]" },
};

const STATUS_STYLES: Record<string, string> = {
    completed: "bg-[#059669]/8 text-[#059669] border-[#059669]/15",
    pending: "bg-[#d97706]/8 text-[#d97706] border-[#d97706]/15",
    cancelled: "bg-[#dc2626]/8 text-[#dc2626] border-[#dc2626]/15",
    active: "bg-[#059669]/8 text-[#059669] border-[#059669]/15",
    critical: "bg-[#991b1b]/8 text-[#991b1b] border-[#991b1b]/15",
    controlled: "bg-[#7c3aed]/8 text-[#7c3aed] border-[#7c3aed]/15",
    processing: "bg-[#2563eb]/8 text-[#2563eb] border-[#2563eb]/15",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
    completed: CheckCircle2, pending: Clock, cancelled: XCircle,
    critical: ShieldAlert, controlled: ShieldAlert, processing: Zap,
};

// ============================================
// UTILITY COMPONENTS
// ============================================
function Card({ children, className = "", padding = "normal", hover = false }: {
    children: React.ReactNode; className?: string; padding?: "none" | "normal" | "large"; hover?: boolean;
}) {
    const p = { none: "", normal: "p-5", large: "p-6" };
    return (
        <div className={`bg-white rounded-xl border border-[#f1f5f9] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] ${p[padding]} ${hover ? "hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#e2e8f0] hover:-translate-y-0.5 transition-all duration-300" : ""} ${className}`}>
            {children}
        </div>
    );
}

function Badge({ children, status = "active", dot = false }: {
    children: React.ReactNode; status?: string; dot?: boolean;
}) {
    const Icon = STATUS_ICONS[status] || CheckCircle2;
    return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full border text-[11px] px-2 py-0.5 ${STATUS_STYLES[status] || STATUS_STYLES.active}`}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${status === "completed" ? "bg-[#059669]" : status === "pending" ? "bg-[#d97706]" : "bg-[#dc2626]"}`} />}
            <Icon className="w-3 h-3" /> {children}
        </span>
    );
}

function SectionHeader({ title, icon: Icon, action, badge }: {
    title: string; icon: React.ElementType; action?: { label: string; href: string }; badge?: { count: number; tone: string };
}) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#f1f5f9] flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-[#4a5568]" />
                </div>
                <h2 className="text-[15px] font-semibold text-[#1a1a2e] tracking-tight">{title}</h2>
                {badge && <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.tone === "warning" ? "bg-[#d97706]/10 text-[#d97706]" : "bg-[#dc2626]/10 text-[#dc2626]"}`}>{badge.count}</span>}
            </div>
            {action && (
                <Link href={action.href} className="inline-flex items-center gap-1 text-xs font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors group">
                    {action.label} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            )}
        </div>
    );
}

function ProgressBar({ value, max, tone = "primary" }: { value: number; max: number; tone?: string }) {
    const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;
    const safeMax = typeof max === "number" && max > 0 ? max : 1;
    const pct = Math.min((safeValue / safeMax) * 100, 100);
    const colors: Record<string, string> = { primary: "bg-[#2563eb]", success: "bg-[#059669]", warning: "bg-[#d97706]", error: "bg-[#dc2626]", critical: "bg-[#991b1b]" };
    return (
        <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${colors[tone] || colors.primary}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

// ============================================
// MAIN COMPONENTS
// ============================================
function StatCard({ label, value, sub, icon: Icon, tone, trend }: StatCardProps) {
    const s = TONE_STYLES[tone];
    const safeValue = value !== undefined && value !== null ? value : "--";
    return (
        <Card hover className="relative overflow-hidden group">
            <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4a5568]">{label}</p>
                    <p className={`text-[26px] font-bold tracking-tight ${tone === "warning" || tone === "error" ? s.text : "text-[#1a1a2e]"}`}>{safeValue}</p>
                    {sub && <p className="text-xs text-[#4a5568]">{sub}</p>}
                    {trend && (
                        <div className="flex items-center gap-1 mt-1.5">
                            {trend.direction === "up" ? <ArrowUpRight className="w-3.5 h-3.5 text-[#059669]" /> : trend.direction === "down" ? <ArrowDownRight className="w-3.5 h-3.5 text-[#dc2626]" /> : <Activity className="w-3.5 h-3.5 text-[#4a5568]" />}
                            <span className={`text-xs font-semibold ${trend.direction === "up" ? "text-[#059669]" : trend.direction === "down" ? "text-[#dc2626]" : "text-[#4a5568]"}`}>{trend.value}%</span>
                            <span className="text-xs text-[#4a5568]">vs yesterday</span>
                        </div>
                    )}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.bgSoft} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 ${s.icon}`} />
                </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${s.accent} opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className={`absolute -top-8 -right-8 w-16 h-16 rounded-full ${s.bgSoft} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
        </Card>
    );
}

function QuickStatPill({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: string }) {
    const s = TONE_STYLES[tone];
    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#f1f5f9] hover:border-[#e2e8f0] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 cursor-pointer group">
            <div className={`w-9 h-9 rounded-lg ${s.bgSoft} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-4 h-4 ${s.icon}`} />
            </div>
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4a5568]">{label}</p>
                <p className="text-sm font-bold text-[#1a1a2e]">{value || "--"}</p>
            </div>
        </div>
    );
}

function LowStockCard({ items }: { items?: LowStockItem[] }) {
    const safeItems = Array.isArray(items) ? items : [];
    return (
        <Card padding="none" className="overflow-hidden">
            <div className="p-5 pb-3">
                <SectionHeader title="Low Stock Alert" icon={AlertTriangle} action={{ label: "View all", href: "/products" }} badge={safeItems.length > 0 ? { count: safeItems.length, tone: "warning" } : undefined} />
            </div>
            {safeItems.length === 0 ? (
                <div className="px-5 pb-5">
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-14 h-14 rounded-full bg-[#059669]/8 flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-7 h-7 text-[#059669]" />
                        </div>
                        <p className="text-sm font-semibold text-[#1a1a2e]">All products well stocked</p>
                        <p className="text-xs text-[#4a5568] mt-1">No items below reorder point</p>
                    </div>
                </div>
            ) : (
                <div className="px-2 pb-2">
                    <div className="space-y-0.5">
                        {safeItems.map((item) => {
                            if (!item) return null;
                            const isCritical = (item.totalStock ?? 0) <= 5;
                            const isLow = (item.totalStock ?? 0) <= 10;
                            return (
                                <div key={item.id || Math.random()} className="flex flex-col gap-2 px-3 py-3 rounded-lg hover:bg-[#f8fafc] transition-colors group cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCritical ? "bg-[#dc2626]/8" : isLow ? "bg-[#d97706]/8" : "bg-[#f1f5f9]"}`}>
                                                <Pill className={`w-4 h-4 ${isCritical ? "text-[#dc2626]" : isLow ? "text-[#d97706]" : "text-[#4a5568]"}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-[#1a1a2e] truncate">{item.name || "Unknown Product"}</p>
                                                <p className="text-[11px] text-[#4a5568] font-mono">{item.sku || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[11px] text-[#4a5568] uppercase tracking-wider font-semibold">Stock</p>
                                                <p className={`text-sm font-bold ${isCritical ? "text-[#dc2626]" : isLow ? "text-[#d97706]" : "text-[#1a1a2e]"}`}>{item.totalStock ?? 0} <span className="text-[#4a5568] font-normal">/ {item.reorderPoint ?? 10}</span></p>
                                            </div>
                                            <Badge status={isCritical ? "critical" : isLow ? "warning" : "active"} dot>{(item.totalStock ?? 0)} left</Badge>
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-[#f1f5f9] rounded-lg">
                                                <MoreHorizontal className="w-4 h-4 text-[#4a5568]" />
                                            </button>
                                        </div>
                                    </div>
                                    <ProgressBar value={item.totalStock ?? 0} max={(item.reorderPoint ?? 10) * 2} tone={isCritical ? "critical" : isLow ? "warning" : "primary"} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
}

function ExpiringSoonCard({ batches }: { batches?: ExpiringBatch[] }) {
    const safeBatches = Array.isArray(batches) ? batches : [];
    return (
        <Card padding="none" className="overflow-hidden">
            <div className="p-5 pb-3">
                <SectionHeader title="Expiring Soon" icon={Clock} action={{ label: "View all", href: "/batches" }} badge={safeBatches.length > 0 ? { count: safeBatches.length, tone: "error" } : undefined} />
            </div>
            {safeBatches.length === 0 ? (
                <div className="px-5 pb-5">
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-14 h-14 rounded-full bg-[#059669]/8 flex items-center justify-center mb-3">
                            <Calendar className="w-7 h-7 text-[#059669]" />
                        </div>
                        <p className="text-sm font-semibold text-[#1a1a2e]">No expiring batches</p>
                        <p className="text-xs text-[#4a5568] mt-1">Nothing expires in next 90 days</p>
                    </div>
                </div>
            ) : (
                <div className="px-2 pb-2">
                    <div className="space-y-0.5">
                        {safeBatches.map((batch) => {
                            if (!batch) return null;
                            const isCritical = (batch.daysUntilExpiry ?? 999) <= 7;
                            const isWarning = (batch.daysUntilExpiry ?? 999) <= 30;
                            const productName = batch.product?.name ?? "Unknown Product";
                            return (
                                <div key={batch.id || Math.random()} className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-[#f8fafc] transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCritical ? "bg-[#dc2626]/8" : isWarning ? "bg-[#d97706]/8" : "bg-[#f1f5f9]"}`}>
                                            <Calendar className={`w-4 h-4 ${isCritical ? "text-[#dc2626]" : isWarning ? "text-[#d97706]" : "text-[#4a5568]"}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[#1a1a2e] truncate">{productName}</p>
                                            <p className="text-[11px] text-[#4a5568] font-mono">Batch: {batch.batchNumber || "N/A"} · Qty: {batch.quantityAvailable ?? 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs font-semibold text-[#1a1a2e]">{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</p>
                                            <p className="text-[11px] text-[#4a5568]">MRP: ₹{batch.mrp ?? 0}</p>
                                        </div>
                                        <Badge status={isCritical ? "critical" : isWarning ? "warning" : "active"} dot>{batch.daysUntilExpiry ?? 0}d</Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
}

function RecentBillsCard({ bills }: { bills?: RecentBill[] }) {
    const safeBills = Array.isArray(bills) ? bills : [];
    return (
        <Card padding="none" className="overflow-hidden">
            <div className="p-5 pb-3">
                <SectionHeader title="Recent Bills" icon={Receipt} action={{ label: "View all", href: "/billing/all-sales" }} />
            </div>
            <div className="px-2 pb-2">
                <div className="space-y-0.5">
                    {safeBills.map((bill, index) => {
                        if (!bill) return null;
                        const amount = typeof bill.totalAmount === "number" && !isNaN(bill.totalAmount) ? bill.totalAmount : 0;
                        return (
                            <div key={bill.id || index} className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-[#f8fafc] transition-all duration-200 group cursor-pointer" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-[#f1f5f9] flex items-center justify-center shrink-0 group-hover:bg-[#2563eb]/8 transition-colors">
                                        <Receipt className="w-4 h-4 text-[#4a5568] group-hover:text-[#2563eb] transition-colors" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[#1a1a2e] truncate">{bill.billNumber || "Unknown"}</p>
                                        <p className="text-[11px] text-[#4a5568]">{bill.customerName || "Unknown"} · {bill.items ?? 0} items · {bill.paymentMethod || "Cash"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#1a1a2e] font-mono tabular-nums">₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                                        <Badge status={bill.status || "pending"} dot>{bill.status || "pending"}</Badge>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 hover:bg-[#f1f5f9] rounded-lg transition-colors"><Eye className="w-4 h-4 text-[#4a5568]" /></button>
                                        <button className="p-1.5 hover:bg-[#f1f5f9] rounded-lg transition-colors"><Printer className="w-4 h-4 text-[#4a5568]" /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}

function RevenueChart() {
    const data = [
        { day: "Mon", value: 65, label: "₹12,450", fullDate: "15 Jul" },
        { day: "Tue", value: 85, label: "₹16,280", fullDate: "16 Jul" },
        { day: "Wed", value: 45, label: "₹8,620", fullDate: "17 Jul" },
        { day: "Thu", value: 90, label: "₹17,240", fullDate: "18 Jul" },
        { day: "Fri", value: 70, label: "₹13,400", fullDate: "19 Jul" },
        { day: "Sat", value: 55, label: "₹10,540", fullDate: "20 Jul" },
        { day: "Sun", value: 30, label: "₹5,740", fullDate: "21 Jul" },
    ];
    const maxValue = Math.max(...data.map(d => d.value));
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);

    return (
        <Card className="overflow-hidden">
            <SectionHeader title="Revenue Overview" icon={BarChart3} action={{ label: "Report", href: "/reports" }} />
            <div className="mt-4">
                <div className="flex items-end justify-between gap-3 h-44">
                    {data.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2 relative">
                            <div className="relative w-full group cursor-pointer" onMouseEnter={() => setHoveredBar(index)} onMouseLeave={() => setHoveredBar(null)}>
                                <div className="w-full rounded-t-lg bg-[#2563eb]/10 hover:bg-[#2563eb]/20 transition-all duration-300 relative" style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: "4px" }}>
                                    <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-[#2563eb] transition-all duration-300" style={{ height: "100%", opacity: hoveredBar === index ? 0.8 : 0.5 }} />
                                </div>
                                <div className={`absolute -top-14 left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none transition-all duration-200 z-10 ${hoveredBar === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
                                    <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider">{item.fullDate}</div>
                                    <div className="text-sm font-bold">{item.label}</div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a2e] rotate-45" />
                                </div>
                            </div>
                            <span className="text-[11px] text-[#4a5568] font-medium">{item.day}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#f1f5f9]">
                    <div>
                        <p className="text-[11px] text-[#4a5568] uppercase tracking-wider font-semibold">Total this week</p>
                        <p className="text-xl font-bold text-[#1a1a2e] font-mono tabular-nums mt-0.5">₹84,270</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#059669]/8 px-3 py-1.5 rounded-full">
                        <ArrowUpRight className="w-4 h-4 text-[#059669]" />
                        <span className="text-sm font-bold text-[#059669]">12.5%</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

function QuickActions() {
    const actions = [
        { icon: Plus, label: "New Bill", href: "/billing/all-sales/new", color: "bg-[#2563eb]", desc: "Create invoice" },
        { icon: Package, label: "Add Product", href: "/products/new", color: "bg-[#059669]", desc: "Inventory" },
        { icon: Users, label: "Add Customer", href: "/customers/new", color: "bg-[#0d9488]", desc: "CRM" },
        { icon: FileText, label: "Purchase Order", href: "/purchases/new", color: "bg-[#7c3aed]", desc: "Procurement" },
    ];
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {actions.map((action) => (
                <Link key={action.label} href={action.href} className="flex items-center gap-3.5 p-4 bg-white rounded-xl border border-[#f1f5f9] hover:border-[#e2e8f0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 group">
                    <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300`}>
                        <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-[#1a1a2e] group-hover:text-[#2563eb] transition-colors block">{action.label}</span>
                        <span className="text-[11px] text-[#4a5568] uppercase tracking-wider font-medium">{action.desc}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
}

function TopNav({ userName, userRole }: { userName?: string | null; userRole?: string | null }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const safeName = typeof userName === "string" ? userName : "Pharmacist";
    const safeRole = typeof userRole === "string" ? userRole : "User";
    const firstName = safeName.split(" ")[0] || safeName;

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#f1f5f9]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#2563eb] flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                            <HeartPulse className="w-5 h-5 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold text-[#1a1a2e] tracking-tight leading-none">PharmacyPro</h1>
                            <p className="text-[10px] text-[#4a5568] font-semibold uppercase tracking-wider leading-none mt-0.5">Management System</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
                        <div className={`relative w-full transition-all duration-300 ${searchFocused ? "scale-[1.02]" : ""}`}>
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                            <input type="text" placeholder="Search products, bills, customers..." onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#f1f5f9] rounded-xl text-sm text-[#1a1a2e] placeholder:text-[#4a5568]/50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15 focus:border-[#2563eb]/25 transition-all" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <span className="text-[10px] text-[#4a5568] bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">⌘K</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="relative p-2.5 hover:bg-[#f8fafc] rounded-xl transition-colors">
                            <Bell className="w-5 h-5 text-[#4a5568]" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#dc2626] rounded-full border-2 border-white" />
                        </button>
                        <button className="p-2.5 hover:bg-[#f8fafc] rounded-xl transition-colors">
                            <Settings className="w-5 h-5 text-[#4a5568]" />
                        </button>
                        <div className="flex items-center gap-2.5 pl-3 ml-2 border-l border-[#f1f5f9]">
                            <div className="w-9 h-9 rounded-full bg-[#2563eb]/10 flex items-center justify-center border-2 border-[#2563eb]/20">
                                <User className="w-4 h-4 text-[#2563eb]" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-[#1a1a2e] leading-none">{safeName}</p>
                                <p className="text-[11px] text-[#4a5568] leading-none mt-1 uppercase tracking-wider font-medium">{safeRole}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-[#4a5568] hidden sm:block" />
                        </div>
                        <button className="md:hidden p-2.5 hover:bg-[#f8fafc] rounded-xl transition-colors ml-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X className="w-5 h-5 text-[#4a5568]" /> : <Menu className="w-5 h-5 text-[#4a5568]" />}
                        </button>
                    </div>
                </div>
            </div>
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-[#f1f5f9] bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
                        <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#f1f5f9] rounded-xl text-sm text-[#1a1a2e] placeholder:text-[#4a5568]/50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[{ icon: Plus, label: "New Bill", color: "bg-[#2563eb]" }, { icon: Package, label: "Products", color: "bg-[#059669]" }, { icon: Users, label: "Customers", color: "bg-[#0d9488]" }, { icon: FileText, label: "Orders", color: "bg-[#7c3aed]" }].map((item) => (
                            <button key={item.label} className="flex items-center gap-2 p-3 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors">
                                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}><item.icon className="w-4 h-4 text-white" /></div>
                                <span className="text-sm font-medium text-[#1a1a2e]">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}

function ActivityFeed() {
    const activities = [
        { icon: CheckCircle2, text: "Bill BILL-2024-001 completed", time: "2 min ago", tone: "success" as const },
        { icon: Package, text: "Stock updated for Paracetamol", time: "15 min ago", tone: "primary" as const },
        { icon: AlertTriangle, text: "Low stock alert: Amoxicillin", time: "32 min ago", tone: "warning" as const },
        { icon: Users, text: "New customer registered", time: "1 hr ago", tone: "info" as const },
        { icon: Clock, text: "Batch BTH-2024-015 expiring soon", time: "2 hr ago", tone: "error" as const },
    ];
    return (
        <Card padding="none" className="overflow-hidden">
            <div className="p-5 pb-3">
                <SectionHeader title="Activity Feed" icon={Activity} action={{ label: "View all", href: "/activity" }} />
            </div>
            <div className="px-2 pb-2">
                <div className="space-y-0.5">
                    {activities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${activity.tone === "success" ? "bg-[#059669]/8" : activity.tone === "warning" ? "bg-[#d97706]/8" : activity.tone === "error" ? "bg-[#dc2626]/8" : activity.tone === "info" ? "bg-[#0d9488]/8" : "bg-[#2563eb]/8"}`}>
                                <activity.icon className={`w-4 h-4 ${activity.tone === "success" ? "text-[#059669]" : activity.tone === "warning" ? "text-[#d97706]" : activity.tone === "error" ? "text-[#dc2626]" : activity.tone === "info" ? "text-[#0d9488]" : "text-[#2563eb]"}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-[#1a1a2e] font-medium">{activity.text}</p>
                                <p className="text-[11px] text-[#4a5568] mt-0.5">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

function TopProducts() {
    const products = [
        { name: "Paracetamol 500mg", sales: 1245, revenue: 62250, trend: "up" as const },
        { name: "Amoxicillin 250mg", sales: 892, revenue: 44600, trend: "up" as const },
        { name: "Cetirizine 10mg", sales: 756, revenue: 15120, trend: "down" as const },
        { name: "Vitamin D3 60K", sales: 634, revenue: 38040, trend: "up" as const },
        { name: "Omeprazole 20mg", sales: 521, revenue: 26050, trend: "up" as const },
    ];
    return (
        <Card padding="none" className="overflow-hidden">
            <div className="p-5 pb-3">
                <SectionHeader title="Top Products" icon={BarChart3} action={{ label: "Report", href: "/reports/products" }} />
            </div>
            <div className="px-5 pb-5">
                <div className="space-y-4">
                    {products.map((product, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[11px] font-bold text-[#4a5568]">{index + 1}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-semibold text-[#1a1a2e] truncate">{product.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-[#4a5568]">{product.sales} sold</span>
                                        {product.trend === "up" ? <ArrowUpRight className="w-3 h-3 text-[#059669]" /> : <ArrowDownRight className="w-3 h-3 text-[#dc2626]" />}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ProgressBar value={product.sales} max={1500} tone={index === 0 ? "primary" : index === 1 ? "success" : "neutral"} />
                                    <span className="text-xs font-mono font-semibold text-[#1a1a2e] whitespace-nowrap">₹{product.revenue.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
export default function DashboardPage({
    stats,
    lowStock,
    expiringBatches,
    recentBills,
    userName,
    userRole = "Admin"
}: DashboardProps) {
    const [activeTab, setActiveTab] = useState("overview");

    // Safe defaults for all props
    const safeStats = { ...DEFAULT_STATS, ...(stats || {}) };
    const safeLowStock = Array.isArray(lowStock) ? lowStock : DEFAULT_LOW_STOCK;
    const safeExpiring = Array.isArray(expiringBatches) ? expiringBatches : DEFAULT_EXPIRING;
    const safeBills = Array.isArray(recentBills) ? recentBills : DEFAULT_BILLS;
    const safeUserName = typeof userName === "string" ? userName : "Pharmacist";
    const safeUserRole = typeof userRole === "string" ? userRole : "Admin";

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <TopNav userName={safeUserName} userRole={safeUserRole} />

            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Header with Tabs */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#1a1a2e] tracking-tight">Welcome back, {safeUserName.split(" ")[0] || safeUserName}</h1>
                            <p className="text-[#4a5568] mt-1 text-base leading-relaxed">Here&apos;s what&apos;s happening with your pharmacy today.</p>
                        </div>
                        <div className="flex items-center gap-1 bg-white rounded-xl border border-[#f1f5f9] p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                            {["overview", "analytics", "inventory"].map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab ? "bg-[#1a1a2e] text-white shadow-sm" : "text-[#4a5568] hover:text-[#1a1a2e] hover:bg-[#f8fafc]"}`}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8"><QuickActions /></div>

                {/* Quick Stats Pills */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                    <QuickStatPill label="Total Customers" value={String(safeStats.totalCustomers ?? 0)} icon={Users} tone="primary" />
                    <QuickStatPill label="Pending Orders" value={String(safeStats.pendingOrders ?? 0)} icon={Clock} tone="warning" />
                    <QuickStatPill label="Today's Profit" value="₹8,420" icon={IndianRupee} tone="success" />
                    <QuickStatPill label="Expiring (90d)" value={String(safeStats.expiringCount ?? 0)} icon={Calendar} tone={(safeStats.expiringCount ?? 0) > 0 ? "error" : "neutral"} />
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Active Products" value={safeStats.activeProducts ?? 0} sub={`${safeStats.productCount ?? 0} total products`} icon={Package} tone="primary" trend={{ value: 8.2, direction: "up" }} />
                    <StatCard label="Bills Today" value={safeStats.billsToday ?? 0} icon={Receipt} tone="info" trend={{ value: 12.5, direction: "up" }} />
                    <StatCard label="Revenue Today" value={`₹${Number(safeStats.revenueToday ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} icon={IndianRupee} tone="success" trend={{ value: 5.3, direction: "up" }} />
                    <StatCard label="Low Stock Items" value={safeStats.lowStockCount ?? 0} icon={AlertTriangle} tone={(safeStats.lowStockCount ?? 0) > 0 ? "warning" : "neutral"} trend={(safeStats.lowStockCount ?? 0) > 0 ? { value: 15, direction: "up" } : undefined} />
                </div>

                {/* 2-Column Grid: Low Stock + Expiring */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <LowStockCard items={safeLowStock} />
                    <ExpiringSoonCard batches={safeExpiring} />
                </div>

                {/* 2-Column Grid: Recent Bills + Revenue Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <RecentBillsCard bills={safeBills} />
                    <RevenueChart />
                </div>

                {/* 2-Column Grid: Activity + Top Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ActivityFeed />
                    <TopProducts />
                </div>

                {/* Footer */}
                <footer className="mt-12 pt-8 border-t border-[#f1f5f9]">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <HeartPulse className="w-4 h-4 text-[#2563eb]" />
                            <span className="text-sm font-semibold text-[#1a1a2e]">PharmacyPro</span>
                            <span className="text-xs text-[#4a5568]">v2.4.0</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <Link href="/help" className="text-xs text-[#4a5568] hover:text-[#2563eb] transition-colors">Help Center</Link>
                            <Link href="/privacy" className="text-xs text-[#4a5568] hover:text-[#2563eb] transition-colors">Privacy</Link>
                            <Link href="/terms" className="text-xs text-[#4a5568] hover:text-[#2563eb] transition-colors">Terms</Link>
                            <span className="text-xs text-[#4a5568]">© 2024 PharmacyPro</span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}