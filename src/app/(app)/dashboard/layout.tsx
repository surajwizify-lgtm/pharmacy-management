

import type { ReactNode } from "react";
import Image from "next/image";

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="relative min-h-screen">
            <div className="pointer-events-none fixed inset-0 z-0 select-none">
                <Image
                    src="/watermark.jpg"
                    alt="Watermark"
                    fill
                    priority
                    className="object-cover opacity-10"
                />
            </div>

            <main className="relative z-10">
                {children}
            </main>
        </div>
    );
}