import { CHAINS } from "@/constants/chains";
import { Chain } from "@/types/chain";

// In production: same URL with different paths
export const createRpcUrls = (queryUrl: string, adminUrl?: string) => {
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

export const getChainById = (chainId: string): Chain => {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Chain not found: ${chainId}`);
  }
  return chain;
};

export const getAllChains = (): Chain[] => {
  return Object.values(CHAINS);
};

export const getChainByCommittee = (committee: number): Chain => {
  // Map committee IDs to chain IDs
  switch (committee) {
    case 0: // CNPY
    case 1:
      return getChainById("canopy");
    case 2: // USDC
      return getChainById("ethereum");
    default:
      throw new Error(`No chain mapping found for committee: ${committee}`);
  }
};
