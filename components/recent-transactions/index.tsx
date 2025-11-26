"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { fetchRecentNetworkTransactions } from "@/services/transactions";
import { processTransactionData, formatAmount } from "@/utils/transactions";
import { usePollingData } from "@/context/polling-context";

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }
};

function RecentTransactionsCard() {
  const { height } = usePollingData();

  const {
    data: enrichedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recent-network-transactions"],
    queryFn: () => fetchRecentNetworkTransactions(height?.height || 0, 10),
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 1,
  });

  const recentSellOrders = useMemo(() => {
    if (!enrichedData?.results) return [];

    return enrichedData.results
      .filter((tx) => tx.transaction.messageType === "createOrder") // Only sell orders
      .map(processTransactionData)
      .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime()) // Most recent first
      .slice(0, 3); // Show only 3 most recent
  }, [enrichedData]);

  if (error) {
    return (
      <Card className="max-w-md w-full mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">Unable to fetch network transactions</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="max-w-md w-full mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center py-4 first:pt-0 last:pb-0"
            >
              <div className="flex-shrink-0">
                <div className="rounded-full bg-muted w-9 h-9 mr-4 animate-pulse" />
              </div>
              <div className="flex flex-col flex-1 min-w-0 gap-1">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded w-16" />
              </div>
              <div className="flex flex-col items-end gap-1 min-w-[80px]">
                <div className="h-4 bg-muted animate-pulse rounded w-16" />
                <div className="h-3 bg-muted animate-pulse rounded w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (recentSellOrders.length === 0) {
    return (
      <Card className="max-w-md w-full mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">No recent sell orders</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        {recentSellOrders.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center py-4 first:pt-0 last:pb-0"
          >
            <div className="flex-shrink-0">
              <div className="rounded-full bg-muted/50 w-9 h-9 flex items-center justify-center mr-4">
                <ArrowRight className="text-green-500 w-5 h-5" />
              </div>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-base text-foreground truncate">
                  {tx.tradingPairInfo.baseAsset.symbol}{" "}
                  <span className="mx-1 text-muted-foreground">→</span>{" "}
                  {tx.tradingPairInfo.quoteAsset.symbol}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(tx.dateTime)}
              </span>
            </div>
            <div className="flex flex-col items-end min-w-[80px]">
              <span className="font-medium text-base text-foreground">
                {formatAmount(tx.amount)} {tx.tradingPairInfo.baseAsset.symbol}
              </span>
              <span className="text-xs text-muted-foreground">
                Rate: {formatAmount(tx.price, 4)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default RecentTransactionsCard;
