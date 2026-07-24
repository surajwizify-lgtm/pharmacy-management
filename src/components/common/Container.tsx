// components/Container.tsx
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContainerProps {
    children: ReactNode;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl" | "2xl" | "fluid";
}

const sizeMap = {
    sm: "max-w-screen-sm",      // 640px
    md: "max-w-screen-md",      // 768px
    lg: "max-w-screen-lg",      // 1024px
    xl: "max-w-screen-xl",      // 1280px
    "2xl": "max-w-screen-2xl",  // 1536px
    fluid: "max-w-full",         // 100%
};

export default function Container({
    children,
    className,
    size = "xl",
}: ContainerProps) {
    return (
        <div
            className={cn(
                "mx-auto w-full px-4 space-y-5 sm:px-6 lg:px-8",
                sizeMap[size],
                className
            )}
        >
            {children}
        </div>
    );
}