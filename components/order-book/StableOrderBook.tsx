"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { usePollingData } from "@/context/polling-context";
import { blockchainUValueToNumber } from "@/utils/blockchain";
import { Order } from "@/types/order";

export interface ProcessedOrder
  extends Omit<Order, "amountForSale" | "requestedAmount"> {
  price: number;
  amountForSale: number;
  requestedAmount: number;
  total: number;
}

export interface AggregatedOrder {
  price: number;
  totalAmount: number;
  totalValue: number;
  orderCount: number;
  volumePercentage: number;
}

interface StableOrderBookProps {
  onOrderSelect: (order: ProcessedOrder) => void;
  onOrderRemove: (order: ProcessedOrder) => void;
  selectedOrders: ProcessedOrder[];
}

export function StableOrderBook({
  onOrderSelect,
  onOrderRemove,
  selectedOrders,
}: StableOrderBookProps) {
  const { orders, ordersLoading, ordersError, refetchOrders } =
    usePollingData();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  // Process orders: filter CNPY orders and convert values
  const processedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];

    try {
      return orders
        .filter((order) => order && order.committee === 1) // CNPY sell orders only
        .map((order) => {
          const amountForSale = blockchainUValueToNumber(
            order.amountForSale || 0,
          );
          const requestedAmount = blockchainUValueToNumber(
            order.requestedAmount || 0,
          );
          const price = amountForSale > 0 ? requestedAmount / amountForSale : 0;

          return {
            ...order,
            price,
            amountForSale,
            requestedAmount,
            total: price * amountForSale,
          } as ProcessedOrder;
        })
        .filter((order) => order.price > 0 && order.amountForSale > 0)
        .sort((a, b) => a.price - b.price); // Best prices first
    } catch (error) {
      console.error("Error processing orders:", error);
      return [];
    }
  }, [orders]);

  // Aggregate orders by price for depth view (top 10 only)
  const aggregatedOrders = useMemo(() => {
    if (!processedOrders || processedOrders.length === 0) return [];

    try {
      const priceMap = new Map<string, AggregatedOrder>();

      // Group by price level
      processedOrders.forEach((order) => {
        if (!order || typeof order.price !== "number" || isNaN(order.price))
          return;

        const priceKey = order.price.toFixed(4);
        if (priceMap.has(priceKey)) {
          const existing = priceMap.get(priceKey)!;
          priceMap.set(priceKey, {
            price: order.price,
            totalAmount: existing.totalAmount + (order.amountForSale || 0),
            totalValue: existing.totalValue + (order.total || 0),
            orderCount: existing.orderCount + 1,
            volumePercentage: 0, // Will be calculated below
          });
        } else {
          priceMap.set(priceKey, {
            price: order.price,
            totalAmount: order.amountForSale || 0,
            totalValue: order.total || 0,
            orderCount: 1,
            volumePercentage: 0, // Will be calculated below
          });
        }
      });

      // Sort by price and take top 10, calculate volume percentages
      const sortedLevels = Array.from(priceMap.values())
        .filter((level) => level.totalAmount > 0)
        .sort((a, b) => a.price - b.price)
        .slice(0, 10);

      // Calculate volume percentages for green bar sizing
      const maxVolume = Math.max(
        ...sortedLevels.map((level) => level.totalAmount),
        1,
      );

      return sortedLevels.map((level) => ({
        ...level,
        volumePercentage: (level.totalAmount / maxVolume) * 100,
      }));
    } catch (error) {
      console.error("Error aggregating orders:", error);
      return [];
    }
  }, [processedOrders]);

  // Paginated orders for bottom table
  const paginatedOrders = useMemo(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return processedOrders.slice(startIndex, endIndex);
  }, [processedOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(processedOrders.length / pageSize);

  const handleOrderSelect = (order: ProcessedOrder) => {
    try {
      onOrderSelect(order);
    } catch (error) {
      console.error("Error selecting order:", error);
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  if (ordersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Order Book (USDC/CNPY)
            <Button variant="outline" size="sm" onClick={() => refetchOrders()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Error loading orders: {ordersError.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Order Book (USDC/CNPY)
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOrders()}
            disabled={ordersLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${ordersLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Table - Market Depth (Top 10) */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Market Depth (Top 10 Price Levels)
          </h3>

          {ordersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : aggregatedOrders.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No depth data available
            </div>
          ) : (
            <div className="border-t border-b rounded-md">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                <div>Price (USDC)</div>
                <div>Amount (CNPY)</div>
                <div>Total (USDC)</div>
              </div>

              {/* Depth Rows with Green Bars */}
              {aggregatedOrders.map((level, index) => (
                <div
                  key={`${level.price}-${index}`}
                  className="relative grid grid-cols-3 gap-4 p-3 border-b last:border-b-0 bg-table-row-bg hover:opacity-80 transition-opacity rounded-md"
                  style={{
                    background: `linear-gradient(to right, #76e698 0%, #76e698 ${level.volumePercentage}%, #F0FDF4 ${level.volumePercentage}%, #F0FDF4 100%)`,
                  }}
                >
                  <div className="font-mono font-semibold text-green-700 relative z-10">
                    {level.price.toFixed(4)}
                  </div>
                  <div className="font-mono relative z-10">
                    {level.totalAmount.toLocaleString()}
                  </div>
                  <div className="font-mono relative z-10">
                    {level.totalValue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Table - Individual Orders with Pagination */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Individual Orders
          </h3>

          {ordersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : processedOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders available
            </div>
          ) : (
            <div className="border-t border-b rounded-md">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                <div>Price (USDC)</div>
                <div>Amount (CNPY)</div>
                <div>Total (USDC)</div>
                <div>Action</div>
              </div>

              {/* Order Rows */}
              {paginatedOrders.map((order) => {
                const isSelected = selectedOrders.some(
                  (selectedOrder) => selectedOrder.id === order.id,
                );

                return (
                  <div
                    key={order.id}
                    className="grid grid-cols-4 gap-4 p-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <div className="font-mono text-green-600 font-medium">
                      {order.price.toFixed(4)}
                    </div>
                    <div className="font-mono">
                      {order.amountForSale.toLocaleString()}
                    </div>
                    <div className="font-mono">{order.total.toFixed(2)}</div>
                    <div>
                      {isSelected ? (
                        <Button
                          size="sm"
                          className="bg-order-remove hover:bg-order-remove/80 text-black px-4 py-1"
                          onClick={() => onOrderRemove(order)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-1"
                          onClick={() => handleOrderSelect(order)}
                        >
                          Buy
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t bg-muted/20">
                  <div className="text-sm text-muted-foreground">
                    Showing {currentPage * pageSize + 1} to{" "}
                    {Math.min(
                      (currentPage + 1) * pageSize,
                      processedOrders.length,
                    )}{" "}
                    of {processedOrders.length} orders
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
