import { API_CONFIG } from '@/config';

interface AccountQueryPayload {
  address: string;
  height: number;
}

interface AccountResponse {
  address: string;
  amount: number;
}

export async function fetchUserBalance(payload: AccountQueryPayload): Promise<AccountResponse> {
  const response = await fetch(`${API_CONFIG.QUERY_URL}/account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to fetch balance');
  return response.json();
}