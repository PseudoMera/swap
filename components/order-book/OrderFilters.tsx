"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp, Filter } from "lucide-react";
import RangeFilter from "./RangeFilter";
import SizeCategoryFilter from "./SizeCategoryFilter";
import OrderStatusFilter from "./OrderStatusFilter";
import SpreadFilter from "./SpreadFilter";
import { SizeCategory, RangeType, OrderStatus, SpreadFilter as SpreadFilterType } from "@/types/order-book-filters";
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
  spreadFilter: SpreadFilterType;
  selectedPrice: number | null;

  // Filter handlers
  onRangeChange: (type: RangeType, values: number[]) => void;
  onClearRange: (type: RangeType) => void;
  onSizeCategoryChange: (category: SizeCategory) => void;
  onClearSizeCategory: () => void;
  onOrderStatusChange: (status: OrderStatus) => void;
  onClearOrderStatus: () => void;
  onSpreadFilterChange: (filter: SpreadFilterType) => void;
  onClearSpreadFilter: () => void;
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
  spreadFilter,
  selectedPrice,
  onRangeChange,
  onClearRange,
  onSizeCategoryChange,
  onClearSizeCategory,
  onOrderStatusChange,
  onClearOrderStatus,
  onSpreadFilterChange,
  onClearSpreadFilter,
  onClearAllFilters,
}: OrderFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Calculate best price (lowest price) for spread filter
  const bestPrice = useMemo(() => {
    if (!allProcessedOrders || allProcessedOrders.length === 0) {
      return null;
    }

    const prices = allProcessedOrders.map(order => order.price);
    return Math.min(...prices);
  }, [allProcessedOrders]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      priceRange ||
      amountRange ||
      totalRange ||
      sizeCategory !== "all" ||
      orderStatus !== "all" ||
      spreadFilter !== "all"
    );
  }, [priceRange, amountRange, totalRange, sizeCategory, orderStatus, spreadFilter]);

  if (!allProcessedOrders || allProcessedOrders.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Order Filters {hasActiveFilters && <span className="text-sm text-green-600 ml-1">(Active)</span>}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {isExpanded && hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAllFilters}
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

          <SpreadFilter
            title="Price Spread"
            value={spreadFilter}
            onValueChange={onSpreadFilterChange}
            onClear={onClearSpreadFilter}
            bestPrice={bestPrice}
            tradingPairSymbol={tradingPair?.quoteAsset.symbol || "USDC"}
          />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default OrderFilters;
