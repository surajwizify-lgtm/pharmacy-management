"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { product } from "@/types";

function getStock(product: product) {
  return product.batches.reduce((sum, batch) => sum + batch.quantityAvailable, 0);
}

export const getColumns = (
  onEdit: (product: product) => void
): ColumnDef<product>[] => [
    {
      accessorKey: "name",
      header: "Product",
      enableSorting: true,
      cell: ({ row }) => (
        <Link
          href={`/products/${row.original.id}`}
          className="font-medium hover:text-primary"
        >
          {row.original.name}
        </Link>
      ),
    },

    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
      enableSorting: true,
    },

    {
      accessorKey: "hsnCode",
      header: "HSN",
      enableSorting: true,
    },

    {
      accessorKey: "gstPercentage",
      header: "GST %",
      cell: ({ row }) => `${row.original.gstPercentage}%`,
      enableSorting: true,
    },

    {
      id: "stock",
      header: "Stock",
      cell: ({ row }) => getStock(row.original),
      enableSorting: true,
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "ACTIVE"
              ? "default"
              : "secondary"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },

    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];