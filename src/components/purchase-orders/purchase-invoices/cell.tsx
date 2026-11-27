export function Cell({
    type = 'text',
    value,
    onChange,
    required,
    min,
    max,
    step,
    placeholder,
    className = '',
}: {
    type?: string;
    value: string | number;
    onChange: (v: string) => void;
    required?: boolean;
    min?: number;
    max?: number;
    step?: string;
    placeholder?: string;
    className?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            className={`w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        />
    );
}