// components/common/Container.tsx
import React from "react";

interface ContainerProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    action?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    contentClassName?: string;
    headerClassName?: string;
    footerClassName?: string;
    variant?: "default" | "flat" | "card" | "elevated";
    size?: "sm" | "md" | "lg" | "full";
    noHeaderDivider?: boolean;
    noFooterDivider?: boolean;
}

export default function Container({
    children,
    title,
    description,
    action,
    footer,
    className = "",
    contentClassName = "",
    headerClassName = "",
    footerClassName = "",
    variant = "default",
    size = "md",
    noHeaderDivider = false,
    noFooterDivider = false,
}: ContainerProps) {
    const variantStyles = {
        default: "bg-surface-50 border border-neutral-200 rounded-xl shadow-sm",
        flat: "bg-surface-50 border border-neutral-200 rounded-xl",
        card: "bg-white border border-neutral-200 rounded-xl shadow-sm",
        elevated: "bg-white border border-neutral-200 rounded-xl shadow-md",
    };

    const sizeStyles = {
        sm: "p-4",
        md: "p-5 md:p-6",
        lg: "p-6 md:p-8",
        full: "",
    };

    const hasHeader = title || description || action;
    const hasFooter = footer;

    return (
        <div className={`${variantStyles[variant]} ${className}`}>
            {/* Header */}
            {hasHeader && (
                <>
                    <div
                        className={`flex items-start justify-between gap-4 ${sizeStyles[size]} ${headerClassName}`}
                    >
                        <div className="flex-1 min-w-0">
                            {title && (
                                <h2 className="text-lg font-semibold text-neutral-900 leading-tight">
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>
                        {action && <div className="shrink-0">{action}</div>}
                    </div>
                    {!noHeaderDivider && <div className="border-t border-neutral-200" />}
                </>
            )}

            {/* Content */}
            <div className={`${sizeStyles[size]} ${contentClassName}`}>
                {children}
            </div>

            {/* Footer */}
            {hasFooter && (
                <>
                    {!noFooterDivider && <div className="border-t border-neutral-200" />}
                    <div className={`${sizeStyles[size]} ${footerClassName}`}>
                        {footer}
                    </div>
                </>
            )}
        </div>
    );
}