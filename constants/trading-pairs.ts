import { TradingPair } from "@/types/trading-pair";
import { ASSETS } from "./assets";

export const TRADING_PAIRS = {
  "usdc-cnpy": {
    id: "usdc-cnpy",
    baseAsset: ASSETS.cnpy, // CNPY is being sold
    quoteAsset: ASSETS.usdc, // USDC is the payment/quote asset
    displayName: "USDC/CNPY",
    isActive: true,
    committee: 3,
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  "usdt-cnpy": {
    id: "usdt-cnpy",
    baseAsset: ASSETS.cnpy,
    quoteAsset: ASSETS.usdt, // USDC is the payment/quote asset
    displayName: "USDT/CNPY",
    isActive: true,
    committee: 3,
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
} as const satisfies Record<string, TradingPair>;

export const TRADING_PAIRS_LIST = Object.values(TRADING_PAIRS);
