"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import RangeFilter from "./RangeFilter";
import SizeCategoryFilter from "./SizeCategoryFilter";
import OrderStatusFilter from "./OrderStatusFilter";
import { SizeCategory, RangeType, OrderStatus } from "@/types/order-book-filters";
import { ProcessedOrder } from "./TanStackOrderBook";
import { TradingPair } from "@/types/trading-pair";

interface OrderFiltersProps {
  allProcessedOrders: ProcessedOrder[];
  tradingPair?: TradingPair;

  // Filter states
  priceRange: [number, number] | null;
  amountRange: [number, number] | null;
  totalRange: [number, number] | null;
  sizeCategory: SizeCategory;
  orderStatus: OrderStatus;
  selectedPrice: number | null;

  // Filter handlers
  onRangeChange: (type: RangeType, values: number[]) => void;
  onClearRange: (type: RangeType) => void;
  onSizeCategoryChange: (category: SizeCategory) => void;
  onClearSizeCategory: () => void;
  onOrderStatusChange: (status: OrderStatus) => void;
  onClearOrderStatus: () => void;
  onClearAllFilters: () => void;
}

function OrderFilters({
  allProcessedOrders,
  tradingPair,
  priceRange,
  amountRange,
  totalRange,
  sizeCategory,
  orderStatus,
  selectedPrice,
  onRangeChange,
  onClearRange,
  onSizeCategoryChange,
  onClearSizeCategory,
  onOrderStatusChange,
  onClearOrderStatus,
  onClearAllFilters,
}: OrderFiltersProps) {
  const rangeMinMax = useMemo(() => {
    if (!allProcessedOrders || allProcessedOrders.length === 0) {
      return {
        price: { min: 0, max: 100 },
        amount: { min: 0, max: 1000 },
        total: { min: 0, max: 1000 },
      };
    }

    const prices = allProcessedOrders.map((order) => order.price);
    const amounts = allProcessedOrders.map((order) => order.amountForSale);
    const totals = allProcessedOrders.map((order) => order.total);

    return {
      price: { min: Math.min(...prices), max: Math.max(...prices) },
      amount: { min: Math.min(...amounts), max: Math.max(...amounts) },
      total: { min: Math.min(...totals), max: Math.max(...totals) },
    };
  }, [allProcessedOrders]);

  // Calculate size category thresholds based on amount for sale
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
      large: amounts[length - 1],
    };
  }, [allProcessedOrders]);

  const sizeCategoryDefinitions = useMemo(() => {
    const baseSymbol = tradingPair?.baseAsset.symbol || "CNPY";

    return {
      small: {
        label: `Small Orders`,
        range: `< ${sizeCategoryThresholds.small.toLocaleString()} ${baseSymbol}`,
      },
      medium: {
        label: `Medium Orders`,
        range: `${sizeCategoryThresholds.small.toLocaleString()} - ${sizeCategoryThresholds.medium.toLocaleString()} ${baseSymbol}`,
      },
      large: {
        label: `Large Orders`,
        range: `> ${sizeCategoryThresholds.medium.toLocaleString()} ${baseSymbol}`,
      },
    };
  }, [sizeCategoryThresholds, tradingPair]);

  // Calculate order status counts
  const orderStatusCounts = useMemo(() => {
    if (!allProcessedOrders || allProcessedOrders.length === 0) {
      return { available: 0, locked: 0 };
    }

    const available = allProcessedOrders.filter(order => !order.buyerSendAddress).length;
    const locked = allProcessedOrders.filter(order => !!order.buyerSendAddress).length;

    return { available, locked };
  }, [allProcessedOrders]);

  if (!allProcessedOrders || allProcessedOrders.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Order Filters</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAllFilters}
            className="h-8 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All Filters
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <RangeFilter
            title="Price Range"
            min={rangeMinMax.price.min}
            max={rangeMinMax.price.max}
            value={priceRange}
            onValueChange={(values) => onRangeChange("price", values)}
            onClear={() => onClearRange("price")}
            disabled={selectedPrice !== null}
            step={0.0001}
            unit={` ${tradingPair?.quoteAsset.symbol || "USDC"}`}
            formatValue={(val) => val.toFixed(4)}
          />

          <RangeFilter
            title="Amount Range"
            min={rangeMinMax.amount.min}
            max={rangeMinMax.amount.max}
            value={amountRange}
            onValueChange={(values) => onRangeChange("amount", values)}
            onClear={() => onClearRange("amount")}
            step={1}
            unit={` ${tradingPair?.baseAsset.symbol || "CNPY"}`}
            formatValue={(val) => val.toLocaleString()}
          />

          <RangeFilter
            title="Total Range"
            min={rangeMinMax.total.min}
            max={rangeMinMax.total.max}
            value={totalRange}
            onValueChange={(values) => onRangeChange("total", values)}
            onClear={() => onClearRange("total")}
            step={0.01}
            unit={` ${tradingPair?.quoteAsset.symbol || "USDC"}`}
            formatValue={(val) => val.toFixed(2)}
          />

          <SizeCategoryFilter
            title="Order Size"
            value={sizeCategory}
            onValueChange={onSizeCategoryChange}
            onClear={onClearSizeCategory}
            categories={sizeCategoryDefinitions}
          />

          <OrderStatusFilter
            title="Order Status"
            value={orderStatus}
            onValueChange={onOrderStatusChange}
            onClear={onClearOrderStatus}
            availableCount={orderStatusCounts.available}
            lockedCount={orderStatusCounts.locked}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderFilters;
