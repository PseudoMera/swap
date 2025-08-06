import { Order, Orders } from '@/types/order';
import { API_CONFIG, getApiConfigByCommittee, getChainApiConfig } from '@/config';

// Legacy function for backward compatibility
export async function fetchOrders(height: number): Promise<Order[]> {
  const response = await fetch(`${API_CONFIG.QUERY_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ height }),
  });
  if (!response.ok) throw new Error('Failed to fetch orders');
  
  const data: Orders[] = await response.json();
  
  // Flatten the orders from all chains into a single array
  return data.flatMap(chainData => chainData.orders);
}

// Chain-aware order fetching
export async function fetchOrdersFromChain(chainId: string, height: number): Promise<Order[]> {
  const apiConfig = getChainApiConfig(chainId);
  const response = await fetch(`${apiConfig.QUERY_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ height }),
  });
  if (!response.ok) throw new Error(`Failed to fetch orders from chain: ${chainId}`);
  
  const data: Orders[] = await response.json();
  
  // Flatten the orders from all chains into a single array
  return data.flatMap(chainData => chainData.orders);
}

// Committee-aware order fetching
export async function fetchOrdersByCommittee(committee: number, height: number): Promise<Order[]> {
  const apiConfig = getApiConfigByCommittee(committee);
  const response = await fetch(`${apiConfig.QUERY_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ height }),
  });
  if (!response.ok) throw new Error(`Failed to fetch orders for committee: ${committee}`);
  
  const data: Orders[] = await response.json();
  
  // Flatten the orders from all chains into a single array and filter by committee
  return data.flatMap(chainData => chainData.orders).filter(order => order.committee === committee);
}