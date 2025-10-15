import {
  CreateOrder,
  DeleteOrder,
  DeleteOrderResponse,
  EditOrder,
  EditOrderResponse,
  Order,
  Orders,
} from "@/types/order";

export async function fetchOrdersFromCommittee(
  height: number,
  committee: number,
): Promise<Order[]> {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: "/orders",
      committee,
      data: { height, id: committee },
    }),
  });
  if (!response.ok)
    throw new Error(`Failed to fetch orders from committee: ${committee}`);

  const data: Orders[] = await response.json();
  if (!data) return [];

  // Flatten the orders from all chains into a single array
  return data.flatMap((chainData) => chainData.orders);
}

export const createOrder = async (payload: CreateOrder): Promise<string> => {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: "/tx-create-order",
      committee: Number(payload.committees),
      data: payload,
    }),
  });
  if (!response.ok) throw new Error("Failed to create order");

  return await response.json();
};

export const editOrder = async (
  payload: EditOrder,
): Promise<EditOrderResponse> => {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: "/tx-edit-order",
      committee: Number(payload.committees),
      data: payload,
    }),
  });
  if (!response.ok) throw new Error("Failed to edit order");
  return await response.json();
};

export const deleteOrder = async (
  payload: DeleteOrder,
): Promise<DeleteOrderResponse> => {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: "/tx-delete-order",
      committee: Number(payload.committees),
      data: payload,
    }),
  });
  if (!response.ok) throw new Error("Failed to delete order");
  return await response.json();
};
