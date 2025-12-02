"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProcessedOrder } from ".";
import { useTradePairContext } from "@/context/trade-pair-context";

interface OrdersTableProps {
  data: ProcessedOrder[];
  loading: boolean;
  onOrderSelect: (order: ProcessedOrder) => void;
  onOrderRemove: (order: ProcessedOrder) => void;
  selectedOrders: ProcessedOrder[];
  isSwapped: boolean;
}

function OrdersTable({
  data,
  loading,
  onOrderSelect,
  onOrderRemove,
  selectedOrders,
  isSwapped,
}: OrdersTableProps) {
  const { tradePair } = useTradePairContext();

  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<ProcessedOrder>[] = useMemo(
    () => [
      {
        accessorKey: "price",
        header: `Price (${tradePair.quoteAsset.symbol})`,
        cell: ({ getValue }) => {
          const price = getValue() as number;
          return (
            <span className="font-mono text-green-700 dark:text-green-400 font-medium">
              {price.toFixed(4)}
            </span>
          );
        },
        sortingFn: "basic",
      },
      {
        accessorKey: "amountForSale",
        header: `Amount (${tradePair.baseAsset.symbol})`,
        cell: ({ getValue }) => {
          const amount = getValue() as number;
          return <span className="font-mono">{amount.toLocaleString()}</span>;
        },
      },
      {
        accessorKey: "total",
        header: `Total (${tradePair.quoteAsset.symbol})`,
        cell: ({ getValue }) => {
          const total = getValue() as number;
          return <span className="font-mono">{total.toFixed(2)}</span>;
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const order = row.original;
          const isSelected = selectedOrders.some(
            (selectedOrder) => selectedOrder.id === order.id,
          );

          const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              if (isSelected) {
                onOrderRemove(order);
              } else {
                onOrderSelect(order);
              }
            } catch (error) {
              console.error("Error handling order action:", error);
            }
          };

          return (
            <Button
              className={cn(
                isSelected
                  ? "bg-warning hover:bg-warning/80 text-black px-4 py-1"
                  : "bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-1",
                "w-20",
              )}
              onClick={handleClick}
              disabled={isSwapped}
            >
              {isSelected ? "Remove" : "Buy"}
            </Button>
          );
        },
      },
    ],
    [isSwapped, onOrderRemove, onOrderSelect, selectedOrders, tradePair],
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id, // Use stable ID instead of array index
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    autoResetPageIndex: false,
    autoResetExpanded: false,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading && data.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No orders available
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-muted/50 border-b">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted/70"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center font-bold text-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    {{
                      asc: " ↑",
                      desc: " ↓",
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between p-3 border-t bg-muted/20">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            data.length,
          )}{" "}
          of {data.length} orders
        </div>
        <div className="flex items-center flex-wrap space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OrdersTable;
