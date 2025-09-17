"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SizeCategory,
  SizeCategoryDefinition,
} from "@/types/order-book-filters";
import { X } from "lucide-react";

interface SizeCategoryFilterProps {
  title: string;
  value: SizeCategory;
  onValueChange: (value: SizeCategory) => void;
  onClear: () => void;
  categories: SizeCategoryDefinition;
}

function SizeCategoryFilter({
  title,
  value,
  onValueChange,
  onClear,
  categories,
}: SizeCategoryFilterProps) {
  return (
    <div className="p-3 bg-card border border-primary/20 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{title}</span>
        {value !== "all" && (
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
            <SelectValue placeholder="All Sizes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sizes</SelectItem>
            <SelectItem value="small">
              <div className="flex flex-col">
                <span>{categories.small.label}</span>
                <span className="text-xs text-muted-foreground">
                  {categories.small.range}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex flex-col">
                <span>{categories.medium.label}</span>
                <span className="text-xs text-muted-foreground">
                  {categories.medium.range}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="large">
              <div className="flex flex-col">
                <span>{categories.large.label}</span>
                <span className="text-xs text-muted-foreground">
                  {categories.large.range}
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default SizeCategoryFilter;
