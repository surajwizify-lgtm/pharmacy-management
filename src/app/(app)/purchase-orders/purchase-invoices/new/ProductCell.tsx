'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { product } from '@/types';

interface ProductCellProps {
    results: product[];
    search: string;
    onSearchChange: (val: string) => void;
    onSelect: (id: number) => void;
}

export function ProductCell({ results, search, onSearchChange, onSelect }: ProductCellProps) {
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const inputRef = useRef<HTMLInputElement>(null);
    const [displayName, setDisplayName] = useState('');

    function handleFocus() {
        if (!inputRef.current) return;
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: Math.max(rect.width, 400),
            zIndex: 9999,
        });
        setOpen(true);
    }

    return (
        <>
            <div className="relative h-full w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search products"
                    className="w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] pl-9 text-xs text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none"
                    value={displayName || search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={() => setTimeout(() => setOpen(false), 200)}

                />
            </div>
            {open && results.length > 0 && createPortal(
                <div
                    style={dropdownStyle}
                    className="max-h-72 overflow-y-auto rounded-xl border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] shadow-xl"
                >
                    <div className="sticky top-0 grid grid-cols-6 items-center gap-2 border-b border-[var(--color-bg-tertiary)] bg-[var(--color-bg-secondary)] px-3 py-2">
                        <span className="col-span-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Product</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">CP</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Manufacturer</span>
                        <span className="justify-self-end text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">GST %</span>
                    </div>
                    {results.map((m, i) => (
                        <button
                            type="button"
                            key={i}
                            className="grid w-full grid-cols-6 items-center gap-2 border-b border-[var(--color-bg-tertiary)] px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[var(--color-bg-tertiary)]"
                            onMouseDown={() => {
                                onSelect(Number(m.id));
                                setDisplayName(m.name);
                                setOpen(false);
                            }}
                        >
                            <span className="col-span-3 truncate text-xs font-medium text-[var(--text-primary)]">{m.name}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{m.cp}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{m.manufacturer}</span>
                            <span className="justify-self-end rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-success)]">
                                {m.gstPercentage}%
                            </span>
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}