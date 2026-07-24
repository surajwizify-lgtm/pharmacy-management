'use client';
import { useEffect, type ReactNode } from "react";
import Image from "next/image";

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const screen = { width: window.innerWidth, height: window.innerHeight };

    return (
        <div className="relative min-h-screen ">
            {/* Watermark */}
            <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-0 select-none">
                <Image
                    src="/watermark.jpg"
                    alt="Watermark"
                    width={screen.width}
                    height={500}
                    priority
                    className="opacity-10 object-cover"
                />
            </div>

            {/* Page Content */}
            <main className="relative z-10">
                {children}
            </main>
        </div>
    );
}