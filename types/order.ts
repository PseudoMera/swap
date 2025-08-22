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
  orderId: string;
  buyerSendAddress: Address;
  buyerReceiveAddress: Address;
  buyerChainDeadline: number;
  chain_id: number;
}

export interface CloseOrder {
  orderId: string;
  chain_id: number;
  closeOrder: boolean;
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

export interface EditOrder {
  /** The address that originally created the sell order (hex string) */
  address: Address;
  /** The address that is receiving the 'counter-asset' funds (hex string) */
  receiveAddress: Address;
  /** The id of the committee responsible for the 'counter asset' */
  committees: string;
  /** The unique id of the sell-order (hex string) */
  orderId: string;
  /** The amount of 'root-chain-asset' to lock in escrow (smallest denomination) */
  amount: number;
  /** The amount of 'counter-asset' to receive (smallest denomination) */
  receiveAmount: number;
  /** Arbitrary string code associated with the order (hex string, e.g. sub-asset contract address) */
  data: string;
  /** Transaction fee in micro denomination (optional, minimum fee filled if 0) */
  fee?: number;
  /** Arbitrary message encoded in the transaction */
  memo: string;
  /** Submit this transaction or not (returns the tx-hash if true) */
  submit: boolean;
  /** Password to decrypt the private key to sign the transaction */
  password: string;
}

export interface EditOrderResponse {
  type: "editOrder";
  msg: {
    orderID: string; // hex string
    chainID: number;
    data: string; // hex string
    amountForSale: number;
    requestedAmount: number;
    sellerReceiveAddress: string; // hex string
  };
  signature: {
    publicKey: string; // hex string
    signature: string; // hex string
  };
  time: number; // large integer timestamp
  createdHeight: number;
  fee: number;
  networkID: number;
  chainID: number;
}

export interface DeleteOrder {
  /** The address that originally created the sell order (hex string) */
  address: string;
  /** The id of the committee responsible for the 'counter asset' */
  committees: string;
  /** The unique id of the sell-order (hex string) */
  orderId: string;
  /** Transaction fee in micro denomination (optional, minimum fee filled if 0) */
  fee?: number;
  /** Arbitrary message encoded in the transaction */
  memo: string;
  /** Submit this transaction or not (returns the tx-hash if true) */
  submit: boolean;
  /** Password to decrypt the private key to sign the transaction */
  password: string;
}

export interface DeleteOrderResponse {
  type: "deleteOrder";
  msg: {
    orderID: string; // hex string
    chainID: number;
  };
  signature: {
    publicKey: string; // hex string
    signature: string; // hex string
  };
  time: number; // large integer timestamp
  createdHeight: number;
  fee: number;
  networkID: number;
  chainID: number;
}
