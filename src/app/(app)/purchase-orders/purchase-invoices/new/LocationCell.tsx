'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Location } from '@/types/purchaseOrder/perchaseOrderType';

interface LocationCellProps {
    locations: Location[];
    value: string;
    onChange: (value: string) => void;
}

export function LocationCell({ locations, value, onChange }: LocationCellProps) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = locations.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedLocation = locations.find((l) => String(l.id) === value);

    function handleFocus() {
        if (!inputRef.current) return;
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width < 200 ? 200 : rect.width,
            zIndex: 9999,
        });
        setOpen(true);
    }

    function handleSelect(id: string, name: string) {
        onChange(id);
        setSearch(name);
        setOpen(false);
    }

    useEffect(() => {
        setSearch(selectedLocation?.name ?? '');
    }, [selectedLocation]);

    return (
        <>
            <input
                ref={inputRef}
                className="w-full h-full border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] text-center text-[var(--text-primary)] focus:border-[var(--text-link)] focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={handleFocus}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                placeholder="Rack"
            />
            {open && filtered.length > 0 && createPortal(
                <div
                    style={dropdownStyle}
                    className="max-h-48 overflow-y-auto rounded-xl border border-[var(--color-bg-tertiary)] bg-[var(--color-bg-primary)] shadow-xl"
                >
                    {filtered.map((l) => (
                        <button
                            type="button"
                            key={l.id}
                            className="w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                            onMouseDown={() => handleSelect(String(l.id), l.name)}
                        >
                            {l.code ? `${l.name} (${l.code})` : l.name}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}