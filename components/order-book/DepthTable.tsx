"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { AggregatedOrder } from "./TanStackOrderBook";
import { useMemo } from "react";

interface DepthTableProps {
  data: AggregatedOrder[];
  loading: boolean;
  onPriceSelect: (price: number) => void;
  selectedPrice: number | null;
}

function DepthTable({
  data,
  loading,
  onPriceSelect,
  selectedPrice,
}: DepthTableProps) {
  const columns: ColumnDef<AggregatedOrder>[] = useMemo(
    () => [
      {
        accessorKey: "price",
        header: "Price (USDC)",
        cell: ({ getValue }) => {
          const price = getValue() as number;
          return (
            <span className="font-mono font-semibold text-green-700 dark:text-green-400 relative z-10">
              {price.toFixed(4)}
            </span>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Amount (CNPY)",
        cell: ({ getValue }) => {
          const amount = getValue() as number;
          return (
            <span className="font-mono relative z-10">
              {amount.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "totalValue",
        header: "Total (USDC)",
        cell: ({ getValue }) => {
          const total = getValue() as number;
          return (
            <span className="font-mono relative z-10">{total.toFixed(2)}</span>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.price.toString(),
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: false,
  });

  if (loading && data.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No depth data available
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <table className="w-full border-0">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-muted/50 border-b">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-3 text-left text-sm font-bold text-foreground"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isSelected =
              selectedPrice !== null &&
              row.original.price.toFixed(4) === selectedPrice.toFixed(4);

            return (
              <tr
                key={row.id}
                className={`border-b border-transparent last:border-b-0 hover:opacity-80 transition-all cursor-pointer relative bg-success-light ${
                  isSelected ? "ring-2 ring-primary ring-inset rounded-lg" : ""
                }`}
                onClick={() => onPriceSelect(row.original.price)}
              >
                {row.getVisibleCells().map((cell, cellIdx) => (
                  <td key={cell.id} className="p-3">
                    {cellIdx === 0 && (
                      <div
                        className="absolute top-0 left-0 h-full rounded-2xl bg-primary dark:bg-primary/60"
                        style={{
                          width: `${row.original.volumePercentage}%`,
                          zIndex: 0,
                        }}
                      />
                    )}
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DepthTable;
