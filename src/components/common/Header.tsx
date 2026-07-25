// components/common/PageHeader.tsx
import React from "react";

export interface PageHeaderProps {
    header: string;
    subheader: string;
    children?: React.ReactNode;
    icon?: React.ReactNode;
    badge?: { text: string; tone?: "primary" | "success" | "amber" | "danger" };
    breadcrumbs?: { label: string; href?: string }[];
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
        primary: "bg-primary-50 text-primary-700 ring-1 ring-primary-200",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    };

    const iconTones = {
        primary: "bg-primary-100 text-primary-600",
        success: "bg-emerald-100 text-emerald-600",
        amber: "bg-amber-100 text-amber-600",
        danger: "bg-rose-100 text-rose-600",
    };

    const activeTone = badge?.tone || "primary";

    return (
        <div className="relative mb-5 px-5 bg-white border-b border-neutral-200/80">
            {/* Subtle top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${activeTone === "success" ? "bg-emerald-500" :
                activeTone === "amber" ? "bg-amber-500" :
                    activeTone === "danger" ? "bg-rose-500" :
                        "bg-primary-500"
                }`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6">
                {/* Breadcrumb */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="mb-4 flex items-center gap-1.5 text-[11px] text-neutral-400">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && (
                                    <svg
                                        className="h-3 w-3 text-neutral-300 mx-0.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    >
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                )}
                                {crumb.href ? (
                                    <a
                                        href={crumb.href}
                                        className="hover:text-primary-600 transition-colors duration-200"
                                    >
                                        {crumb.label}
                                    </a>
                                ) : (
                                    <span className="text-neutral-500 font-medium">{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}

                {/* Main row */}
                <div className="flex items-start sm:items-center gap-4">
                    {/* Icon badge */}
                    {icon && (
                        <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${iconTones[activeTone]}`}>
                            {icon}
                        </div>
                    )}

                    {/* Text block */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-lg md:text-xl font-bold text-neutral-900 tracking-tight">
                                {header}
                            </h1>
                            {badge && (
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${badgeTones[badge.tone || "primary"]}`}
                                >
                                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${badge.tone === "success" ? "bg-emerald-500" :
                                        badge.tone === "amber" ? "bg-amber-500" :
                                            badge.tone === "danger" ? "bg-rose-500" :
                                                "bg-primary-500"
                                        }`} />
                                    {badge.text}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{subheader}</p>
                    </div>

                    {/* Action button */}
                    {children && (
                        <div className="shrink-0 mt-1 sm:mt-0">
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}