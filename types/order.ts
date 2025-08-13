import { Address } from "./rpc";

export interface Orders {
  chainID: number;
  orders: Order[];
}

export interface Order {
  id: string;
  committee: number;
  amountForSale: number;
  requestedAmount: number;
  sellerReceiveAddress: Address;
  sellersSendAddress: Address;
  // fields that only appear when the order is locked
  buyerSendAddress?: Address;
  buyerReceiveAddress?: Address;
  buyerChainDeadline?: number;
}

export interface CreateOrder {
  address: Address;
  committees: string;
  data: string;
  amount: number;
  receiveAmount: number;
  receiveAddress: Address;
  memo: string;
  fee: number;
  submit: boolean;
  password: string;
}

export interface LockOrder {
  address: Address; // address sending nested chain counter asset
  receiveAddress: Address; // address receiving root chain sell order funds
  orderId: string;
  fee: number;
  submit: boolean;
  password: string;
}

export interface CloseOrder {
  address: Address;
  orderId: string;
  fee: number;
  submit: boolean;
  password: string;
}

export interface SwapOrderResponse {
  type: string;
  msg: Msg;
  signature: Signature;
  time: number;
  createdHeight: number;
  fee: number;
  memo: string;
  networkID: number;
  chainID: number;
}

export interface Signature {
  publicKey: string;
  signature: string;
}

export interface Memo {
  orderId: string;
  chain_id: number;
  buyerSendAddress: Address;
  buyerReceiveAddress: Address;
}

export interface Msg {
  fromAddress: Address;
  toAddress: Address;
  amount: number;
}

export type FlattenOrder = {
  id: string;
  committee: string;
  amountForSale: number;
  requestedAmount: number;
  sellerReceiveAddress: Address;
  sellersSendAddress: Address;
  buyerSendAddress?: Address;
  buyerChainDeadline?: number;
  buyerReceiveAddress?: Address;
};

// Transaction History Types
export interface TransactionHistoryFilters {
  pair: string;
  status: string;
  timeRange: string;
  search: string;
}

export interface TransactionHistoryStats {
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  avgFee: number;
}
