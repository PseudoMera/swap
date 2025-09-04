import { Asset } from "@/types/assets";

export const ASSETS: Record<string, Asset> = {
  cnpy: {
    id: "cnpy",
    name: "Canopy",
    symbol: "CNPY",
    decimals: 6,
    chainId: "canopy",
    committee: 2,
    canSell: true,
    canBuy: false, // CNPY can be sold but not bought (it's the base asset)
    chainIcon: "/chains-icons/canopy-logo.svg",
    assetIcon: "/chains-icons/canopy-logo.svg",
  },
  usdc: {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    chainId: "ethereum",
    committee: 1,
    canSell: false, // USDC cannot be sold (it's the quote asset)
    canBuy: true, // USDC can be bought
    chainIcon: "/chains-icons/ethereum-logo.svg",
    assetIcon: "/chains-icons/usdc-logo.svg",
  },
} as const;
