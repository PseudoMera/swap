import {
  CreateOrder,
  DeleteOrder,
  DeleteOrderResponse,
  EditOrder,
  EditOrderResponse,
  Order,
  Orders,
} from "@/types/order";
import { getApiConfigByCommittee } from "@/config/reown";

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
  if (!data) return [];

  // Flatten the orders from all chains into a single array
  return data.flatMap((chainData) => chainData.orders);
}

export const createOrder = async (payload: CreateOrder): Promise<string> => {
  const apiConfig = getApiConfigByCommittee(Number(payload.committees));
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

export const editOrder = async (
  payload: EditOrder,
): Promise<EditOrderResponse> => {
  const apiConfig = getApiConfigByCommittee(Number(payload.committees));
  const response = await fetch(`${apiConfig.ADMIN_URL}/tx-edit-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create order");
  return await response.json();
};

export const deleteOrder = async (
  payload: DeleteOrder,
): Promise<DeleteOrderResponse> => {
  const apiConfig = getApiConfigByCommittee(Number(payload.committees));
  const response = await fetch(`${apiConfig.ADMIN_URL}/tx-delete-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create order");
  return await response.json();
};
