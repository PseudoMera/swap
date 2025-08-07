import {
  API_CONFIG,
  getChainApiConfig,
  getApiConfigByCommittee,
} from "@/config";

interface AccountQueryPayload {
  address: string;
  height: number;
}

export interface AccountResponse {
  address: string;
  amount?: number;
}

// Legacy function for backward compatibility
export async function fetchUserBalance(
  height: number,
  address: string,
): Promise<number> {
  const response = await fetch(`${API_CONFIG.QUERY_URL}/account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ height, address }),
  });
  if (!response.ok) throw new Error("Failed to fetch balance");
  const data = await response.json();
  return data.amount || 0;
}

// Chain-aware balance fetching
export async function fetchUserBalanceFromChain(
  chainId: string,
  payload: AccountQueryPayload,
): Promise<AccountResponse> {
  const apiConfig = getChainApiConfig(chainId);
  const response = await fetch(`${apiConfig.QUERY_URL}/account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(`Failed to fetch balance from chain: ${chainId}`);
  return response.json();
}

// Committee-aware balance fetching
export async function fetchUserBalanceByCommittee(
  committee: number,
  payload: AccountQueryPayload,
): Promise<AccountResponse> {
  const apiConfig = getApiConfigByCommittee(committee);
  const response = await fetch(`${apiConfig.QUERY_URL}/account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(`Failed to fetch balance for committee: ${committee}`);
  return response.json();
}
