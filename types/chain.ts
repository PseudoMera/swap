import { Chain } from "@/constants/chains";
import { Asset } from "@/constants/assets";
import { TradingPair } from "@/constants/trading-pairs";

export interface ChainConfig {
  chain: Chain;
  assets: Asset[];
  isActive: boolean;
}

export interface SwapContext {
  selectedTradingPair: TradingPair;
  availableTradingPairs: TradingPair[];
}

export type { Chain, Asset, TradingPair };
