export interface Asset {
  id: string;
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
