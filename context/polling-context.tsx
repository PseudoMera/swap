"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/services/orders";
import { Order } from "@/types/order";
// import { fetchUserBalance } from "@/services/balance";
import { fetchHeight } from "@/services/height";
import { QUERY_KEYS, POLLING_INTERVALS } from "@/constants/api";

interface PollingContextValue {
  orders: Order[] | undefined;
  ordersLoading: boolean;
  ordersError: Error | null;
  refetchOrders: () => void;

  // userBalance: any | undefined;
  // balanceLoading: boolean;
  // balanceError: Error | null;
  // refetchBalance: () => void;

  height: number | undefined;
  heightLoading: boolean;
  heightError: Error | null;
  refetchHeight: () => void;
}

const PollingContext = createContext<PollingContextValue | undefined>(
  undefined,
);

interface PollingProviderProps {
  children: ReactNode;
  ordersInterval?: number;
  balanceInterval?: number;
  heightInterval?: number;
}

export function PollingProvider({
  children,
  ordersInterval = POLLING_INTERVALS.ORDERS,
  balanceInterval = POLLING_INTERVALS.BALANCE,
  heightInterval = POLLING_INTERVALS.HEIGHT,
}: PollingProviderProps) {
  const {
    data: height,
    isLoading: heightLoading,
    error: heightError,
    refetch: refetchHeight,
  } = useQuery({
    queryKey: QUERY_KEYS.HEIGHT,
    queryFn: fetchHeight,
    refetchInterval: heightInterval,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['orders', height],
    queryFn: () => fetchOrders(height || 0),
    refetchInterval: height ? ordersInterval : false, // Only poll if we have height
    enabled: Boolean(height && height > 0),
    staleTime: ordersInterval, // Cache for the polling interval
    gcTime: ordersInterval * 2, // Keep in cache for 2x polling interval
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1,
  });

  // const {
  //   data: userBalance,
  //   isLoading: balanceLoading,
  //   error: balanceError,
  //   refetch: refetchBalance,
  // } = useQuery({
  //   queryKey: QUERY_KEYS.USER_BALANCE,
  //   queryFn: fetchUserBalance,
  //   refetchInterval: balanceInterval,
  //   staleTime: 0,
  // });

  return (
    <PollingContext.Provider
      value={{
        orders,
        ordersLoading,
        ordersError: ordersError as Error | null,
        refetchOrders,
        // userBalance: undefined,
        // balanceLoading: false,
        // balanceError: null,
        // refetchBalance: () => {},
        height,
        heightLoading,
        heightError: heightError as Error | null,
        refetchHeight,
      }}
    >
      {children}
    </PollingContext.Provider>
  );
}

export function usePollingData() {
  const context = useContext(PollingContext);
  if (context === undefined) {
    throw new Error("usePollingData must be used within a PollingProvider");
  }
  return context;
}
