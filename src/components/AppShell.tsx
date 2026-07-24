"use client";

import { useState } from "react";
import clsx from "clsx";
import { Sidebar } from "@/components/sidebar";

export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />

            <main
                className={clsx(
                    "flex-1 overflow-y-auto transition-all duration-300",
                    collapsed ? "ml-0" : "ml-64"
                )}
            >
                {children}
            </main>
        </div>
    );
}