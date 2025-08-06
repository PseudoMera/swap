"use client";

import { useState, useCallback } from "react";
import RecentTransactionsCard from "@/components/recent-transactions/RecentTransactionsCard";
import SwapCard from "@/components/swap-card";
import { ProcessedOrder } from "@/components/order-book/StableOrderBook";
import { TanStackOrderBook } from "@/components/order-book/TanStackOrderBook";
import { getDefaultTradingPair } from "@/constants/trading-pairs";

const defaultTradingPair = getDefaultTradingPair();

export default function Home() {
  const [selectedOrders, setSelectedOrders] = useState<ProcessedOrder[]>([]);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);

  const handleOrderSelect = useCallback((order: ProcessedOrder) => {
    // Add to selected orders if not already selected
    setSelectedOrders((prev) => {
      if (!prev.find((o) => o.id === order.id)) {
        return [...prev, order];
      }
      return prev;
    });
  }, []);

  const handleClearOrders = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  const handleOrderRemove = useCallback((order: ProcessedOrder) => {
    setSelectedOrders((prev) => prev.filter((o) => o.id !== order.id));
  }, []);

  const handleSwapDirection = () => {
    setIsSwapped((prev) => !prev);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="flex flex-col gap-6 lg:col-span-1">
        <SwapCard
          selectedOrders={selectedOrders}
          onClearOrders={handleClearOrders}
          tradingPair={defaultTradingPair}
          handleSwapDirection={handleSwapDirection}
          isSwapped={isSwapped}
        />
        <RecentTransactionsCard />
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6">
        <TanStackOrderBook
          onOrderSelect={handleOrderSelect}
          onOrderRemove={handleOrderRemove}
          selectedOrders={selectedOrders}
          tradingPair={defaultTradingPair}
          isSwapped={isSwapped}
        />
      </div>
    </div>
  );
}
