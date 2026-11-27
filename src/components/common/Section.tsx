import { cn } from "@/lib/utils";

interface SectionProps {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    fullWidth?: boolean;
    className?: string;
}

export default function Section({
    title,
    description,
    action,
    children,
    fullWidth = false,
    className,
}: SectionProps) {
    const hasHeader = title || description || action;

    return (
        <section className={cn("w-full space-y-4 ", className, fullWidth ? '' : 'px-5')}>
            <div className={cn(!fullWidth && "max-w-7xl mx-auto")}>
                {hasHeader && (
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="space-y-1">
                            {title && (
                                <h2 className="text-lg font-semibold text-foreground">
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        {action && <div className="shrink-0">{action}</div>}
                    </div>
                )}
                {children}
            </div>
        </section>
    );
}