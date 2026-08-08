"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
    PaginationState,
    getPaginationRowModel,
    RowData,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}
declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        className?: string;
        headerClassName?: string;
    }
}
export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0, pageSize: 10,
    });
    // const table = useReactTable({
    //     data,
    //     columns,
    //     state: {
    //         sorting,
    //         pagination,
    //         globalFilter
    //     },

    //     onSortingChange: setSorting,
    //     onPaginationChange: setPagination,

    //     getCoreRowModel: getCoreRowModel(),
    //     getSortedRowModel: getSortedRowModel(),
    //     getPaginationRowModel: getPaginationRowModel(),
    // });
    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination,
            globalFilter
        },

        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,   // add this

        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(), // add this
    });


    return (
        <div className="rounded-lg bg-white">
            <div className="flex items-center justify-between py-4">
                <Input
                    placeholder="Search..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <div className="shadow shadow-gray-800 rounded-lg">
                <Table className="table-fixed ">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}

                                        className={cn(header.column.columnDef.meta?.className, "cursor-pointer select-none")}
                                    >
                                        <div className="flex items-center gap-2">
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}

                                            {{
                                                asc: "↑",
                                                desc: "↓",
                                            }[header.column.getIsSorted() as string] ?? ""}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell className="py-0 px-2" key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No data found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div >
    );
}