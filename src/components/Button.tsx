import React from "react";

interface ButtonProps {
    children: React.ReactNode;
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary" | "success" | "danger" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
}

export default function Button({
    children,
    type = "button",
    variant = "primary",
    size = "md",
    disabled = false,
    className = "",
    onClick,
}: ButtonProps) {
    const baseClasses =
        "rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

    const variantClasses = {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-600 text-white hover:bg-gray-700",
        success: "bg-green-600 text-white hover:bg-green-700",
        danger: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100",
        ghost: "bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100/0 p-0 m-0",
    };

    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
    };

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {children}
        </button>
    );
}