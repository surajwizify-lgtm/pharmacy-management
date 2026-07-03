'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  { href: '/medicines', label: 'Medicines', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  { href: '/batches', label: 'Batches & Stock', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  { href: '/billing', label: 'Billing', roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
  { href: '/users', label: 'Users', roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          Rx
        </div>
        <span className="text-sm font-semibold text-slate-800">Pharmacy POS</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.filter((item) => !role || item.roles.includes(role)).map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
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
