import { Order } from "@/types/order";
import { blockchainUValueToNumber } from "./blockchain";
import { getAllTradingPairs } from "./trading-pairs";
import {
  EnrichedTransaction,
  ProcessedTransaction,
  TransactionFilters,
  TransactionStats,
  TransactionStatus,
  TransactionType,
} from "@/types/transactions";
import { TradingPair } from "@/types/trading-pair";

/**
 * Determine order status based on buyer address fields
 * - Open: No buyerSendAddress (order is available for matching) or no order data available
 * - Pending: Has buyerSendAddress but no buyerReceiveAddress (order locked but not completed)
 * - Completed: Has buyerReceiveAddress (order successfully executed)
 */
export const determineOrderStatus = (
  order: Order | null,
): TransactionStatus => {
  // If no order data available, assume it's an open order
  // (transaction was created successfully)
  if (!order) return "Open";

  if (order.buyerReceiveAddress && order.buyerReceiveAddress.length > 0) {
    return "Completed";
  }

  if (order.buyerSendAddress && order.buyerSendAddress.length > 0) {
    return "Pending";
  }

  return "Open";
};

/**
 * Calculate exchange rate between two amounts
 */
export const calculateRate = (
  amountForSale: number,
  requestedAmount: number,
): number => {
  if (amountForSale === 0) return 0;
  return requestedAmount / amountForSale;
};

/**
 * Get trading pair from committee ID and contract address
 * Returns the full trading pair object based on committee and contract address
 */
export const getTradingPairFromCommittee = (
  committee: number,
  contractAddress?: string,
): TradingPair => {
  try {
    const allPairs = getAllTradingPairs();

    // If contract address is provided, use it for precise matching
    if (contractAddress) {
      // Normalize addresses for comparison (remove 0x prefix and convert to lowercase)
      const normalizedAddress = contractAddress.toLowerCase().replace(/^0x/, "");
      const matchingPair = allPairs.find((pair) => {
        const pairAddress = pair.contractAddress.toLowerCase().replace(/^0x/, "");
        return pairAddress === normalizedAddress;
      });

      if (matchingPair) {
        return matchingPair;
      }
    }

    // Fallback to committee-based matching
    const matchingPair = allPairs.find((pair) => pair.committee === committee);
    if (matchingPair) {
      return matchingPair;
    }

    // Fallback to first available pair if no match
    return allPairs[0];
  } catch (error) {
    console.error("Error getting trading pair:", error);
    const allPairs = getAllTradingPairs();
    return allPairs[0];
  }
};

/**
 * Format amount with proper number formatting
 */
export const formatAmount = (amount: number, decimals: number = 6): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(amount);
};

/**
 * Format currency values
 */
export const formatCurrency = (
  amount: number,
  currency: string = "USD",
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Get user-friendly transaction type display name
 */
export const getTransactionTypeDisplay = (messageType: string): string => {
  switch (messageType as TransactionType) {
    case TransactionType.CREATE_ORDER:
      return "Sell";
    case TransactionType.EDIT_ORDER:
      return "Edit";
    case TransactionType.LOCK_ORDER:
      return "Lock";
    case TransactionType.CLOSE_ORDER:
      return "Close";
    case TransactionType.DELETE_ORDER:
      return "Cancel";
    default:
      return messageType;
  }
};

/**
 * Process enriched transaction data into table-ready format
 */
export const processTransactionData = (
  enrichedTx: EnrichedTransaction,
): ProcessedTransaction => {
  const { transaction, order } = enrichedTx;

  // Convert amounts from micro units
  const amountForSale = blockchainUValueToNumber(
    transaction.transaction.msg.amountForSale,
  ); // CNPY being sold
  const requestedAmount = blockchainUValueToNumber(
    transaction.transaction.msg.requestedAmount,
  ); // USDC requested
  const fee = blockchainUValueToNumber(transaction.transaction.fee);

  // For sell orders: amount = CNPY being sold, total = USDC requested
  const amount = amountForSale; // Amount of CNPY
  const total = requestedAmount; // Amount of USDC
  const price = calculateRate(amountForSale, requestedAmount);

  // Get committee and contract address from transaction
  const committee =
    transaction.transaction.msg.chainId || transaction.transaction.chainID;
  const contractAddress = transaction.transaction.msg.data; // Contract address is stored in data field
  const tradingPair = getTradingPairFromCommittee(committee, contractAddress);

  return {
    id: transaction.txHash,
    dateTime: new Date(transaction.transaction.time / 1000), // Convert microseconds to milliseconds
    txHash: transaction.txHash,
    pair: tradingPair.displayName,
    type: getTransactionTypeDisplay(transaction.messageType),
    amount,
    price,
    total,
    fee,
    status: determineOrderStatus(order),
    tradingPairInfo: tradingPair, // Include full trading pair info
    rawData: {
      transaction,
      order,
    },
  };
};

/**
 * Calculate transaction statistics
 */
export const calculateTransactionStats = (
  transactions: ProcessedTransaction[],
): TransactionStats => {
  if (transactions.length === 0) {
    return {
      totalTransactions: 0,
      totalVolume: 0,
      successRate: 0,
      avgFee: 0,
    };
  }

  const totalVolume = transactions.reduce((sum, tx) => sum + tx.total, 0);
  const totalFees = transactions.reduce((sum, tx) => sum + tx.fee, 0);
  const completedCount = transactions.filter(
    (tx) =>
      tx.status === "Completed" ||
      tx.status === "Pending" ||
      tx.status === "Open",
  ).length;

  return {
    totalTransactions: transactions.length,
    totalVolume,
    successRate: (completedCount / transactions.length) * 100,
    avgFee: totalFees / transactions.length,
  };
};

/**
 * Filter transactions based on criteria
 */

export const applyTransactionFilters = (
  transactions: ProcessedTransaction[],
  filters: TransactionFilters,
): ProcessedTransaction[] => {
  return transactions.filter((tx) => {
    // Pair filter - since we only support CNPY/USDC, this is mainly for future extensibility
    if (filters.pair !== "All Pairs" && tx.pair !== filters.pair) {
      return false;
    }

    // Status filter
    if (filters.status !== "All Status" && tx.status !== filters.status) {
      return false;
    }

    // Time filter
    if (filters.timeRange !== "All Time") {
      const cutoffTime = Date.now() - getTimeRangeMs(filters.timeRange);
      if (tx.dateTime.getTime() < cutoffTime) {
        return false;
      }
    }

    // Address filter
    if (filters.address !== "All Addresses" && filters.address) {
      const txSender = tx.rawData.transaction.sender;
      const txRecipient = tx.rawData.transaction.recipient;
      // Filter by specific address
      if (txSender !== filters.address && txRecipient !== filters.address) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        tx.txHash.toLowerCase().includes(searchLower) ||
        tx.pair.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });
};

/**
 * Convert time range string to milliseconds
 */
const getTimeRangeMs = (timeRange: string): number => {
  const timeMap: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  };

  return timeMap[timeRange] || 0;
};

/**
 * Truncate transaction hash for display
 */
export const truncateHash = (
  hash: string,
  startChars: number = 6,
  endChars: number = 4,
): string => {
  if (hash.length <= startChars + endChars) return hash;
  return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`;
};
