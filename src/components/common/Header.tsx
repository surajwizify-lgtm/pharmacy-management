// components/common/PageHeader.tsx
import React from "react";

interface PageHeaderProps {
    header: string;
    subheader: string;
    children?: React.ReactNode;
    icon?: React.ReactNode; // Optional icon to show in the badge
    badge?: { text: string; tone?: "primary" | "success" | "amber" | "danger" }; // Optional status badge
    breadcrumbs?: { label: string; href?: string }[]; // Optional breadcrumb trail
}

export default function PageHeader({
    header,
    subheader,
    children,
    icon,
    badge,
    breadcrumbs,
}: PageHeaderProps) {
    const badgeTones = {
        primary: "bg-primary-100 text-primary-700",
        success: "bg-secondary-100 text-secondary-700",
        amber: "bg-amber-100 text-amber-700",
        danger: "bg-danger-100 text-danger-700",
    };

    return (
        <div className="bg-surface-50 border-b border-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
                {/* Main row */}
                <div className="flex items-center gap-4">
                    {/* Icon badge */}
                    {icon && (
                        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                            {icon}
                        </div>
                    )}

                    {/* Text block */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight truncate">
                                {header}
                            </h1>
                            {badge && (
                                <span
                                    className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badgeTones[badge.tone || "primary"]}`}
                                >
                                    {badge.text}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">{subheader}</p>
                    </div>

                    {/* Action button */}
                    {children && <div className="shrink-0">{children}</div>}
                </div>

                {/* Breadcrumb */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-400">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && (
                                    <svg
                                        className="h-3 w-3 text-neutral-300"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                )}
                                {crumb.href ? (
                                    <a
                                        href={crumb.href}
                                        className="hover:text-primary-600 transition-colors"
                                    >
                                        {crumb.label}
                                    </a>
                                ) : (
                                    <span className="text-neutral-600 font-medium">{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}
            </div>
        </div>
    );
}