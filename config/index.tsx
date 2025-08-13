import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet } from "@reown/appkit/networks";
import { getChainByCommittee, getChainById } from "@/utils/chains";

// Environment configuration
export const ENV_CONFIG = {
  PROJECT_ID: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:50002",
  ADMIN_RPC_URL:
    process.env.NEXT_PUBLIC_ADMIN_RPC_URL || "http://localhost:50003",
  KEYFILE_SECRET: process.env.NEXT_PUBLIC_KEYFILE_SECRET,
} as const;

// Get projectId from https://dashboard.reown.com
export const projectId = ENV_CONFIG.PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

if (!ENV_CONFIG.KEYFILE_SECRET) {
  throw new Error("NEXT_PUBLIC_KEYFILE_SECRET is not defined");
}

export const networks = [mainnet];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

const isDevelopment = process.env.NODE_ENV === "development";

// Legacy single-chain config for backward compatibility
export const API_CONFIG = {
  QUERY_URL: isDevelopment ? `${ENV_CONFIG.RPC_URL}/v1/query` : "/v1/query",
  ADMIN_URL: isDevelopment
    ? `${ENV_CONFIG.ADMIN_RPC_URL}/v1/admin`
    : "/v1/admin",
} as const;

// Multi-chain API configuration
export const getChainApiConfig = (chainId: string) => {
  const chain = getChainById(chainId);
  return {
    QUERY_URL: chain.rpcUrl.query,
    ADMIN_URL: chain.rpcUrl.admin,
  };
};

// Helper to get API config by committee (uses the mapping from chains.ts)
export const getApiConfigByCommittee = (committee: number) => {
  const chain = getChainByCommittee(committee);
  return {
    QUERY_URL: chain.rpcUrl.query,
    ADMIN_URL: chain.rpcUrl.admin,
  };
};
