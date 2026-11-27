// app/locations/LocationsTable.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import HeaderButton from '@/components/common/HeaderButton';
import LocationForm from './LocationForm';

type LocationType = "RACK" | "SHELF" | "BIN" | "COLD_STORAGE" | "WAREHOUSE" | "OTHER";

export type Location = {
    id: number;
    name: string;
    code: string | null;
    type: LocationType;
    description: string | null;
    active: boolean;
    _count: { batches: number };
};



const emptyForm = {
    name: "",
    code: "",
    type: "RACK" as LocationType,
    description: "",
    active: true,
};



export default function LocationsTable({ data }: { data: Location[] }) {
    const router = useRouter();

    const [modalOpen, setModalOpen] = useState(false);
    const [location, setLocation] = useState<any | null>(null);

    function openEditModal(loc: Location) {
        setLocation(loc);

        setModalOpen(true);
    }


    async function handleDelete(loc: Location) {
        if (!confirm(`Delete location "${loc.name}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/locations/${loc.id}`, { method: "DELETE" });
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || "Failed to delete location");
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        }
    }

    const columns: ColumnDef<Location>[] = useMemo(
        () => [
            {
                id: 'name',
                header: 'Name',
                accessorKey: 'name',
                cell: ({ row }) => (
                    <div>
                        {row.original.name}
                        {row.original.description && (
                            <div className="text-xs text-neutral-500">{row.original.description}</div>
                        )}
                    </div>
                ),
            },
            {
                id: 'code',
                header: 'Code',
                accessorFn: (row) => row.code ?? '—',
            },
            {
                header: 'Type',
                accessorKey: 'type',
            },
            {
                id: 'batches',
                header: 'Batches',
                accessorFn: (row) => row._count.batches,
            },
            {
                id: 'status',
                header: 'Status',
                accessorFn: (row) => (row.active ? 'Active' : 'Inactive'),
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className="flex justify-center gap-2">
                        <Button size={'xs'} variant="outline" onClick={() => openEditModal(row.original)}>
                            Edit
                        </Button>
                        <Button size={'xs'} variant="destructive" onClick={() => handleDelete(row.original)}>
                            Delete
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <>


            <DataTable columns={columns} data={data} />

            {modalOpen && (
                <LocationForm setModalOpen={setModalOpen} location={location} />
            )}
        </>
    );
}