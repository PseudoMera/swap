export interface Chain {
  id: string;
  name: string;
  rpcUrl: {
    query: string;
    admin: string;
  };
}

// Both chains use same local ports in development
// In production, they'll point to different remote endpoints but same paths
const createRpcUrls = (baseUrl: string) => ({
  query: `${baseUrl}/v1/query`,
  admin: `${baseUrl}/v1/admin`,
});

export const CHAINS: Record<string, Chain> = {
  canopy: {
    id: "canopy",
    name: "Canopy",
    rpcUrl: createRpcUrls(
      process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:50002",
    ),
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    rpcUrl: createRpcUrls(
      process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "http://localhost:50004",
    ),
  },
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
