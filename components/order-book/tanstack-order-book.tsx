"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { usePollingData } from "@/context/polling-context";
import { blockchainUValueToNumber } from "@/utils/blockchain";
import { formatLastUpdated } from "@/utils/time";
import { Order } from "@/types/order";
import OrderFilters from "./orders-filter";
import {
  SizeCategory,
  RangeType,
  OrderStatus,
  SpreadFilter,
} from "@/types/order-book-filters";
import DepthTable from "./depth-table";
import { useTradePairContext } from "@/context/trade-pair-context";
import OrdersTable from "./orders-table";

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
  isSwapped: boolean;
}

function TanStackOrderBook({
  onOrderSelect,
  onOrderRemove,
  selectedOrders,
  isSwapped,
}: TanStackOrderBookProps) {
  const { tradePair } = useTradePairContext();

  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [amountRange, setAmountRange] = useState<[number, number] | null>(null);
  const [totalRange, setTotalRange] = useState<[number, number] | null>(null);
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>("all");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("all");
  const [spreadFilter, setSpreadFilter] = useState<SpreadFilter>("all");

  const {
    orders,
    ordersLoading,
    ordersError,
    refetchOrders,
    ordersLastUpdated,
  } = usePollingData();

  // Get all orders without price filter for aggregation and threshold calculation
  const allProcessedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    if (!tradePair) return [];

    try {
      const targetCommittee = tradePair.quoteAsset.committee;

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
  }, [orders, tradePair]);

  // Calculate size category thresholds based on amount for sale - MOVED UP
  const sizeCategoryThresholds = useMemo(() => {
    if (!allProcessedOrders || allProcessedOrders.length === 0) {
      return { small: 0, medium: 100, large: 1000 };
    }

    const amounts = allProcessedOrders
      .map((order) => order.amountForSale)
      .sort((a, b) => a - b);
    const length = amounts.length;

    // Use percentiles: small (0-33%), medium (33-66%), large (66-100%)
    const smallThreshold = amounts[Math.floor(length * 0.33)];
    const mediumThreshold = amounts[Math.floor(length * 0.66)];

    return {
      small: smallThreshold,
      medium: mediumThreshold,
      large: amounts[length - 1], // max value
    };
  }, [allProcessedOrders]);

  // Process orders: filter by trading pair and convert values
  const processedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    if (!tradePair) return [];

    try {
      const targetCommittee = tradePair.quoteAsset.committee;

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

      // Apply filters
      let filteredOrders = allOrders;

      // Apply price selection filter (from depth table click)
      if (selectedPrice !== null) {
        filteredOrders = filteredOrders.filter((order) => {
          const priceKey = order.price.toFixed(4);
          const selectedPriceKey = selectedPrice.toFixed(4);
          return priceKey === selectedPriceKey;
        });
      }

      // Apply price range filter (from slider) - only if no specific price is selected
      if (priceRange !== null && selectedPrice === null) {
        const [minPrice, maxPrice] = priceRange;
        filteredOrders = filteredOrders.filter((order) => {
          return order.price >= minPrice && order.price <= maxPrice;
        });
      }

      // Apply amount range filter
      if (amountRange !== null) {
        const [minAmount, maxAmount] = amountRange;
        filteredOrders = filteredOrders.filter((order) => {
          return (
            order.amountForSale >= minAmount && order.amountForSale <= maxAmount
          );
        });
      }

      // Apply total range filter
      if (totalRange !== null) {
        const [minTotal, maxTotal] = totalRange;
        filteredOrders = filteredOrders.filter((order) => {
          return order.total >= minTotal && order.total <= maxTotal;
        });
      }

      // Apply size category filter
      if (sizeCategory !== "all") {
        filteredOrders = filteredOrders.filter((order) => {
          switch (sizeCategory) {
            case "small":
              return order.amountForSale < sizeCategoryThresholds.small;
            case "medium":
              return (
                order.amountForSale >= sizeCategoryThresholds.small &&
                order.amountForSale < sizeCategoryThresholds.medium
              );
            case "large":
              return order.amountForSale >= sizeCategoryThresholds.medium;
            default:
              return true;
          }
        });
      }

      // Apply order status filter
      if (orderStatus !== "all") {
        filteredOrders = filteredOrders.filter((order) => {
          switch (orderStatus) {
            case "available":
              return !order.buyerSendAddress; // Available orders have no buyer
            case "locked":
              return !!order.buyerSendAddress; // Locked orders have a buyer
            default:
              return true;
          }
        });
      }

      // Apply spread filter
      if (spreadFilter !== "all") {
        const bestPrice = Math.min(...allOrders.map((o) => o.price));
        const spreadMultiplier = {
          "1%": 1.01,
          "2%": 1.02,
          "5%": 1.05,
          "10%": 1.1,
        }[spreadFilter];

        if (spreadMultiplier) {
          const maxAllowedPrice = bestPrice * spreadMultiplier;
          filteredOrders = filteredOrders.filter((order) => {
            return order.price <= maxAllowedPrice;
          });
        }
      }

      return filteredOrders;
    } catch (error) {
      console.error("Error processing orders:", error);
      return [];
    }
  }, [
    orders,
    tradePair,
    selectedPrice,
    priceRange,
    amountRange,
    totalRange,
    sizeCategory,
    orderStatus,
    spreadFilter,
    sizeCategoryThresholds,
  ]);

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
    if (
      selectedPrice !== null &&
      selectedPrice.toFixed(4) === price.toFixed(4)
    ) {
      setSelectedPrice(null);
    } else {
      setSelectedPrice(price);
    }
  };

  const handleClearFilter = () => {
    setSelectedPrice(null);
    setPriceRange(null);
    setAmountRange(null);
    setTotalRange(null);
    setSizeCategory("all");
    setOrderStatus("all");
    setSpreadFilter("all");
  };

  const handleRangeChange = (type: RangeType, values: number[]) => {
    if (values.length === 2) {
      switch (type) {
        case "price":
          setPriceRange([values[0], values[1]]);
          setSelectedPrice(null); // Clear specific price selection when using range
          break;
        case "amount":
          setAmountRange([values[0], values[1]]);
          break;
        case "total":
          setTotalRange([values[0], values[1]]);
          break;
      }
    }
  };

  const handleClearRange = (type: RangeType) => {
    switch (type) {
      case "price":
        setPriceRange(null);
        break;
      case "amount":
        setAmountRange(null);
        break;
      case "total":
        setTotalRange(null);
        break;
    }
  };

  const handleSizeCategoryChange = (category: SizeCategory) => {
    setSizeCategory(category);
  };

  const handleClearSizeCategory = () => {
    setSizeCategory("all");
  };

  const handleOrderStatusChange = (status: OrderStatus) => {
    setOrderStatus(status);
  };

  const handleClearOrderStatus = () => {
    setOrderStatus("all");
  };

  const handleSpreadFilterChange = (filter: SpreadFilter) => {
    setSpreadFilter(filter);
  };

  const handleClearSpreadFilter = () => {
    setSpreadFilter("all");
  };

  if (ordersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Order Book ({tradePair?.displayName || "Loading..."})
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
          Order Book ({tradePair?.displayName || "Loading..."})
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
          {/* Filter Controls */}
          <OrderFilters
            allProcessedOrders={allProcessedOrders}
            tradingPair={tradePair}
            priceRange={priceRange}
            amountRange={amountRange}
            totalRange={totalRange}
            sizeCategory={sizeCategory}
            orderStatus={orderStatus}
            spreadFilter={spreadFilter}
            selectedPrice={selectedPrice}
            onRangeChange={handleRangeChange}
            onClearRange={handleClearRange}
            onSizeCategoryChange={handleSizeCategoryChange}
            onClearSizeCategory={handleClearSizeCategory}
            onOrderStatusChange={handleOrderStatusChange}
            onClearOrderStatus={handleClearOrderStatus}
            onSpreadFilterChange={handleSpreadFilterChange}
            onClearSpreadFilter={handleClearSpreadFilter}
            onClearAllFilters={handleClearFilter}
          />

          {/* Price Selection Filter (from depth table) */}
          {selectedPrice !== null && (
            <div className="flex items-center justify-between mb-3 p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filtered by price:</span>
                <span className="font-mono text-foreground font-semibold">
                  {selectedPrice.toFixed(4)}{" "}
                  {tradePair?.quoteAsset.symbol || "USDC"}
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

export default TanStackOrderBook;
