
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  roles: string[];
  children?: NavChild[];
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  {
    href: '/', label: 'Inventory', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'], children: [
      { href: '/products', label: 'Products & Services' },
      { href: '/batches', label: 'Batches & Stock' },
    ],
  },
  // { href: '/products', label: 'Products & Services', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  // { href: '/batches', label: 'Batches & Stock', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  {
    href: '/billing', label: 'Sales & Payments', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'], children: [
      { href: '/billing/all-sales', label: 'Invoices' },
      { href: '/billing/sale-returns', label: 'Sale Returns' },
      { href: '/billing/sale-returns', label: 'Customers' },
    ],
  },
  {
    href: '/purchase-orders/registered',
    label: 'Purchase',
    roles: ['ADMIN', 'PHARMACIST', 'CASHIER'],
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
    children: [
      { href: '/gst/summary', label: 'Summary' },
    ],
  },
  { href: '/doctors', label: 'Doctors', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  { href: '/hospitals', label: 'Hospitals', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  { href: '/users', label: 'Users', roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  // Auto-expand the Purchase submenu when you're already on one of its pages.
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    '/purchase-orders/registered': pathname?.startsWith('/purchase-orders') ?? false,
  });

  function toggleMenu(href: string) {
    setOpenMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  return (
    <aside className="flex fixed h-screen w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          Rx
        </div>
        <span className="text-sm font-semibold text-slate-800">Pharmacy POS</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-auto px-3">
        {NAV_ITEMS.filter((item) => !role || item.roles.includes(role)).map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');

          if (!item.children) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
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
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                {item.label}
                <ChevronDown
                  className={clsx('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                />
              </button>

              {isOpen && (
                <div className="mt-1 space-y-1 pl-3">
                  {item.children.map((child) => {
                    const childActive =
                      pathname === child.href || pathname?.startsWith(child.href + '/');
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={clsx(
                          'block rounded-lg px-3 py-1.5 text-sm transition-colors',
                          childActive
                            ? 'bg-brand-50 text-brand-700 font-medium'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
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

      <div className="border-t border-slate-200 px-4 py-4">
        <p className="truncate text-sm font-medium text-slate-800">{session?.user?.fullName}</p>
        <p className="mb-3 text-xs text-slate-500">{session?.user?.role}</p>
        <button className="btn-secondary w-full text-xs" onClick={() => signOut({ callbackUrl: '/login' })}>
          Sign out
        </button>
      </div>
    </aside>
  );
}