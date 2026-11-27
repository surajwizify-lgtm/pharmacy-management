import { cn } from "@/lib/utils";

type TypographyVariant =
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "body-lg"
    | "body"
    | "body-sm"
    | "label"
    | "caption"
    | "overline"
    | "code";

type TypographyColor =
    | "primary"
    | "secondary"
    | "muted"
    | "error"
    | "success"
    | "warning"
    | "link"
    | "white"
    | "inherit";

interface AppTextProps {
    variant?: TypographyVariant;
    color?: TypographyColor;
    as?: keyof JSX.IntrinsicElements;
    className?: string;
    children: React.ReactNode;
}

const variantStyles: Record<TypographyVariant, string> = {
    h1: "text-4xl font-bold tracking-tight",
    h2: "text-3xl font-semibold tracking-tight",
    h3: "text-2xl font-semibold tracking-tight",
    h4: "text-xl font-semibold",
    "body-lg": "text-base font-normal leading-7",
    body: "text-sm font-normal leading-6",
    "body-sm": "text-xs font-normal leading-5",
    label: "text-sm font-medium leading-none",
    caption: "text-xs font-normal leading-4",
    overline: "text-[10px] font-semibold uppercase tracking-widest",
    code: "text-sm font-mono bg-neutral-100 px-1.5 py-0.5 rounded",
};

const colorStyles: Record<TypographyColor, string> = {
    primary: "text-foreground",
    secondary: "text-muted-foreground",
    muted: "text-neutral-400",
    error: "text-danger-600",
    success: "text-secondary-500",
    warning: "text-amber-500",
    link: "text-primary-600",
    white: "text-white",
    inherit: "text-inherit",
};

const defaultElements: Record<TypographyVariant, keyof JSX.IntrinsicElements> = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    "body-lg": "p",
    body: "p",
    "body-sm": "p",
    label: "span",
    caption: "span",
    overline: "span",
    code: "code",
};

export default function AppText({
    variant = "body",
    color = "primary",
    as,
    className,
    children,
}: AppTextProps) {
    const Element = (as ?? defaultElements[variant]) as keyof JSX.IntrinsicElements;

    return (
        <Element
            className={cn(
                variantStyles[variant],
                colorStyles[color],
                className
            )}
        >
            {children}
        </Element>
    );
}

export type { TypographyVariant, TypographyColor };