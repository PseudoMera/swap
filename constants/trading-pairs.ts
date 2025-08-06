import { Asset } from './assets';

export interface TradingPair {
  id: string;
  baseAsset: Asset;    // Asset being sold
  quoteAsset: Asset;   // Asset being bought (quote/payment asset)
  displayName: string; // e.g., "USDC/CNPY"
  isActive: boolean;
}

// Import assets to build trading pairs
import { ASSETS } from './assets';

export const TRADING_PAIRS: Record<string, TradingPair> = {
  'usdc-cnpy': {
    id: 'usdc-cnpy',
    baseAsset: ASSETS.cnpy,   // CNPY is being sold
    quoteAsset: ASSETS.usdc,  // USDC is the payment/quote asset
    displayName: 'USDC/CNPY',
    isActive: true,
  },
};

export const getTradingPairById = (pairId: string): TradingPair => {
  const pair = TRADING_PAIRS[pairId];
  if (!pair) {
    throw new Error(`Trading pair not found: ${pairId}`);
  }
  return pair;
};

export const getTradingPairByAssets = (baseSymbol: string, quoteSymbol: string): TradingPair => {
  const pair = Object.values(TRADING_PAIRS).find(
    p => p.baseAsset.symbol.toLowerCase() === baseSymbol.toLowerCase() && 
        p.quoteAsset.symbol.toLowerCase() === quoteSymbol.toLowerCase()
  );
  if (!pair) {
    throw new Error(`Trading pair not found for ${baseSymbol}/${quoteSymbol}`);
  }
  return pair;
};

export const getActiveTradingPairs = (): TradingPair[] => {
  return Object.values(TRADING_PAIRS).filter(pair => pair.isActive);
};

export const getAllTradingPairs = (): TradingPair[] => {
  return Object.values(TRADING_PAIRS);
};

// Helper function to get the default trading pair
export const getDefaultTradingPair = (): TradingPair => {
  return TRADING_PAIRS['usdc-cnpy'];
};