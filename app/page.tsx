"use client";

import { useState, useCallback } from "react";
import RecentTransactionsCard from "@/components/recent-transactions/RecentTransactionsCard";
import SwapCard from "@/components/swap-card";
import { StableOrderBook } from "@/components/order-book/StableOrderBook";
import { ProcessedOrder } from "@/components/order-book/StableOrderBook";
import { TanStackOrderBook } from "@/components/order-book/TanStackOrderBook";

export default function Home() {
  const [selectedOrders, setSelectedOrders] = useState<ProcessedOrder[]>([]);

  const handleOrderSelect = useCallback((order: ProcessedOrder) => {
    // Add order to cart (for now just log it)
    console.log("Order selected:", order);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        {/* Swap Panel */}
        <SwapCard
          selectedOrders={selectedOrders}
          onClearOrders={handleClearOrders}
        />
        {/* Recent Transactions */}
        <RecentTransactionsCard />
      </div>
      {/* Main Panel */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Order Book */}
        {/*<StableOrderBook
          onOrderSelect={handleOrderSelect}
          onOrderRemove={handleOrderRemove}
          selectedOrders={selectedOrders}
        />*/}

        <TanStackOrderBook
          onOrderSelect={handleOrderSelect}
          onOrderRemove={handleOrderRemove}
          selectedOrders={selectedOrders}
        />
      </div>
    </div>
  );
}
