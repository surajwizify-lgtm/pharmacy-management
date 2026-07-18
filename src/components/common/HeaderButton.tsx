// components/common/HeaderButton.tsx
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

interface HeaderButtonProps {
    text: string;
    href?: string;
    onClick?: () => void;
}

export default function HeaderButton({ text, href, onClick }: HeaderButtonProps) {
    const baseClass =
        "inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer";

    if (href) {
        return (
            <Link href={href} className={baseClass}>
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                {text}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={baseClass}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            {text}
        </button>
    );
}