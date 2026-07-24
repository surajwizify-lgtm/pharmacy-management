"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    value?: string; // yyyy-MM-dd
    onChange: (date: string) => void;
}

export function DatePicker({
    value,
    onChange,
}: DatePickerProps) {
    const selectedDate =
        value && value.length > 0 ? parseISO(value) : undefined;;

    return (
        <Popover>
            <PopoverTrigger className="rounded-md bg-bg-primary border px-3 py-1.5 text-left">
                <CalendarIcon className="mr-2 inline h-4 w-4" />
                {value ? format(new Date(value!), "MMMM d, yyyy") : "Select date"}
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                        if (date) {
                            onChange(format(date, "yyyy-MM-dd"));
                        }
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}