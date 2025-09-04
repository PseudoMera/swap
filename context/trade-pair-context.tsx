"use client";

import { TradingPair } from "@/types/trading-pair";
import { getDefaultTradingPair } from "@/utils/trading-pairs";
import { createContext, useContext, useMemo, useState } from "react";

interface TradePairContextValue {
  tradePair: TradingPair;
  updateSelectedPair: (pair: TradingPair) => void;
}

const TradePairContext = createContext<TradePairContextValue>({
  tradePair: getDefaultTradingPair(),
  updateSelectedPair: () => {},
});

interface TradePairContextProps {
  children: React.ReactNode;
}

function TradePairContextProvider({ children }: TradePairContextProps) {
  const [selectedPair, setSelectedPair] = useState(getDefaultTradingPair());

  const updateSelectedPair = (pair: TradingPair) => {
    setSelectedPair(pair);
  };

  const ctxValue = useMemo(
    () => ({
      tradePair: selectedPair,
      updateSelectedPair,
    }),
    [selectedPair],
  );

  return (
    <TradePairContext.Provider value={ctxValue}>
      {children}
    </TradePairContext.Provider>
  );
}

function useTradePairContext(): TradePairContextValue {
  const context = useContext(TradePairContext);
  if (!context) {
    throw new Error(
      "useTradePairContext must be used within a TradePairContextProvider",
    );
  }
  return context;
}

export { TradePairContextProvider, useTradePairContext };
