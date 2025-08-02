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

type WalletType = "metamask" | "canopy";
type Chain = "ethereum" | "canopy"; // Extendable for other chains

export interface WalletInfo {
  type: WalletType;
  chain: Chain;
  address: string;
  connected: boolean;
}

interface WalletContextType {
  wallets: WalletInfo[];
  connect: (type: WalletType, chain: Chain) => void;
  disconnect: (type: WalletType, chain: Chain) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // For now, just one wallet: USDC on Ethereum via MetaMask
  const [wallets, setWallets] = useState<WalletInfo[]>([]);

  const { disconnect } = useDisconnect();

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
          chain: parsedCaipAddress.chainNamespace.toString() as Chain,
          address: parsedCaipAddress.address,
          connected: true,
        },
      ]);
    },
    onError(error) {
      console.error("Wallet connect error:", error);
    },
  });

  const connectWallet = (type: WalletType, chain: Chain) => {
    console.log(`Connecting ${type} on ${chain}`);
    if (type === "metamask" && chain === "ethereum") {
      connectEVM("metamask");
    }
    // Add more wallet types/chains here as needed
  };

  // Disconnect wallet by type/chain
  const disconnectWallet = async (type: WalletType, chain: Chain) => {
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

  return (
    <WalletContext.Provider
      value={{ wallets, connect: connectWallet, disconnect: disconnectWallet }}
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
