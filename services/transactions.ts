import { API_CONFIG, getApiConfigByCommittee } from "@/config";
import { Order } from "@/types/order";
import {
  EnrichedTransaction,
  EnrichedTransactionResponse,
  OrderDetailsPayload,
  TransactionResponse,
  TransactionResult,
  UserTransactionsPayload,
} from "@/types/transactions";

/**
 * Fetch user transaction history
 */
export const fetchUserTransactions = async (
  address: string,
  pageNumber: number = 0,
  perPage: number = 50,
): Promise<TransactionResponse> => {
  const payload: UserTransactionsPayload = {
    address,
    pageNumber,
    perPage,
  };

  const response = await fetch(`${API_CONFIG.QUERY_URL}/txs-by-sender`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch user transactions: ${response.statusText}`,
    );
  }

  return await response.json();
};

/**
 * Fetch specific order details
 */
export const fetchOrderDetails = async (
  chainId: number,
  orderId: string,
  height: number = 0,
): Promise<Order> => {
  const payload: OrderDetailsPayload = {
    chainId,
    orderId,
    height,
  };

  // Use committee-specific API config if available
  const apiConfig = chainId ? getApiConfigByCommittee(chainId) : API_CONFIG;

  const response = await fetch(`${apiConfig.QUERY_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch order details: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return await response.json();
};

/**
 * Fetch transaction history with enriched order data
 */
export const fetchEnrichedTransactionHistory = async (
  address: string,
  pageNumber: number = 0,
  perPage: number = 20,
): Promise<EnrichedTransactionResponse> => {
  try {
    // Get user transactions
    const txResponse = await fetchUserTransactions(
      address,
      pageNumber,
      perPage,
    );

    // Filter for order-related transactions (actual messageTypes from API)
    const orderTxs = txResponse.results.filter((tx) =>
      [
        "createOrder",
        "editOrder",
        "lockOrder",
        "closeOrder",
        "deleteOrder",
      ].includes(tx.messageType),
    );

    // Fetch order details for each transaction
    const enrichedTxs = await Promise.all(
      orderTxs.map(async (tx): Promise<EnrichedTransaction> => {
        try {
          let orderId: string;

          // Extract order ID from the transaction message
          if (tx.messageType === "createOrder") {
            // For CreateOrder transactions, generate the order ID using SHA-256 hash
            // This matches Canopy's internal order ID generation algorithm
            orderId = await generateOrderId(tx);
          } else {
            // For other order operations, try to get orderId from the message
            orderId = tx.transaction.msg.orderId || "";
            if (!orderId) {
              console.warn(
                `${tx.messageType} transaction ${tx.txHash} missing orderId`,
              );
              // Skip this transaction if no order ID is available
              return {
                transaction: tx,
                order: null,
                orderId: null,
              };
            }
          }

          const committee =
            tx.transaction.msg.chainId || tx.transaction.chainID;

          // Fetch order details to determine status
          let orderData: Order | null = null;
          try {
            orderData = await fetchOrderDetails(committee, orderId);
          } catch (orderError) {
            // Continue without order data - status will default to "Open"
            // This is expected for completed, cancelled, or expired orders
          }

          return {
            transaction: tx,
            order: orderData,
            orderId,
          };
        } catch (error) {
          console.error(
            `Failed to fetch order details for tx ${tx.txHash}:`,
            error,
          );
          // Return transaction without order data if order fetch fails
          // This allows the transaction to still be displayed in the table
          return {
            transaction: tx,
            order: null,
            orderId: null,
          };
        }
      }),
    );

    return {
      results: enrichedTxs,
      pageInfo: txResponse.pageInfo,
    };
  } catch (error) {
    console.error("Error fetching enriched transaction history:", error);
    throw error;
  }
};

/**
 * Generate order ID for TxCreateOrder transactions using SHA-256
 * This matches Canopy's internal order ID generation algorithm
 * Order ID = first 20 bytes of SHA-256(serialized transaction)
 */
const generateOrderId = async (
  transaction: TransactionResult,
): Promise<string> => {
  // Since we don't have access to the original serialized transaction bytes,
  // we'll use the transaction hash directly and take the first 20 bytes (40 hex chars)
  // The transaction hash is already the SHA-256 of the serialized transaction
  const txHash = transaction.txHash;

  // Remove any 0x prefix if present
  const cleanHash = txHash.startsWith("0x") ? txHash.slice(2) : txHash;

  // Take first 20 bytes (40 hex characters) as the order ID
  // This matches Canopy's logic: hash[:20]
  return cleanHash.substring(0, 40);
};
