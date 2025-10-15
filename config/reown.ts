import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, sepolia, AppKitNetwork } from "@reown/appkit/networks";
import { getChainByCommittee, getChainById } from "@/utils/chains";
import { validatedConfig } from "./validation";

export const ENV_CONFIG = validatedConfig;

export const projectId = ENV_CONFIG.PROJECT_ID;

const canopyNetwork: AppKitNetwork = {
  id: 10042,
  name: "Canopy Network",
  nativeCurrency: {
    decimals: 18,
    name: "Canopy",
    symbol: "CNPY",
  },
  rpcUrls: {
    default: {
      http: ["https://eth-mainnet.eu.nodefleet.net/"],
    },
  },
};

export const networks = [mainnet, sepolia, canopyNetwork] as [
  AppKitNetwork,
  ...AppKitNetwork[],
];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

export const getChainApiConfig = (chainId: string) => {
  const chain = getChainById(chainId);
  return {
    QUERY_URL: chain.rpcUrl.query,
    ADMIN_URL: chain.rpcUrl.admin,
  };
};

export const getApiConfigByCommittee = (committee: number) => {
  const chain = getChainByCommittee(committee);
  return {
    QUERY_URL: chain.rpcUrl.query,
    ADMIN_URL: chain.rpcUrl.admin,
  };
};
