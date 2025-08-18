export type SizeCategory = "all" | "small" | "medium" | "large";

export type RangeType = "price" | "amount" | "total";

export type OrderStatus = "all" | "available" | "locked";

export type SpreadFilter = "all" | "1%" | "2%" | "5%" | "10%";

export interface SizeCategoryDefinition {
  small: { label: string; range: string };
  medium: { label: string; range: string };
  large: { label: string; range: string };
}
