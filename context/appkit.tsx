"use client";

import { wagmiAdapter, projectId, networks } from "@/config/reown";
import { createAppKit } from "@reown/appkit/react";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { createAppKitWalletButton } from "@reown/appkit-wallet-button";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Set up metadata
const metadata = {
  name: "Canopy Swap",
  description:
    "Cross-chain swap application for Canopy blockchain native tokens",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://localhost:3000",
  icons: ["/chains-icons/canopy-logo.svg"],
};

// Create the modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: networks[1], // sepolia for development/testing
  metadata: metadata,
  features: {
    analytics: false, // Disable for privacy
    email: false, // Disable email login
    socials: [], // Disable social logins
    emailShowWallets: false,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-font-family": "inherit",
    "--w3m-border-radius-master": "8px",
  },
  includeWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
    "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase
  ],
});

// Needed for custom connect buttons
createAppKitWalletButton();

function AppkitProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies,
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      {children}
    </WagmiProvider>
  );
}

export default AppkitProvider;
