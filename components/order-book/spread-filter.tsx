"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { SpreadFilter as SpreadFilterType } from "@/types/order-book-filters";

interface SpreadFilterProps {
  title: string;
  value: SpreadFilterType;
  onValueChange: (value: SpreadFilterType) => void;
  onClear: () => void;
  bestPrice: number | null;
  tradingPairSymbol: string;
}

function SpreadFilter({
  title,
  value,
  onValueChange,
  onClear,
  bestPrice,
  tradingPairSymbol,
}: SpreadFilterProps) {
  return (
    <div className="p-3 bg-card border border-primary/20 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{title}</span>
        {value !== 'all' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-6 text-xs px-2"
          >
            Clear
            <X className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
      <div className="space-y-3">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Spreads" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Spreads</SelectItem>
            <SelectItem value="1%">
              <div className="flex flex-col">
                <span>Within 1%</span>
                {bestPrice && (
                  <span className="text-xs text-muted-foreground">
                    ≤ {(bestPrice * 1.01).toFixed(4)} {tradingPairSymbol}
                  </span>
                )}
              </div>
            </SelectItem>
            <SelectItem value="2%">
              <div className="flex flex-col">
                <span>Within 2%</span>
                {bestPrice && (
                  <span className="text-xs text-muted-foreground">
                    ≤ {(bestPrice * 1.02).toFixed(4)} {tradingPairSymbol}
                  </span>
                )}
              </div>
            </SelectItem>
            <SelectItem value="5%">
              <div className="flex flex-col">
                <span>Within 5%</span>
                {bestPrice && (
                  <span className="text-xs text-muted-foreground">
                    ≤ {(bestPrice * 1.05).toFixed(4)} {tradingPairSymbol}
                  </span>
                )}
              </div>
            </SelectItem>
            <SelectItem value="10%">
              <div className="flex flex-col">
                <span>Within 10%</span>
                {bestPrice && (
                  <span className="text-xs text-muted-foreground">
                    ≤ {(bestPrice * 1.10).toFixed(4)} {tradingPairSymbol}
                  </span>
                )}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {bestPrice && (
          <div className="text-xs text-center text-muted-foreground">
            Best price: {bestPrice.toFixed(4)} {tradingPairSymbol}
          </div>
        )}
      </div>
    </div>
  );
}

export default SpreadFilter;