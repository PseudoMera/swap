import { API_CONFIG, getChainApiConfig, getApiConfigByCommittee } from "@/config";

// Legacy function for backward compatibility
export async function fetchHeight(): Promise<number> {
  const response = await fetch(`${API_CONFIG.QUERY_URL}/height`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error("Failed to fetch height");
  return response.json();
}

// Chain-aware height fetching
export async function fetchHeightFromChain(chainId: string): Promise<number> {
  const apiConfig = getChainApiConfig(chainId);
  const response = await fetch(`${apiConfig.QUERY_URL}/height`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch height from chain: ${chainId}`);
  return response.json();
}

// Committee-aware height fetching
export async function fetchHeightByCommittee(committee: number): Promise<number> {
  const apiConfig = getApiConfigByCommittee(committee);
  const response = await fetch(`${apiConfig.QUERY_URL}/height`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch height for committee: ${committee}`);
  return response.json();
}
