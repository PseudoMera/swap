import { CHAINS } from "@/constants/chains";
import { Chain } from "@/types/chain";

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

//TODO: Connect committees so we only change it in one place
export const getChainByCommittee = (committee: number): Chain => {
  // Map committee IDs to chain IDs
  switch (committee) {
    case 0: // CNPY
    case 1:
      return getChainById("canopy");
    case 3: // USDC
      return getChainById("ethereum");
    default:
      throw new Error(`No chain mapping found for committee: ${committee}`);
  }
};
