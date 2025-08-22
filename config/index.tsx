import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, sepolia } from "@reown/appkit/networks";
import { getChainByCommittee, getChainById } from "@/utils/chains";
import { validatedConfig } from "./validation";

// Use validated environment configuration
export const ENV_CONFIG = validatedConfig;

// Get projectId from validated config
export const projectId = ENV_CONFIG.PROJECT_ID;

const canopyNetwork = {
  id: 10042,
  name: "Canopy Network",
  nativeCurrency: {
    decimals: 18,
    name: "Canopy",
    symbol: "CNPY",
  },
  rpcUrls: {
    default: {
      http: ["https://anvil.neochiba.net"],
    },
    public: {
      http: ["https://anvil.neochiba.net"],
    },
  },
};

export const networks = [mainnet, sepolia, canopyNetwork];

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
