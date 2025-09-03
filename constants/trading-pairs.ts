import { TradingPair } from "@/types/trading-pair";
import { ASSETS } from "./assets";

export const TRADING_PAIRS: Record<string, TradingPair> = {
  "usdc-cnpy": {
    id: "usdc-cnpy",
    baseAsset: ASSETS.cnpy, // CNPY is being sold
    quoteAsset: ASSETS.usdc, // USDC is the payment/quote asset
    displayName: "USDC/CNPY",
    isActive: true,
    committee: 1,
  },
};

export const TRADING_PAIRS_LIST = Object.values(TRADING_PAIRS);
