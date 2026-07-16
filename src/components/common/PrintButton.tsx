'use client';

interface PrintButtonProps {
    onClick: () => void;
    className?: string;
    children?: React.ReactNode;
}

export default function PrintButton({
    onClick,
    className,
    children,
}: PrintButtonProps) {
    return (
        <button
            onClick={onClick}
            className={
                className ??
                'rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700'
            }
        >
            {children ?? '🖨️ Print'}
        </button>
    );
}