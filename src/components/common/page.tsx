import { cn } from "@/lib/utils";

interface PageProps {
    children: React.ReactNode;
    className?: string;
}

export default function Page({ children, className }: PageProps) {
    return (
        <div className={cn("w-full space-y-8", className)}>
            {children}
        </div>
    );
}