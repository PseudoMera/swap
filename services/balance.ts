import { getChainApiConfig } from "@/config/reown";

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
  committeee: number = 1,
): Promise<number> {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: "/account",
      committee: committeee,
      data: { height, address },
    }),
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
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: "/account",
      committee,
      data: payload,
    }),
  });
  if (!response.ok)
    throw new Error(`Failed to fetch balance for committee: ${committee}`);
  return response.json();
}
