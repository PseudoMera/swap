import { Asset } from "./assets";
import { TradingPair } from "./trading-pair";

export interface ChainConfig {
  chain: Chain;
  assets: Asset[];
  isActive: boolean;
}

export interface SwapContext {
  selectedTradingPair: TradingPair;
  availableTradingPairs: TradingPair[];
}

export interface Chain {
  id: string;
  name: string;
  rpcUrl: {
    query: string;
    admin: string;
  };
}
