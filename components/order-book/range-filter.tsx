"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

interface RangeFilterProps {
  title: string;
  min: number;
  max: number;
  value: [number, number] | null;
  onValueChange: (values: number[]) => void;
  onClear: () => void;
  disabled?: boolean;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
}

function RangeFilter({
  title,
  min,
  max,
  value,
  onValueChange,
  onClear,
  disabled = false,
  step = 0.0001,
  unit = "",
  formatValue = (val) => val.toFixed(4),
}: RangeFilterProps) {
  return (
    <div className="p-3 bg-card border border-primary/20 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{title}</span>
        {value && (
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
        <Slider
          value={value || [min, max]}
          onValueChange={onValueChange}
          min={min}
          max={max}
          step={step}
          className="w-full [&_[data-slot=slider-range]]:bg-primary"
          disabled={disabled}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Min: {formatValue(min)}
            {unit}
          </span>
          <span>
            Max: {formatValue(max)}
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

export default RangeFilter;
