"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { AggregatedOrder } from "./TanStackOrderBook";

interface DepthTableProps {
  data: AggregatedOrder[];
  loading: boolean;
  onPriceSelect: (price: number) => void;
  selectedPrice: number | null;
}

export function DepthTable({ data, loading, onPriceSelect, selectedPrice }: DepthTableProps) {
  const columns: ColumnDef<AggregatedOrder>[] = [
    {
      accessorKey: "price",
      header: "Price (USDC)",
      cell: ({ getValue }) => {
        const price = getValue() as number;
        return (
          <span className="font-mono font-semibold text-green-700 relative z-10">
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
  ];

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.price.toString(), // Use stable ID based on price
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
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-muted/50 border-b">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-3 text-left text-sm font-bold text-black"
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
            const isSelected = selectedPrice !== null && 
              row.original.price.toFixed(4) === selectedPrice.toFixed(4);
            
            return (
              <tr
                key={row.id}
                className={`border-b last:border-b-0 hover:opacity-80 transition-all cursor-pointer relative ${
                  isSelected ? 'ring-2 ring-green-600 ring-inset' : ''
                }`}
                style={{
                  background: `linear-gradient(to right, #76e698 0%, #76e698 ${row.original.volumePercentage}%, #F0FDF4 ${row.original.volumePercentage}%, #F0FDF4 100%)`,
                }}
                onClick={() => onPriceSelect(row.original.price)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
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
