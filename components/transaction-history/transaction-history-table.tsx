"use client";

import { useState } from "react";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { truncateHash, formatAmount } from "@/utils/transactions";
import StatusBadge from "./status-badge";
import { ProcessedTransaction } from "@/types/transactions";
import EditCloseOrderSummaryModal from "../edit-close-order-summary/modal";
import ExportModal from "./export-modal";
import { ENV_CONFIG } from "@/config/reown";
import TransactionTypeBadge from "./transaction-type-badge";
import { getDefaultTradingPair } from "@/utils/trading-pairs";

interface TransactionHistoryTableProps {
  data: ProcessedTransaction[];
  loading: boolean;
  onRefresh: () => void;
}

function TransactionHistoryTable({
  data,
  loading,
  onRefresh,
}: TransactionHistoryTableProps) {
  const [isEditCloseModalOpen, setIsEditCloseModalOpen] =
    useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<ProcessedTransaction | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<ProcessedTransaction>[] = [
    {
      accessorKey: "dateTime",
      header: "Date & Time",
      cell: ({ getValue }) => {
        const date = getValue() as Date;
        return (
          <span className="font-mono text-sm">
            {date.toLocaleDateString()}{" "}
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
      sortingFn: "datetime",
    },
    {
      accessorKey: "txHash",
      header: "Transaction Hash",
      cell: ({ getValue }) => {
        const hash = getValue() as string;

        return (
          <a
            href={`${ENV_CONFIG.EXPLORER_URL}/transaction/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-blue-600 hover:underline"
            title={hash}
          >
            {truncateHash(hash)}
          </a>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "pair",
      header: "Pair",
      cell: ({ getValue }) => {
        const pair = getValue() as string;
        return <span className="font-medium">{pair}</span>;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => {
        const type = getValue() as string;
        return <TransactionTypeBadge type={type} />;
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue, row }) => {
        const amount = getValue() as number;
        const baseAsset = row.original.tradingPairInfo.baseAsset.symbol;
        return (
          <span className="font-mono">
            {formatAmount(amount)} {baseAsset}
          </span>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ getValue }) => {
        const price = getValue() as number;
        return (
          <span className="font-mono text-green-700 dark:text-green-400 font-medium">
            {formatAmount(price, 4)}
          </span>
        );
      },
      sortingFn: "basic",
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ getValue, row }) => {
        const total = getValue() as number;
        const quoteAsset = row.original.tradingPairInfo.quoteAsset.symbol;
        return (
          <span className="font-mono">
            {formatAmount(total, 2)} {quoteAsset}
          </span>
        );
      },
    },
    {
      accessorKey: "fee",
      header: "Fee",
      cell: ({ getValue }) => {
        const fee = getValue() as number;
        return (
          <span className="font-mono text-muted-foreground">
            ${formatAmount(fee, 2)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() as ProcessedTransaction["status"];
        return <StatusBadge status={status} />;
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const transaction = row.original;
        const isOpen = transaction.status === "Open";
        const hasOrderInfo = transaction.rawData.order !== null;

        return isOpen && hasOrderInfo ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs"
            onClick={() => {
              setSelectedTransaction(transaction);
              setIsEditCloseModalOpen(true);
            }}
          >
            Edit
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-xs text-muted-foreground"
            asChild
          >
            <a
              href={`${ENV_CONFIG.EXPLORER_URL}/tx/${transaction.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View
            </a>
          </Button>
        );
      },
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Transaction History
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="border">
            <table className="w-full rounded-none">
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
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <p className="text-lg">No transactions found</p>
                      <p className="text-sm mt-2">
                        Try adjusting your filters or create your first
                        transaction
                      </p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls - Only show if we have data */}
            {data.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t bg-muted/20">
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
                  of {data.length} transactions
                </div>
                <div className="flex items-center space-x-2">
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
            )}
          </div>
        )}

        <EditCloseOrderSummaryModal
          open={isEditCloseModalOpen}
          onOpenChange={setIsEditCloseModalOpen}
          tradingPair={
            selectedTransaction?.tradingPairInfo || getDefaultTradingPair()
          }
          isBuySide={true}
          payAmount={
            selectedTransaction ? String(selectedTransaction.amount) : ""
          }
          payBalance={"1,200"}
          receiveAmount={
            selectedTransaction ? String(selectedTransaction.total) : ""
          }
          receiveBalance={"1,200"}
          transaction={selectedTransaction!}
        />

        <ExportModal
          open={isExportModalOpen}
          onOpenChange={setIsExportModalOpen}
          data={data}
        />
      </CardContent>
    </Card>
  );
}

export default TransactionHistoryTable;
