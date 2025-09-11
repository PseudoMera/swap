"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallets } from "@/context/wallet";
import { fetchEnrichedTransactionHistory } from "@/services/transactions";
import {
  processTransactionData,
  calculateTransactionStats,
  applyTransactionFilters,
} from "@/utils/transactions";
import StatsCards from "@/components/transaction-history/StatsCards";
import FilterBar from "@/components/transaction-history/FilterBar";
import TransactionHistoryTable from "@/components/transaction-history/TransactionHistoryTable";
import { TransactionFilters } from "@/types/transactions";

function TransactionHistoryPage() {
  const { selectedCanopyWallet } = useWallets();
  const [filters, setFilters] = useState<TransactionFilters>({
    pair: "All Pairs",
    status: "All Status",
    timeRange: "All Time",
    search: "",
    address: "All Addresses",
  });

  const address = selectedCanopyWallet?.address;

  // Fetch transaction history using TanStack Query
  const {
    data: enrichedData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transaction-history", address],
    queryFn: () => fetchEnrichedTransactionHistory(address!, 0, 50),
    enabled: Boolean(address),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
    retry: 1,
  });

  // Process transaction data
  const transactions = useMemo(() => {
    if (!enrichedData?.results) return [];
    return enrichedData.results.map(processTransactionData);
  }, [enrichedData]);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    return applyTransactionFilters(transactions, filters);
  }, [transactions, filters]);

  // Calculate stats from filtered transactions
  const stats = useMemo(() => {
    return calculateTransactionStats(filteredTransactions);
  }, [filteredTransactions]);

  if (!selectedCanopyWallet?.address) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Transaction History
          </h1>
          <h2 className="text-base text-muted-foreground mt-2">
            View all your swap transactions and their details
          </h2>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">
            Please select a Canopy wallet to view transaction history
          </p>
          <p className="text-sm mt-2">
            Upload a keyfile or create a wallet to get started
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Transaction History
          </h1>
          <h2 className="text-base text-muted-foreground mt-2">
            View all your swap transactions and their details
          </h2>
        </div>
        <div className="text-center py-12 text-red-600">
          <p className="text-lg">Error loading transaction history</p>
          <p className="text-sm mt-2">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Transaction History
        </h1>
        <h2 className="text-base text-muted-foreground mt-2">
          View all your swap transactions and their details
        </h2>
      </div>

      {/* Filter Bar - Right below subtitle */}
      <FilterBar filters={filters} onFiltersChange={setFilters} />

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={isLoading} />

      {/* Transaction Table */}
      <TransactionHistoryTable
        data={filteredTransactions}
        loading={isLoading}
        onRefresh={() => refetch()}
      />
    </div>
  );
}

export default TransactionHistoryPage;
