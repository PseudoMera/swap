import { Order } from "./order";

export enum TransactionType {
  CREATE_ORDER = "createOrder",
  EDIT_ORDER = "editOrder",
  LOCK_ORDER = "lockOrder",
  CLOSE_ORDER = "closeOrder",
  DELETE_ORDER = "deleteOrder",
}

export type TransactionStatus = "Open" | "Pending" | "Completed";

export interface TradingPairInfo {
  displayName: string;
  baseAsset: { symbol: string };
  quoteAsset: { symbol: string };
}

export interface ProcessedTransaction {
  id: string;
  dateTime: Date;
  txHash: string;
  pair: string;
  type: string;
  amount: number;
  price: number;
  total: number;
  fee: number;
  status: TransactionStatus;
  tradingPairInfo: TradingPairInfo;
  rawData: {
    transaction: EnrichedTransaction["transaction"];
    order: Order | null;
  };
}

export interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  avgFee: number;
}

export interface TransactionFilters {
  pair: string;
  status: string;
  timeRange: string;
  search: string;
  address: string;
}

export interface TransactionResult {
  sender: string;
  recipient: string;
  messageType: string;
  height: number;
  index: number;
  txHash: string;
  transaction: {
    type: string;
    msg: {
      chainId: number;
      amountForSale: number;
      requestedAmount: number;
      data: string;
      sellerReceiveAddress: string;
      sellersSendAddress: string;
      orderId?: string;
    };
    signature: {
      publicKey: string;
      signature: string;
    };
    time: number;
    createdHeight: number;
    fee: number;
    memo?: string;
    networkID: number;
    chainID: number;
  };
}

export interface TransactionResponse {
  type: string;
  results: TransactionResult[];
  pageInfo: {
    totalPages: number;
    currentPage: number;
    perPage: number;
  };
}

export interface UserTransactionsPayload {
  address: string;
  pageNumber: number;
  perPage: number;
}

export interface OrderDetailsPayload {
  chainId: number;
  orderId: string;
  height: number;
}

export interface EnrichedTransaction {
  transaction: TransactionResult;
  order: Order | null;
  orderId: string | null;
}

export interface EnrichedTransactionResponse {
  results: EnrichedTransaction[];
  pageInfo: {
    totalPages: number;
    currentPage: number;
    perPage: number;
  };
}
