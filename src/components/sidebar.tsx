'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import clsx from 'clsx';
import {
  ChevronDown,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  FileText,
  Stethoscope,
  Building2,
  Users,
  LogOut,
  Sparkles,
} from 'lucide-react';

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  roles: string[];
  icon: React.ElementType;
  children?: NavChild[];
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'], icon: LayoutDashboard },
  {
    href: '/', label: 'Inventory', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'], icon: Package, children: [
      { href: '/products', label: 'Products & Services' },
      { href: '/batches', label: 'Batches & Stock' },
    ],
  },
  {
    href: '/billing', label: 'Sales & Payments', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'], icon: Receipt, children: [
      { href: '/billing/all-sales', label: 'Invoices' },
      { href: '/billing/sale-returns', label: 'Sale Returns' },
      { href: '/billing/sale-returns', label: 'Customers' },
    ],
  },
  {
    href: '/purchase-orders/registered',
    label: 'Purchase',
    roles: ['ADMIN', 'PHARMACIST', 'CASHIER'],
    icon: ShoppingCart,
    children: [
      { href: '/purchase-orders/registered', label: 'Purchase Orders' },
      { href: '/purchase-orders/purchase-invoices', label: 'Bills' },
      { href: '/purchase-orders/manufacturers', label: 'Manufacturers' },
      { href: '/purchase-orders/suppliers', label: 'Suppliers' },
      { href: '/purchase-orders/return', label: 'Supplier Return' },
    ],
  },
  {
    href: '/gst/summary',
    label: 'Gst',
    roles: ['ADMIN', 'PHARMACIST', 'CASHIER'],
    icon: FileText,
    children: [
      { href: '/gst/summary', label: 'Summary' },
    ],
  },
  { href: '/doctors', label: 'Doctors', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'], icon: Stethoscope },
  { href: '/hospitals', label: 'Hospitals', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'], icon: Building2 },
  { href: '/users', label: 'Users', roles: ['ADMIN'], icon: Users },
];

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/30',
  PHARMACIST: 'bg-secondary-500/15 text-secondary-400 ring-1 ring-secondary-500/30',
  CASHIER: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    '/purchase-orders/registered': pathname?.startsWith('/purchase-orders') ?? false,
  });

  function toggleMenu(href: string) {
    setOpenMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  const initials = session?.user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="fixed flex h-screen w-64 flex-col overflow-hidden bg-surface-900">
      {/* Ambient glow accents */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primary-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-56 w-56 rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Brand */}
      <div className="relative flex items-center gap-3 px-5 py-6">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-700 text-sm font-bold text-white shadow-lg shadow-primary-900/50">
          <span className="relative z-10">Rx</span>
          <div className="absolute inset-0 rounded-2xl bg-overlay-white" />
        </div>
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-white">Pharmacy POS</p>
          <p className="text-[11px] text-neutral-500">Management Console</p>
        </div>
      </div>

      <div className="relative mx-5 h-px bg-gradient-to-r from-transparent via-surface-200/10 to-transparent" />

      {/* Nav */}
      <nav className="relative flex-1 space-y-0.5 overflow-auto px-3 py-4">
        {NAV_ITEMS.filter((item) => !role || item.roles.includes(role)).map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          if (!item.children) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-primary-600/20 to-indigo-600/10 text-white ring-1 ring-primary-500/20'
                    : 'text-neutral-400 hover:bg-overlay-white hover:text-neutral-100',
                )}
              >
                <Icon
                  className={clsx(
                    'h-[18px] w-[18px] shrink-0 transition-colors',
                    active ? 'text-primary-400' : 'text-neutral-500 group-hover:text-neutral-300',
                  )}
                />
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_theme(colors.primary.400)]" />
                )}
              </Link>
            );
          }

          const isOpen = openMenus[item.href] ?? active;

          return (
            <div key={item.href}>
              <button
                type="button"
                onClick={() => toggleMenu(item.href)}
                className={clsx(
                  'group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-primary-600/20 to-indigo-600/10 text-white ring-1 ring-primary-500/20'
                    : 'text-neutral-400 hover:bg-overlay-white hover:text-neutral-100',
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      active ? 'text-primary-400' : 'text-neutral-500 group-hover:text-neutral-300',
                    )}
                  />
                  {item.label}
                </span>
                <ChevronDown
                  className={clsx(
                    'h-4 w-4 text-neutral-500 transition-transform duration-200',
                    isOpen && 'rotate-180 text-primary-400',
                  )}
                />
              </button>

              {isOpen && (
                <div className="mt-1 ml-[26px] space-y-0.5 border-l border-surface-200/10 pl-4">
                  {item.children.map((child) => {
                    const childActive =
                      pathname === child.href || pathname?.startsWith(child.href + '/');
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={clsx(
                          'block rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
                          childActive
                            ? 'font-medium text-primary-400'
                            : 'text-neutral-500 hover:text-neutral-200',
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="relative mx-5 h-px bg-gradient-to-r from-transparent via-surface-200/10 to-transparent" />

      {/* User / sign out */}
      <div className="relative px-4 py-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-overlay-white px-3 py-2.5">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 text-xs font-semibold text-white">
            {initials || 'U'}
            {role === 'ADMIN' && (
              <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-gold-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{session?.user?.fullName}</p>
            {role && (
              <span
                className={clsx(
                  'mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  ROLE_STYLES[role] ?? 'bg-neutral-800 text-neutral-400',
                )}
              >
                {role}
              </span>
            )}
          </div>
        </div>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200/10 bg-overlay-white px-3 py-2.5 text-xs font-medium text-neutral-300 transition-all duration-200 hover:border-danger-500/30 hover:bg-danger-600/15 hover:text-danger-400"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}