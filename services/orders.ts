import {
  CreateOrder,
  DeleteOrder,
  DeleteOrderResponse,
  EditOrder,
  EditOrderResponse,
  Order,
  Orders,
} from "@/types/order";
import { SendRawTransactionRequest } from "@/types/wallet";

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

export const submitSignedTransaction = async (
  signedTx: SendRawTransactionRequest,
  committee: number,
): Promise<{
  transactionHash: string;
  status: string;
  submittedAt: string;
}> => {
  const response = await fetch("/api/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: "/v1/tx",
      committee,
      data: signedTx.raw_transaction,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Transaction submission failed");
  }

  // Response is just the transaction hash string
  const txHash = await response.text();

  return {
    transactionHash: txHash.replace(/"/g, ""), // Remove quotes if present
    status: "submitted",
    submittedAt: new Date().toISOString(),
  };
};
