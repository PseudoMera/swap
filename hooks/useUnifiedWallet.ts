import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import { Address } from "@/types/rpc";

export interface ExternalWallet {
  address: Address;
  chain: {
    id: number;
    name?: string;
  } | null;
  connector: {
    name?: string;
    icon?: string;
  } | null;
}

export interface UnifiedWalletState {
  wallet: ExternalWallet | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
}

/**
 * Unified external wallet state management hook that consolidates wagmi and reown
 * into a single source of truth. Canopy wallets are handled separately.
 *
 * Priority order:
 * 1. Wagmi (most reliable, provides full chain info)
 * 2. AppKit (fallback for reown connections)
 */
export function useUnifiedWallet(): UnifiedWalletState {
  const wagmiAccount = useAccount();
  const appKitAccount = useAppKitAccount({ namespace: "eip155" });

  const connectedWallet = useMemo((): ExternalWallet | null => {
    // Priority 1: Wagmi (most reliable with full chain info)
    if (wagmiAccount.isConnected && wagmiAccount.address) {
      return {
        address: wagmiAccount.address,
        chain: wagmiAccount.chain
          ? {
              id: wagmiAccount.chain.id,
              name: wagmiAccount.chain.name,
            }
          : null,
        connector: wagmiAccount.connector
          ? {
              name: wagmiAccount.connector.name,
              icon: wagmiAccount.connector.icon,
            }
          : null,
      };
    }

    // Priority 2: AppKit (fallback for reown connections)
    if (appKitAccount.isConnected && appKitAccount.address) {
      return {
        address: appKitAccount.address,
        chain: null,
        connector: null,
      };
    }

    return null;
  }, [wagmiAccount, appKitAccount]);

  const isConnecting = wagmiAccount.isConnecting || false;
  const isReconnecting = wagmiAccount.isReconnecting || false;
  const isConnected = Boolean(connectedWallet);

  return {
    wallet: connectedWallet,
    isConnected,
    isConnecting,
    isReconnecting,
  };
}
