interface LoaderProps {
    text?: string;
}

export default function Loader({
    text = 'Loading...',
}: LoaderProps) {
    return (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-slate-500">
                {text}
            </p>
        </div>
    );
}