"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { OrderStatus } from "@/types/order-book-filters";

interface OrderStatusFilterProps {
  title: string;
  value: OrderStatus;
  onValueChange: (value: OrderStatus) => void;
  onClear: () => void;
  availableCount: number;
  lockedCount: number;
}

function OrderStatusFilter({
  title,
  value,
  onValueChange,
  onClear,
  availableCount,
  lockedCount,
}: OrderStatusFilterProps) {
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
            <SelectValue placeholder="All Orders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="available">
              <div className="flex flex-col">
                <span>Available Orders</span>
                <span className="text-xs text-muted-foreground">{availableCount} orders</span>
              </div>
            </SelectItem>
            <SelectItem value="locked">
              <div className="flex flex-col">
                <span>Locked Orders</span>
                <span className="text-xs text-muted-foreground">{lockedCount} orders</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default OrderStatusFilter;