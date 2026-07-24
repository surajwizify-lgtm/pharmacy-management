
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";

interface HeaderButtonProps {
    text: string;
    href?: string;
    onClick?: () => void;
}

export default function HeaderButton({ text, href, onClick }: HeaderButtonProps) {
    const baseClass =
        "bg-primary-600 hover:bg-primary-700 text-white cursor-pointer";

    if (href) {
        return (
            <Link href={href} >
                <Button variant={'primary'}><Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {text}</Button>
            </Link>

        );
    }

    return (
        <Button size={'lg'} onClick={onClick} className={baseClass}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            {text}
        </Button>
    );
}