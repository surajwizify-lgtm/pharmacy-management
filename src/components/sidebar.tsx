'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Image from "next/image";
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
  PanelLeftClose,
  PanelLeftOpen,
  Users2,
} from "lucide-react";

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  roles: string[];
  icon: React.ElementType;
  children?: NavChild[];
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', roles: ["SUPER_ADMIN"], icon: LayoutDashboard },
  { href: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'], icon: LayoutDashboard },
  {
    href: '/', label: 'Inventory', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'], icon: Package, children: [
      { href: '/products', label: 'Products & Services' },
      { href: '/batches', label: 'Batches & Stock' },
      { href: '/batches/locations', label: 'Racks/Locations' },
    ],
  },
  {
    href: '/', label: 'Inventory', roles: ["SUPER_ADMIN"], icon: Package, children: [
      { href: '/products', label: 'Products & Services' },
    ],
  },
  {
    href: '/billing', label: 'Sales & Payments', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'], icon: Receipt, children: [
      { href: '/billing/all-sales', label: 'Invoices' },
      { href: '/billing/sale-returns', label: 'Sale Returns' },
      { href: '/billing/customers', label: 'Customers' },
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
    label: 'GST',
    roles: ['ADMIN', 'PHARMACIST', 'CASHIER'],
    icon: FileText,
    children: [
      { href: '/gst/summary', label: 'Summary' },
    ],
  },
  { href: '/doctors', label: 'Doctors', roles: ['ADMIN', 'PHARMACIST', 'CASHIER', "SUPER_ADMIN"], icon: Stethoscope },
  { href: '/hospitals', label: 'Hospitals', roles: ['ADMIN', 'PHARMACIST', 'CASHIER', "SUPER_ADMIN"], icon: Building2 },
  { href: '/users', label: 'Users', roles: ['ADMIN', "SUPER_ADMIN"], icon: Users2 },
  { href: '/pharmacies', label: 'Pharmacies', roles: ["SUPER_ADMIN"], icon: Users },
];

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-gold-100 text-gold-600 ring-1 ring-gold-500/30',
  PHARMACIST: 'bg-secondary-100 text-secondary-700 ring-1 ring-secondary-500/25',
  CASHIER: 'bg-sky-100 text-sky-700 ring-1 ring-sky-500/25',
};
type SidebarProps = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

export function Sidebar({
  collapsed,
  setCollapsed,
}: SidebarProps) {
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
    <div>

      <div className={clsx("fixed  top-3 z-100", collapsed ? "left-1" : "left-2")}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-2 hover:bg-neutral-100 transition"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>
      <aside
        className={clsx(
          "fixed flex h-screen flex-col p-2  border-surface-200 bg-white transition-all duration-300",
          collapsed ? "w-0" : "w-64 border-r"
        )}
      >

        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-500/[0.06] blur-[90px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-secondary-500/[0.05] blur-[90px]" />
        {!collapsed && <div className="relative flex items-center gap-3">
          <div className="relative w-full h-[100px] flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">
            <Image
              src="/logo.png"
              alt="Pharmacy POS Logo"
              fill
              className="object-cover w-full p-1"
              priority
            />
          </div>
        </div>}

        {!collapsed && <div className="relative mx-5 h-px bg-surface-200" />}
        {!collapsed && <nav className="relative flex-1 space-y-0.5 overflow-y-auto py-4">
          {NAV_ITEMS.filter((item) => !role || item.roles.includes(role)).map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 pl-4 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                  )}
                >
                  <span
                    className={clsx(
                      'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary-500 to-accent-500 transition-all duration-200',
                      active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <Icon
                    className={clsx(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      active ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600',
                    )}
                  />
                  {item.label}
                </Link>
              );
            }
            const isOpen = openMenus[item.href] ?? active;
            return (
              <div key={item.href}>
                <button
                  type="button"
                  onClick={() => toggleMenu(item.href)}
                  aria-expanded={isOpen}
                  className={clsx(
                    'group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 pl-4 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                  )}
                >
                  <span
                    className={clsx(
                      'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary-500 to-accent-500 transition-all duration-200',
                      active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="flex items-center gap-3">
                    <Icon
                      className={clsx(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        active ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600',
                      )}
                    />
                    {item.label}
                  </span>
                  <ChevronDown
                    className={clsx(
                      'h-4 w-4 text-neutral-400 transition-transform duration-200',
                      isOpen && 'rotate-180 text-accent-600',
                    )}
                  />
                </button>

                <div
                  className={clsx(
                    'grid overflow-hidden transition-all duration-200 ease-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="min-h-0">
                    <div className="mt-1 ml-[27px] space-y-0.5 border-l border-surface-200 pl-4">
                      {item.children.map((child) => {
                        const childActive =
                          pathname === child.href
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={clsx(
                              'group/child flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
                              childActive
                                ? 'font-medium text-accent-600'
                                : 'text-neutral-500 hover:text-neutral-800',
                            )}
                          >
                            <span
                              className={clsx(
                                'h-1 w-1 shrink-0 rounded-full transition-colors',
                                childActive
                                  ? 'bg-accent-500'
                                  : 'bg-neutral-300 group-hover/child:bg-neutral-400',
                              )}
                            />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>}
        {!collapsed && <div className="relative mx-5 h-px bg-surface-200" />}
        {!collapsed && <div className="relative px-4 py-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 ring-1 ring-surface-200">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 text-xs font-semibold text-white">
              {initials || 'U'}
              {role === 'ADMIN' && (
                <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-gold-500 drop-shadow-[0_0_3px_theme(colors.gold.400/0.8)]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{session?.user?.fullName}</p>
              {role && (
                <span
                  className={clsx(
                    'mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    ROLE_STYLES[role] ?? 'bg-neutral-100 text-neutral-500',
                  )}
                >
                  {role}
                </span>
              )}
            </div>
          </div>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-xs font-medium text-neutral-500 transition-all duration-200 hover:border-danger-300 hover:bg-danger-50 hover:text-danger-600"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>}
      </aside>
    </div>
  );
}