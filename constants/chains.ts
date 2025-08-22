import { Chain } from "@/types/chain";

// In production: same URL with different paths
const createRpcUrls = (queryUrl: string, adminUrl?: string) => {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment && adminUrl) {
    // Development: use separate ports/URLs
    return {
      query: `${queryUrl}/v1/query`,
      admin: `${adminUrl}/v1/admin`,
    };
  } else {
    // Production: same base URL with different paths
    return {
      query: `${queryUrl}/v1/query`,
      admin: `${queryUrl}/v1/admin`,
    };
  }
};

export const CHAINS: Record<string, Chain> = {
  canopy: {
    id: "canopy",
    name: "Canopy",
    rpcUrl: createRpcUrls(
      process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:50002",
      process.env.NEXT_PUBLIC_ADMIN_RPC_URL || "http://localhost:50003",
    ),
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    rpcUrl: createRpcUrls(
      process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "http://localhost:50002",
      process.env.NEXT_PUBLIC_ETHEREUM_ADMIN_RPC_URL ||
        "http://localhost:50003",
    ),
  },
};
