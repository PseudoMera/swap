"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useAppKitWallet } from "@reown/appkit-wallet-button/react";
import { useDisconnect } from "@reown/appkit/react";
import {
  ChainType,
  WalletType,
  type CanopyWalletAccount,
} from "@/types/wallet";
import { secureStorage, type KeyfileMetadata } from "@/lib/secure-storage";

export interface WalletInfo {
  type: WalletType;
  chain: ChainType;
  address: string;
  connected: boolean;
}

interface WalletContextType {
  wallets: WalletInfo[];
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
  // For now, just one wallet: USDC on Ethereum via MetaMask
  const [wallets, setWallets] = useState<WalletInfo[]>([]);

  // Canopy wallet state
  const [storedKeyfiles, setStoredKeyfiles] = useState<KeyfileMetadata[]>([]);
  const [selectedCanopyWallet, setSelectedCanopyWallet] =
    useState<CanopyWalletAccount | null>(null);

  const { disconnect } = useDisconnect();

  const refreshStoredKeyfiles = async () => {
    try {
      const keyfiles = await secureStorage.listKeyfiles();
      setStoredKeyfiles(keyfiles);

      // Auto-select first keyfile if none selected
      if (keyfiles.length > 0 && !selectedCanopyWallet) {
        const firstKeyfile = keyfiles[0];
        if (firstKeyfile.accountAddresses.length > 0) {
          setSelectedCanopyWallet({
            address: firstKeyfile.accountAddresses[0],
            keyfileId: firstKeyfile.id,
            filename: firstKeyfile.filename,
          });
        }
      }

      // Clear selection if selected keyfile no longer exists
      if (
        selectedCanopyWallet &&
        !keyfiles.find((kf) => kf.id === selectedCanopyWallet.keyfileId)
      ) {
        setSelectedCanopyWallet(null);
      }
    } catch (error) {
      console.error("Failed to refresh stored keyfiles:", error);
    }
  };

  // Hook for EVM wallets (MetaMask, etc.)
  const { connect: connectEVM, data: dataEVM } = useAppKitWallet({
    namespace: "eip155",
    onSuccess(parsedCaipAddress) {
      setWallets((prev) => [
        ...prev.filter(
          (w) => !(w.type === "metamask" && w.chain === "ethereum"),
        ),
        {
          type: "metamask",
          chain: parsedCaipAddress.chainNamespace.toString() as ChainType,
          address: parsedCaipAddress.address,
          connected: true,
        },
      ]);
    },
    onError(error) {
      console.error("Wallet connect error:", error);
    },
  });

  const connectWallet = (type: WalletType, chain: ChainType) => {
    console.log(`Connecting ${type} on ${chain}`);
    if (type === "metamask" && chain === "ethereum") {
      connectEVM("metamask");
    }
    // Add more wallet types/chains here as needed
  };

  // Disconnect wallet by type/chain
  const disconnectWallet = async (type: WalletType, chain: ChainType) => {
    if (type === "metamask" && chain === "ethereum") {
      await disconnect({
        namespace: "eip155",
      });
      setWallets((prev) =>
        prev.filter((w) => !(w.type === "metamask" && w.chain === "ethereum")),
      );
    }
    // Add more wallet types/chains here as needed
  };

  useEffect(() => {
    if (dataEVM?.address) {
      setWallets((prev) => [
        ...prev.filter(
          (w) => !(w.type === "metamask" && w.chain === "ethereum"),
        ),
        {
          type: "metamask",
          chain: "ethereum",
          address: dataEVM.address,
          connected: true,
        },
      ]);
    } else {
      setWallets((prev) =>
        prev.filter((w) => !(w.type === "metamask" && w.chain === "ethereum")),
      );
    }
  }, [dataEVM]);

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
  }, []);

  return (
    <WalletContext.Provider
      value={{
        wallets,
        connect: connectWallet,
        disconnect: disconnectWallet,
        storedKeyfiles,
        selectedCanopyWallet,
        setSelectedCanopyWallet,
        refreshStoredKeyfiles,
      }}
    >
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
