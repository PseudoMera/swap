import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ArrowDown, X } from "lucide-react";
import { createOrder } from "@/services/orders";
import { useWallets } from "@/context/wallet";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { numberToBlockchainUValue } from "@/utils/blockchain";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { CloseOrder, LockOrder } from "@/types/order";
import { usePollingData } from "@/context/polling-context";
import { TEST_ORACLE_CONTRACT, usdcTransferMethodID } from "@/constants/tokens";
import { sendTransaction } from "wagmi/actions";
import { wagmiConfig } from "@/config";
import { useCapabilities, useSendCalls } from "wagmi";
import ProgressToast from "../headless-toast/progress-toast";
import { ProcessedOrder } from "../order-book/TanStackOrderBook";
import { ellipsizeAddress, padAddress, sliceAddress } from "@/utils/address";
import { useTradePairContext } from "@/context/trade-pair-context";
import { assetToAddress } from "@/utils/tokens";

interface TransactionSummaryProps {
  selectedOrders: ProcessedOrder[];
  isSwapped: boolean;
  payAmount: string;
  receiveAmount: string;
  payBalance: string;
  receiveBalance: string;
  onClose: () => void;
  estimatedTime?: string;
}

export function TransactionSummary({
  selectedOrders,
  isSwapped,
  payAmount,
  receiveAmount,
  payBalance,
  receiveBalance,
  onClose,
  estimatedTime = "~120 seconds",
}: TransactionSummaryProps) {
  const { tradePair } = useTradePairContext();
  const { selectedCanopyWallet } = useWallets();
  const { wallet: externalWallet } = useUnifiedWallet();
  const { height } = usePollingData();

  const { data: capabilities } = useCapabilities();
  const { sendCalls } = useSendCalls();

  const [selectedDestination, setSelectedDestination] = useState<string>("");

  const payAsset = isSwapped ? tradePair.baseAsset : tradePair.quoteAsset;
  const receiveAsset = isSwapped ? tradePair.quoteAsset : tradePair.baseAsset;

  const areOrdersLocked =
    selectedOrders.length > 0 &&
    !selectedOrders.some((order) => !order.buyerReceiveAddress);
  const isBuyOrder = !isSwapped;
  const isSellOrder = isSwapped;

  const getDestinationAddress = () => {
    if (isBuyOrder) {
      if (areOrdersLocked) {
        // Close order: use the buyer's receive address from the order
        return selectedOrders[0].sellerReceiveAddress || "";
      } else {
        return selectedCanopyWallet?.address;
      }
    } else {
      return selectedDestination || externalWallet?.address || "";
    }
  };

  const finalDestinationAddress = getDestinationAddress();

  // Calculate order totals and average price
  const orderSummary = selectedOrders.reduce(
    (acc, order) => {
      acc.totalAmount += order.amountForSale;
      acc.totalValue += order.total;
      return acc;
    },
    { totalAmount: 0, totalValue: 0 },
  );

  const averagePrice =
    orderSummary.totalAmount > 0
      ? orderSummary.totalValue / orderSummary.totalAmount
      : 0;

  const handleSellOrder = async () => {
    if (!finalDestinationAddress) {
      toast("Error", {
        description: "Destination address is required",
        duration: 5000,
      });
      return;
    }

    try {
      await createOrder({
        address: selectedCanopyWallet?.address || "",
        committees: tradePair.committee.toString(),
        data: assetToAddress(tradePair.quoteAsset.id),
        amount: numberToBlockchainUValue(Number(receiveAmount)),
        receiveAmount: numberToBlockchainUValue(Number(payAmount)),
        // Use the calculated destination address
        receiveAddress: sliceAddress(finalDestinationAddress),
        memo: "",
        fee: 0,
        submit: true,
        password: "test",
      });

      toast("Transaction Status", {
        description: (
          <ProgressToast
            payAssetSymbol={payAsset.symbol}
            receiveAssetSymbol={receiveAsset.symbol}
            duration={20000}
          />
        ),
        duration: 20000,
      });

      onClose();
    } catch (error) {
      toast("Error", {
        description: `Failed to create order: ${error}`,
        duration: 5000,
        richColors: true,
      });
    }
  };

  const handleBuyOrder = async () => {
    if (!selectedCanopyWallet || !externalWallet || !finalDestinationAddress) {
      toast("Transaction failed", {
        description: "Missing external wallet or destination address",
        duration: 5000,
      });
      return;
    }

    try {
      // Check if batch transactions are supported via Wagmi capabilities
      const chainId = 11155111; // Sepolia
      const atomicStatus = capabilities?.[chainId]?.atomic?.status;
      const canBatch =
        selectedOrders.length > 1 &&
        (atomicStatus === "supported" || atomicStatus === "ready");

      if (canBatch) {
        await handleBatchTransactions();
      } else {
        await handleSequentialTransactions();
      }

      // Show progress toast after transactions
      toast("Transaction Status", {
        description: (
          <ProgressToast
            payAssetSymbol={payAsset.symbol}
            receiveAssetSymbol={receiveAsset.symbol}
            duration={20000}
          />
        ),
        duration: 20000,
      });

      onClose();
    } catch (error) {
      toast("Error", {
        description: `Failed to create order: ${error}`,
        duration: 5000,
        richColors: true,
      });
    }
  };

  const handleBatchTransactions = async () => {
    if (!externalWallet || !finalDestinationAddress) {
      toast("Transaction failed", {
        description: "Missing external wallet or destination address",
        duration: 5000,
      });
      return;
    }

    try {
      // Prepare calls for batch transaction
      const calls = selectedOrders.map((order) => {
        const closeOrder: CloseOrder = {
          chain_id: order.committee,
          closeOrder: true,
          orderId: order.id,
        };

        const lockOrder: LockOrder = {
          chain_id: order.committee,
          orderId: order.id,
          buyerChainDeadline: height ? height + 10 : 10,
          buyerReceiveAddress: finalDestinationAddress,
          buyerSendAddress: externalWallet.address,
        };

        const orderAmount = areOrdersLocked ? order.total : 0;
        const amountInUnits = Math.floor(numberToBlockchainUValue(orderAmount));
        const paddedTo = sliceAddress(externalWallet.address).padStart(64, "0");
        const paddedAmount = amountInUnits.toString(16).padStart(64, "0");

        const orderToSendAsMemo = JSON.stringify(
          areOrdersLocked ? closeOrder : lockOrder,
        );

        const memoJson = orderToSendAsMemo;
        const memoBytes = new TextEncoder().encode(memoJson);
        const memoHex = Array.from(memoBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const data =
          `0x${usdcTransferMethodID}${paddedTo}${paddedAmount}${memoHex}` as `0x${string}`;

        return {
          to: TEST_ORACLE_CONTRACT as `0x${string}`,
          value: BigInt(0),
          data,
        };
      });

      // Execute batch transaction using sendCalls
      sendCalls({
        calls,
      });
    } catch (error) {
      toast("Batch Transaction Failed", {
        description: `Failed to execute batch transaction. Fallback to sequential transactions. ${error}`,
        duration: 5000,
      });
      await handleSequentialTransactions();
    }
  };

  const handleSequentialTransactions = async () => {
    if (!externalWallet || !finalDestinationAddress) {
      toast("Transaction failed", {
        description: "Missing external wallet or destination address",
        duration: 5000,
      });
      return;
    }

    // Fallback to sequential transactions
    for (let i = 0; i < selectedOrders.length; i++) {
      const order = selectedOrders[i];

      const closeOrder: CloseOrder = {
        chain_id: order.committee,
        closeOrder: true,
        orderId: order.id,
      };

      const lockOrder: LockOrder = {
        chain_id: order.committee,
        orderId: order.id,
        buyerChainDeadline: height ? height + 10 : 4,
        buyerReceiveAddress: finalDestinationAddress,
        buyerSendAddress: externalWallet.address.slice(2),
      };

      const orderAmount = areOrdersLocked ? order.total : 0;
      const amountInUnits = Math.floor(orderAmount * 1000000);
      const paddedTo = areOrdersLocked
        ? padAddress(order.sellerReceiveAddress)
        : padAddress(sliceAddress(externalWallet.address));
      const paddedAmount = amountInUnits.toString(16).padStart(64, "0");

      const orderToSendAsMemo = JSON.stringify(
        areOrdersLocked ? closeOrder : lockOrder,
      );

      const memoJson = orderToSendAsMemo;
      const memoBytes = new TextEncoder().encode(memoJson);
      const memoHex = Array.from(memoBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const data =
        `0x${usdcTransferMethodID}${paddedTo}${paddedAmount}${memoHex}` as `0x${string}`;

      await sendTransaction(wagmiConfig, {
        to: TEST_ORACLE_CONTRACT,
        value: BigInt(0),
        data,
      });

      if (i < selectedOrders.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  // Initialize selected destination for sell orders
  useEffect(() => {
    if (isSellOrder && externalWallet && !selectedDestination) {
      setSelectedDestination(externalWallet.address);
    }
  }, [isSellOrder, externalWallet, selectedDestination]);

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 pb-2 flex flex-row items-center justify-between">
        <h2 className="text-xl font-bold">Transaction Summary</h2>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
        {/* Pay Section */}
        <div className="rounded-xl bg-[#F8F9FA] p-4 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Chain</span>
              <Select value={payAsset.chainId} disabled>
                <SelectTrigger className="w-full">
                  <Image
                    src={payAsset.chainIcon}
                    alt={payAsset.chainId}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <span className="text-sm">{payAsset.chainId}</span>
                </SelectTrigger>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Asset</span>
              <Select value={payAsset.id} disabled>
                <SelectTrigger className="w-full">
                  <Image
                    src={payAsset.assetIcon}
                    alt={payAsset.symbol}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <span className="text-sm">{payAsset.symbol}</span>
                </SelectTrigger>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm text-right">
                You pay
              </span>
              <div className="text-right font-semibold text-lg">
                {payAmount}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Balance: {payBalance}
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="rounded-full bg-[#F8F9FA] w-10 h-10 flex items-center justify-center">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Receive Section */}
        <div className="rounded-xl bg-[#F8F9FA] p-4 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Chain</span>
              <Select value={receiveAsset.chainId} disabled>
                <SelectTrigger className="w-full">
                  <Image
                    src={receiveAsset.chainIcon}
                    alt={receiveAsset.chainId}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <span className="text-sm">{receiveAsset.chainId}</span>
                </SelectTrigger>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Asset</span>
              <Select value={receiveAsset.id} disabled>
                <SelectTrigger className="w-full">
                  <Image
                    src={receiveAsset.assetIcon}
                    alt={receiveAsset.symbol}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <span className="text-sm">{receiveAsset.symbol}</span>
                </SelectTrigger>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm text-right">
                You receive
              </span>
              <div className="text-right font-semibold text-lg">
                {receiveAmount}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Balance: {receiveBalance}
          </div>
        </div>

        {/* Transaction Summary */}
        {!isSwapped && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Transaction Summary</span>
              <span className="text-sm text-muted-foreground">
                {selectedOrders.length} orders selected
              </span>
            </div>

            {/* Order Details */}
            <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
              {selectedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center"
                >
                  <span className="text-muted-foreground">
                    {order.amountForSale.toFixed(2)}{" "}
                    {tradePair.baseAsset.symbol} @ {order.price.toFixed(3)}
                  </span>
                  <span className="font-medium">
                    {order.total.toFixed(2)} {tradePair.quoteAsset.symbol}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between font-medium">
                <span>
                  Total: {orderSummary.totalAmount.toFixed(2)}{" "}
                  {tradePair.baseAsset.symbol}
                </span>
                <span>
                  Avg. Price: {averagePrice.toFixed(4)}{" "}
                  {tradePair.quoteAsset.symbol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Destination Address */}
        <Card className="bg-[#F8F9FA]">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">
              Destination Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSellOrder ? (
              // Sell Order: Show dropdown with external wallet
              <Select
                value={selectedDestination}
                onValueChange={setSelectedDestination}
              >
                <SelectTrigger className="w-full border-0 bg-white rounded-lg p-3">
                  <div className="flex items-center gap-3 w-full">
                    <Image
                      src="/chains-icons/ethereum-logo.svg"
                      alt="Ethereum Wallet"
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <span className="font-medium text-sm">
                      {externalWallet?.connector?.name || "MetaMask"}
                    </span>
                    {selectedDestination && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium ml-auto">
                        {ellipsizeAddress(selectedDestination)}
                      </span>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  {externalWallet && (
                    <SelectItem
                      key={externalWallet.address}
                      value={externalWallet.address}
                      className="bg-white hover:bg-gray-50 cursor-pointer focus:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 py-2 w-full">
                        <Image
                          src="/chains-icons/ethereum-logo.svg"
                          alt="Ethereum Wallet"
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                        <span className="text-sm font-medium">
                          {externalWallet.connector?.name || "MetaMask"}
                        </span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium ml-auto">
                          {ellipsizeAddress(externalWallet.address)}
                        </span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              // Buy Order: Show fixed destination based on order type
              <div className="bg-white rounded-lg p-3 flex items-center gap-3">
                <Image
                  src="/chains-icons/ethereum-logo.svg"
                  alt={areOrdersLocked ? "Order Address" : "Ethereum Wallet"}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="font-medium text-sm">
                  {areOrdersLocked
                    ? "Order Destination"
                    : externalWallet?.connector?.name || "MetaMask"}
                </span>
                {finalDestinationAddress && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium ml-auto">
                    {ellipsizeAddress(finalDestinationAddress)}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estimated Time */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Estimated Time</span>
          <span className="font-medium">{estimatedTime}</span>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={isSwapped ? handleSellOrder : handleBuyOrder}
          className="w-full h-12 text-lg font-medium rounded-xl mt-auto text-white bg-[#76E698]"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}

export default TransactionSummary;
