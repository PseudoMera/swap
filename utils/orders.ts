import { FlattenOrder, Orders } from "@/types/order";
import { blockchainUValueToNumber } from "./blockchain";

export const COMMITTEES_ID_NAME_MAP: Record<number, string> = {
  1: "CNPY",
  2: "USDC",
};

export const COMMITTEES_NAME_TO_ID_MAP: Record<string, number> = {
  CNPY: 1,
  USDC: 2,
};

export const flattenOrder = (orders: Orders[]): FlattenOrder[] => {
  return orders.flatMap((chain) =>
    chain.orders.map((order) => ({
      id: order.id,
      committee: COMMITTEES_ID_NAME_MAP[order.committee],
      amountForSale: blockchainUValueToNumber(order.amountForSale),
      requestedAmount: blockchainUValueToNumber(order.requestedAmount),
      sellerReceiveAddress: order.sellerReceiveAddress,
      sellersSendAddress: order.sellersSendAddress,
      buyerChainDeadline: order.buyerChainDeadline,
      buyerSendAddress: order.buyerSendAddress,
      buyerReceiveAddress: order.buyerReceiveAddress,
    })),
  );
};
