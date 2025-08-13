import { FlattenOrder, Orders } from "@/types/order";
import { blockchainUValueToNumber } from "./blockchain";
import { COMMITTEES_ID_NAME_MAP } from "@/constants/orders";

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
