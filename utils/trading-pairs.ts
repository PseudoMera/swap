import { TRADING_PAIRS } from "@/constants/trading-pairs";
import { TradingPair } from "@/types/trading-pair";
import { ASSETS } from "@/constants/assets";

export type TradingPairId = keyof typeof TRADING_PAIRS;
export type AssetSymbol = (typeof ASSETS)[keyof typeof ASSETS]["symbol"];

export const getTradingPairById = (pairId: TradingPairId): TradingPair => {
  const pair = TRADING_PAIRS[pairId];
  if (!pair) {
    throw new Error(`Trading pair not found: ${pairId}`);
  }
  return pair;
};

export const getTradingPairByAssets = (
  baseSymbol: AssetSymbol,
  quoteSymbol: AssetSymbol,
): TradingPair => {
  const pair = Object.values(TRADING_PAIRS).find(
    (p) =>
      p.baseAsset.symbol.toLowerCase() === baseSymbol.toLowerCase() &&
      p.quoteAsset.symbol.toLowerCase() === quoteSymbol.toLowerCase(),
  );
  if (!pair) {
    throw new Error(`Trading pair not found for ${baseSymbol}/${quoteSymbol}`);
  }
  return pair;
};

export const getActiveTradingPairs = (): TradingPair[] => {
  return Object.values(TRADING_PAIRS).filter((pair) => pair.isActive);
};

export const getAllTradingPairs = (): TradingPair[] => {
  return Object.values(TRADING_PAIRS);
};

// Helper function to get the default trading pair
export const getDefaultTradingPair = (): TradingPair => {
  return TRADING_PAIRS["usdc-cnpy"];
};
