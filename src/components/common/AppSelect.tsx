"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
    label: string;
    value: string;
}

interface AppSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export default function AppSelect({
    value,
    onChange,
    options,
    placeholder = "Select",
    className,
    disabled = false,
}: AppSelectProps) {
    return (
        <Select
            value={value}
            disabled={disabled}
            onValueChange={(value) => {
                if (value) onChange(value);
            }}
        >
            <SelectTrigger
                className={cn(
                    "w-full rounded-lg border border-neutral-300 bg-white h-[50px] px-3",
                    className
                )}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent className="rounded-lg border border-neutral-200  bg-white shadow-lg">
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}