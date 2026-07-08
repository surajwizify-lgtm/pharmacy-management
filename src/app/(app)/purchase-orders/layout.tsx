import PurchaseSidebar from '@/components/PurchaseSidebar';

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <PurchaseSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}