export type SizeCategory = "all" | "small" | "medium" | "large";

export type RangeType = "price" | "amount" | "total";

export interface SizeCategoryDefinition {
  small: { label: string; range: string };
  medium: { label: string; range: string };
  large: { label: string; range: string };
}
