'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Factory,
  Users,
  ClipboardList,
  Undo2,
  BookOpenText,
  ShoppingBag,
  Receipt,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// Grouped so "Orders & Invoices" (the day-to-day workflow) is visually
// separated from "Directory" (master data you set up once, then reference).
const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Orders & Invoices',
    items: [
      {
        href: '/purchase-orders/registered',
        label: 'Purchase Registered',
        description: 'Consolidated report & export',
        icon: BookOpenText,
      },
      {
        href: '/purchase-orders/purchase-invoices',
        label: 'Purchase Invoices',
        description: 'GRNs & supplier payments',
        icon: Receipt,
      },
      {
        href: '/purchase-orders/return',
        label: 'Purchase Return',
        description: 'Returns & debit notes to suppliers',
        icon: Undo2,
      },
      
    ],
  },
  {
    title: 'Directory',
    items: [
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
    ],
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

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                // Exact match for the list root (/purchase-orders) so it doesn't
                // stay highlighted while on /purchase-orders/registered etc.
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/purchase-orders' && pathname?.startsWith(item.href + '/'));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}