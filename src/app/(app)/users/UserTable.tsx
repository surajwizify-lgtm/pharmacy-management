'use client'

import Button from "@/components/Button"
import { DataTable } from "@/components/data-table/data-table"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { AppUser } from "@/types"
import { ColumnDef } from "@tanstack/react-table"


const UserTable = ({ data }: { data: AppUser[] }) => {
    async function deactivate(id: number) {
        if (!confirm('Deactivate this user?')) return;
        await apiFetch(`/api/users/${id}/deactivate`, { method: 'PATCH' });

    }
    const columns: ColumnDef<AppUser>[] = [
        {
            header: "Full Name",
            accessorKey: 'fullName',
            meta: {
                className: "w-2/12"
            }
        },
        {
            header: "Username",
            accessorKey: 'username',
            meta: {
                className: "w-1/12"
            }
        },
        {
            header: "Role",
            accessorKey: 'role',
            meta: {
                className: "w-1/12"
            }
        },
        {
            header: "Status",
            accessorKey: 'active',
            cell: ({ row }) => {
                return <div className="p-1"><Button variant={row.original.active ? "ghost" : "ghost"} className={cn("rounded-lg text-center", row.original.active ? "bg-green-100" : "bg-red-100")}>{row.original.active ? "Active" : "InActive"}</Button></div>
            },
            meta: {
                className: "w-1/12"
            }
        },
        {
            header: "Actions",
            // accessorKey: 'fullName'
            cell: ((row) => {
                return <div className="p-1">{row.row.original.active && (
                    <Button
                        variant="outline"
                        onClick={() => deactivate(row.row.original.id)}
                    >
                        Deactivate
                    </Button>
                )}</div>
            }),
            meta: {
                className: "w-2/12"
            }
        },
    ]

    return <DataTable columns={columns} data={data} />
}
export default UserTable;