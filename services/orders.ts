import { CreateOrder, Order, Orders } from "@/types/order";
import { getApiConfigByCommittee } from "@/config";

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

export const createOrder = async (payload: CreateOrder): Promise<string> => {
  const apiConfig = getApiConfigByCommittee(Number(payload.committees));
  console.log(apiConfig);
  const response = await fetch(`${apiConfig.ADMIN_URL}/tx-create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create order");

  return await response.json();
};
