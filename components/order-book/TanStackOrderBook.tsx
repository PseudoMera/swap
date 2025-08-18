"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { usePollingData } from "@/context/polling-context";
import { blockchainUValueToNumber } from "@/utils/blockchain";
import { formatLastUpdated } from "@/utils/time";
import { DepthTable } from "./DepthTable";
import { OrdersTable } from "./OrdersTable";
import { Order } from "@/types/order";
import { TradingPair } from "@/types/trading-pair";

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

interface TanStackOrderBookProps {
  onOrderSelect: (order: ProcessedOrder) => void;
  onOrderRemove: (order: ProcessedOrder) => void;
  selectedOrders: ProcessedOrder[];
  tradingPair?: TradingPair;
  isSwapped: boolean;
}

export function TanStackOrderBook({
  onOrderSelect,
  onOrderRemove,
  selectedOrders,
  tradingPair,
  isSwapped,
}: TanStackOrderBookProps) {
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  
  const {
    orders,
    ordersLoading,
    ordersError,
    refetchOrders,
    ordersLastUpdated,
  } = usePollingData();

  // Process orders: filter by trading pair and convert values
  const processedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    if (!tradingPair) return [];

    try {
      const targetCommittee = tradingPair.baseAsset.committee;

      const allOrders = orders
        .filter((order) => order && order.committee === targetCommittee)
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

      // Apply price filter if selected
      if (selectedPrice !== null) {
        return allOrders.filter((order) => {
          const priceKey = order.price.toFixed(4);
          const selectedPriceKey = selectedPrice.toFixed(4);
          return priceKey === selectedPriceKey;
        });
      }

      return allOrders;
    } catch (error) {
      console.error("Error processing orders:", error);
      return [];
    }
  }, [orders, tradingPair, selectedPrice]);

  // Get all orders without price filter for aggregation
  const allProcessedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    if (!tradingPair) return [];

    try {
      const targetCommittee = tradingPair.baseAsset.committee;

      return orders
        .filter((order) => order && order.committee === targetCommittee)
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
        .sort((a, b) => a.price - b.price);
    } catch (error) {
      console.error("Error processing all orders:", error);
      return [];
    }
  }, [orders, tradingPair]);

  // Aggregate orders by price for depth view (top 10 only)
  const aggregatedOrders = useMemo(() => {
    if (!allProcessedOrders || allProcessedOrders.length === 0) return [];

    try {
      const priceMap = new Map<string, AggregatedOrder>();

      // Group by price level
      allProcessedOrders.forEach((order) => {
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
  }, [allProcessedOrders]);

  const handlePriceSelect = (price: number) => {
    // Toggle filter: if same price is clicked, clear filter
    if (selectedPrice !== null && selectedPrice.toFixed(4) === price.toFixed(4)) {
      setSelectedPrice(null);
    } else {
      setSelectedPrice(price);
    }
  };

  const handleClearFilter = () => {
    setSelectedPrice(null);
  };

  if (ordersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Order Book ({tradingPair?.displayName || "Loading..."})
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
          Order Book ({tradingPair?.displayName || "Loading..."})
          <div className="flex items-center gap-3">
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
            {ordersLastUpdated && (
              <span className="text-sm text-muted-foreground font-normal flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Last updated: {formatLastUpdated(ordersLastUpdated)}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Depth Table */}
        <div>
          <DepthTable 
            data={aggregatedOrders} 
            loading={ordersLoading} 
            onPriceSelect={handlePriceSelect}
            selectedPrice={selectedPrice}
          />
        </div>

        {/* Individual Orders Table */}
        <div>
          {selectedPrice !== null && (
            <div className="flex items-center justify-between mb-3 p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filtered by price:</span>
                <span className="font-mono text-green-600 font-semibold">
                  {selectedPrice.toFixed(4)} USDC
                </span>
                <span className="text-sm text-muted-foreground">
                  ({processedOrders.length} orders)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilter}
                className="h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filter
              </Button>
            </div>
          )}
          <OrdersTable
            data={processedOrders}
            loading={ordersLoading}
            onOrderSelect={onOrderSelect}
            onOrderRemove={onOrderRemove}
            selectedOrders={selectedOrders}
            isSwapped={isSwapped}
          />
        </div>
      </CardContent>
    </Card>
  );
}
