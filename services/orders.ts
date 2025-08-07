import { Order, Orders } from "@/types/order";
import { API_CONFIG, getApiConfigByCommittee } from "@/config";

// Legacy function for backward compatibility
export async function fetchOrders(height: number): Promise<Order[]> {
  const response = await fetch(`${API_CONFIG.QUERY_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ height, id: 2 }),
  });
  if (!response.ok) throw new Error("Failed to fetch orders");

  const data: Orders[] = await response.json();

  // Flatten the orders from all chains into a single array
  return data.flatMap((chainData) => chainData.orders);
}

// Chain-aware order fetching
export async function fetchOrdersFromCommittee(
  height: number,
  committee: number,
): Promise<Order[]> {
  const apiConfig = getApiConfigByCommittee(committee);
  const response = await fetch(`${apiConfig.QUERY_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ height, id: committee }),
  });
  if (!response.ok)
    throw new Error(`Failed to fetch orders from committee: ${committee}`);

  const data: Orders[] = await response.json();

  // Flatten the orders from all chains into a single array
  return data.flatMap((chainData) => chainData.orders);
}
