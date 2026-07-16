// import { getServerSession } from 'next-auth';
// import { redirect } from 'next/navigation';
// import { authOptions } from '@/lib/auth';
// import { Sidebar } from '@/components/sidebar';

// export default async function AppLayout({ children }: { children: React.ReactNode }) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user) {
//     redirect('/login');
//   }

//   return (
//     <div className="flex min-h-screen">
//       <Sidebar />
//       <main className="flex-1 pl-[265px] overflow-y-auto pr-2 py-3 ">{children}</main>
//     </div>
//   );
// }
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}