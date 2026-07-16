'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Factory,
  Truck,
  Users,
  ClipboardList,
  PackageCheck,
  Undo2,
  BookOpenText,
  ShoppingBag,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [

  {
    href: '/purchase-orders/registered',
    label: 'Purchase Orders',
    description: 'Consolidated report & export',
    icon: BookOpenText,
  },
  {
    href: '/purchase-orders/purchase-invoices',
    label: 'Purchase Invoices',
    description: 'Brand & drug license master',
    icon: Factory,
  },
  {
    href: '/purchase-orders/manufacturers',
    label: 'Manufacturers',
    description: 'Brand & drug license master',
    icon: Factory,
  },
  {
    href: '/purchase-orders/suppliers',
    label: 'Suppliers',
    description: 'Vendor ledger & payment terms',
    icon: Users,
  },
  {
    href: '/purchase-orders/return',
    label: 'Supplier Return',
    description: 'Vendor ledger & payment terms',
    icon: Users,
  },
];

export default function PurchaseSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-100 bg-white">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <ShoppingBag className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Purchase Module</p>
          <p className="text-xs text-slate-400">Vendors, stock & GST</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-500'
                  }`}
              />
              <span className="flex flex-col">
                <span className={`font-medium ${isActive ? 'text-brand-700' : 'text-slate-700'}`}>
                  {item.label}
                </span>
                <span className="text-xs text-slate-400">{item.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
