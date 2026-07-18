interface InputProps {
    label?: string;
    id?: string;
    type?: string;
    placeholder?: string;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function Input({
    label,
    id,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    disabled = false,
    className = "",
}: InputProps) {
    return (
        <div className="flex flex-col gap-2">
            {
                label && <label htmlFor={id} className="text-sm font-medium">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            }

            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`w-full rounded-md border border-gray-300 px-3 py-1 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`}
            />
        </div>
    );
}