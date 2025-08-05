import { Order, Orders } from '@/types/order';
import { API_CONFIG } from '@/config';

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