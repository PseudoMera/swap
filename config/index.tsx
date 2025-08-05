import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet } from "@reown/appkit/networks";

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
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

export const config = wagmiAdapter.wagmiConfig;

// API Configuration
const isDevelopment = process.env.NODE_ENV === "development";

export const API_CONFIG = {
  QUERY_URL: isDevelopment
    ? `${process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:50002"}/v1/query`
    : "/api/v1/query",
  ADMIN_URL: isDevelopment
    ? `${process.env.NEXT_PUBLIC_ADMIN_RPC_URL || "http://localhost:50003"}/v1/admin`
    : "/api/v1/admin",
} as const;
