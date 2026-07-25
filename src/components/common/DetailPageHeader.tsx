'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { Button } from '../ui/button';
import { ArrowBigLeft } from 'lucide-react';
import BackButton from './BackButton';

interface DetailPageHeaderProps {
    backHref?: string;
    backLabel?: string;
    title: string;
    subtitle?: ReactNode;
    status?: {
        label: string;
        active: boolean;
    };
    actions?: ReactNode;
}

export default function DetailPageHeader({
    backHref,
    backLabel = 'Back',
    title,
    subtitle,
    status,
    actions,
}: DetailPageHeaderProps) {
    const router = useRouter();
    return (
        <div className="flex items-center bg-bg-primary justify-between relative mb-5 px-5 py-2 border-b border-neutral-200/80">
            <div className=''>
                <BackButton />
                <div className=''>
                    <div className="mt-2 flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
                        {status && (
                            <span
                                className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${status.active
                                    ? 'bg-secondary-100 text-secondary-700'
                                    : 'bg-neutral-200 text-neutral-500'
                                    }`}
                            >
                                {status.label}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}