"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type ButtonVariant =
    | "default"
    | "secondary"
    | "destructive"
    | "warning"
    | "success"
    | "ghost"
    | "outline"
    | "link";

type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    default: "bg-primary-600 hover:bg-primary-700 text-white hover:text-white",
    secondary: "bg-neutral-100 hover:bg-neutral-200 text-neutral-800",
    destructive: "bg-danger-600 hover:bg-danger-700 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    success: "bg-secondary-500 hover:bg-secondary-600 text-white",
    ghost: "bg-transparent hover:bg-neutral-100 text-neutral-700",
    outline: "border border-neutral-300 bg-transparent hover:bg-neutral-100 text-neutral-700",
    link: "bg-transparent underline-offset-4 hover:underline text-primary-600 p-0 h-auto",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-10 px-6 text-sm gap-2",
    icon: "h-9 w-9 p-0",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "default",
            size = "md",
            loading = false,
            leftIcon: LeftIcon,
            rightIcon: RightIcon,
            children,
            className,
            disabled,
            ...props
        },
        ref
    ) => {
        return (
            <ShadcnButton
                ref={ref}
                variant="default"
                disabled={disabled || loading}
                className={cn(
                    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                {...props}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    LeftIcon && <LeftIcon className="h-4 w-4" />
                )}
                {children}
                {!loading && RightIcon && <RightIcon className="h-4 w-4" />}
            </ShadcnButton>
        );
    }
);

Button.displayName = "Button";

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize };