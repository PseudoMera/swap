import { FlattenOrder, Order, Orders } from "@/types/order";
import { blockchainUValueToNumber } from "./blockchain";
import { COMMITTEES_ID_NAME_MAP } from "@/constants/orders";
import { TradingPair } from "@/types/trading-pair";
import { sliceAddress } from "./address";

export const flattenOrder = (orders: Orders[]): FlattenOrder[] => {
  if (!orders) return [];

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
      data: order.data,
    })),
  );
};

export const filterOrdersByCommitteeAndTradePair = (
  orders: Order[],
  tradePair: TradingPair,
): Order[] => {
  if (!orders) return [];

  const targetCommittee = tradePair.quoteAsset.committee;

  return orders.filter(
    (order) =>
      order &&
      order.committee === targetCommittee &&
      order.data.toLowerCase() ===
        sliceAddress(tradePair.contractAddress.toLowerCase()),
  );
};
