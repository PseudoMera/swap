export type AssetId = "usdc" | "cnpy";

export interface Asset {
  id: AssetId;
  name: string;
  symbol: string;
  decimals: number;
  chainId: string;
  committee: number;
  canSell: boolean;
  canBuy: boolean;
  chainIcon: string;
  assetIcon: string;
}
