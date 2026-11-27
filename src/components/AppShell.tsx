"use client";

import { useState } from "react";
import clsx from "clsx";
import { Sidebar } from "@/components/sidebar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { toggleSideBar } from "@/store/slices/uiSlice";
import { Toaster } from "sonner";

export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    // const [collapsed, setCollapsed] = useState(false);
    const collapsed = useSelector((state: RootState) => state.ui.collapsed);
    const dispatch = useDispatch();

    const setCollapsed = () => {
        dispatch(toggleSideBar())
    }

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
            <Toaster position="top-right" />
        </div>
    );
}