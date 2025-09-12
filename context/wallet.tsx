"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAppKitWallet } from "@reown/appkit-wallet-button/react";
import { useDisconnect } from "@reown/appkit/react";
import {
  ChainType,
  WalletType,
  type CanopyWalletAccount,
} from "@/types/wallet";
import { secureStorage, type KeyfileMetadata } from "@/lib/secure-storage";
import { hasStoredPassword } from "@/utils/keyfile-session";

interface WalletContextType {
  // External wallet connection functions
  connect: (type: WalletType, chain: ChainType) => void;
  disconnect: (type: WalletType, chain: ChainType) => Promise<void>;
  // Canopy wallet state
  storedKeyfiles: KeyfileMetadata[];
  selectedCanopyWallet: CanopyWalletAccount | null;
  setSelectedCanopyWallet: (wallet: CanopyWalletAccount | null) => void;
  refreshStoredKeyfiles: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // Canopy wallet state only
  const [storedKeyfiles, setStoredKeyfiles] = useState<KeyfileMetadata[]>([]);
  const [selectedCanopyWallet, setSelectedCanopyWallet] =
    useState<CanopyWalletAccount | null>(null);

  const { disconnect } = useDisconnect();

  const refreshStoredKeyfiles = useCallback(async () => {
    try {
      const keyfiles = await secureStorage.listKeyfiles();
      setStoredKeyfiles(keyfiles);

      // Clear selection if selected keyfile no longer exists or has no password
      if (selectedCanopyWallet) {
        const keyfile = keyfiles.find((kf) => kf.id === selectedCanopyWallet.keyfileId);
        if (!keyfile || !hasStoredPassword(keyfile.filename)) {
          setSelectedCanopyWallet(null);
        }
      }

      // Auto-select first keyfile with stored password if none selected
      if (!selectedCanopyWallet && keyfiles.length > 0) {
        const keyfileWithPassword = keyfiles.find((kf) => hasStoredPassword(kf.filename));
        if (keyfileWithPassword && keyfileWithPassword.accountAddresses.length > 0) {
          setSelectedCanopyWallet({
            address: keyfileWithPassword.accountAddresses[0],
            keyfileId: keyfileWithPassword.id,
            filename: keyfileWithPassword.filename,
          });
        }
      }
    } catch (error) {
      console.error("Failed to refresh stored keyfiles:", error);
    }
  }, [selectedCanopyWallet]);

  // Hook for external wallet connections (MetaMask, etc.)
  const { connect: connectEVM } = useAppKitWallet({
    namespace: "eip155",
    onError(error) {
      console.error("Wallet connect error:", error);
    },
  });

  const connectWallet = useCallback(
    async (type: WalletType, chain: ChainType) => {
      if (type === "metamask" && chain === "ethereum") {
        try {
          await connectEVM("metamask");
        } catch (error) {
          console.error("Failed to connect wallet:", error);
          throw error;
        }
      }
    },
    [connectEVM],
  );

  const disconnectWallet = useCallback(
    async (type: WalletType, chain: ChainType) => {
      if (type === "metamask" && chain === "ethereum") {
        await disconnect({
          namespace: "eip155",
        });
      }
    },
    [disconnect],
  );

  // Initialize secure storage and load keyfiles
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await secureStorage.init();
        await refreshStoredKeyfiles();
      } catch (error) {
        console.error("Failed to initialize secure storage:", error);
      }
    };

    initializeStorage();
  }, [refreshStoredKeyfiles]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      connect: connectWallet,
      disconnect: disconnectWallet,
      storedKeyfiles,
      selectedCanopyWallet,
      setSelectedCanopyWallet,
      refreshStoredKeyfiles,
    }),
    [
      connectWallet,
      disconnectWallet,
      storedKeyfiles,
      selectedCanopyWallet,
      refreshStoredKeyfiles,
    ],
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook for easy access
export function useWallets() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallets must be used within a WalletProvider");
  return ctx;
}
