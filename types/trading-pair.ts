import { Asset } from "./assets";

export interface TradingPair {
  id: string;
  baseAsset: Asset; // Asset being sold
  quoteAsset: Asset; // Asset being bought (quote/payment asset)
  displayName: string; // e.g., "USDC/CNPY"
  isActive: boolean;
  committee: number;
  contractAddress: string;
}
