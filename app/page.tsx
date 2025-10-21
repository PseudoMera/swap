"use client";

import { useState, useCallback } from "react";
import SwapCard from "@/components/swap-card";
import RecentTransactionsCard from "@/components/recent-transactions";
import OrderBook, { ProcessedOrder } from "@/components/order-book";

function Home() {
  const [selectedOrders, setSelectedOrders] = useState<ProcessedOrder[]>([]);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);

  const handleOrderSelect = useCallback((order: ProcessedOrder) => {
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
          handleSwapDirection={handleSwapDirection}
          isSwapped={isSwapped}
        />
        <RecentTransactionsCard />
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6">
        <OrderBook
          onOrderSelect={handleOrderSelect}
          onOrderRemove={handleOrderRemove}
          selectedOrders={selectedOrders}
          isSwapped={isSwapped}
        />
      </div>
    </div>
  );
}

export default Home;
