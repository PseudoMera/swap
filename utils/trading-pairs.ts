import { TRADING_PAIRS } from "@/constants/trading-pairs";
import { TradingPair } from "@/types/trading-pair";

export const getTradingPairById = (pairId: string): TradingPair => {
  const pair = TRADING_PAIRS[pairId];
  if (!pair) {
    throw new Error(`Trading pair not found: ${pairId}`);
  }
  return pair;
};

export const getTradingPairByAssets = (
  baseSymbol: string,
  quoteSymbol: string,
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
