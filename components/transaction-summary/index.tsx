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
import { submitSignedTransaction } from "@/services/orders";
import { useWallets } from "@/context/wallet";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { numberToBlockchainUValue } from "@/utils/blockchain";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { CloseOrder, LockOrder } from "@/types/order";
import { usePollingData } from "@/context/polling-context";
import { ERC20_TRANSFER_METHOD_ID } from "@/constants/tokens";
import { useCapabilities, useSendCalls, useAccount } from "wagmi";
import ProgressToast from "../headless-toast/progress-toast";
import { ProcessedOrder } from "../order-book";
import { ellipsizeAddress, padAddress, sliceAddress } from "@/utils/address";
import { useTradePairContext } from "@/context/trade-pair-context";
import { getKeyfilePassword } from "@/utils/keyfile-session";
import AssetCard from "../asset-card";
import { sendTransaction } from "wagmi/actions";
import { wagmiConfig } from "@/config/reown";
import { createSignedOrder } from "@/lib/crypto/utils/order";
import { MINIMUN_FEE } from "@/constants/blockchain";

interface TransactionSummaryProps {
  selectedOrders: ProcessedOrder[];
  isSwapped: boolean;
  payAmount: string;
  receiveAmount: string;
  payBalance: string;
  receiveBalance: string;
  onClose: () => void;
  onOrdersCleared: () => void;
  estimatedTime?: string;
}

function TransactionSummary({
  selectedOrders,
  isSwapped,
  payAmount,
  receiveAmount,
  payBalance,
  receiveBalance,
  onClose,
  onOrdersCleared,
  estimatedTime = "~120 seconds",
}: TransactionSummaryProps) {
  const { tradePair } = useTradePairContext();
  const { selectedCanopyWallet } = useWallets();
  const { wallet: externalWallet } = useUnifiedWallet();
  const { height } = usePollingData();

  const { data: capabilities } = useCapabilities();
  const { sendCallsAsync } = useSendCalls();
  const { chainId: currentChainId } = useAccount();

  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [transactionProgress, setTransactionProgress] = useState<{
    current: number;
    total: number;
    isProcessing: boolean;
  }>({ current: 0, total: 0, isProcessing: false });
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

    if (!selectedCanopyWallet?.filename) {
      toast("Error", {
        description: "No Canopy wallet selected",
        duration: 5000,
      });
      return;
    }

    const password = getKeyfilePassword(selectedCanopyWallet.filename);
    if (!password) {
      toast("Error", {
        description:
          "Keyfile password not found. Please re-authenticate your keyfile.",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const signedTx = await createSignedOrder(
        selectedCanopyWallet,
        password,
        {
          chainId: tradePair.committee,
          data: sliceAddress(tradePair.contractAddress),
          amountForSale: numberToBlockchainUValue(Number(payAmount)),
          requestedAmount: numberToBlockchainUValue(Number(receiveAmount)),
          sellerReceiveAddress: sliceAddress(finalDestinationAddress),
          sellersSendAddress: selectedCanopyWallet?.address || "",
        },
        {
          networkID: tradePair.committee,
          chainID: 1,
          currentHeight: height?.height || 0,
          fee: MINIMUN_FEE,
        },
      );

      // Submit the signed transaction to the Canopy network
      await submitSignedTransaction(signedTx, tradePair.committee);

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
      onOrdersCleared();
    } catch (error) {
      toast("Error", {
        description: `Failed to create order: ${error}`,
        duration: 5000,
        richColors: true,
      });
    } finally {
      setIsLoading(false);
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
      const chainId = currentChainId || 1;
      const atomicStatus = capabilities?.[chainId]?.atomic?.status;

      const canBatch =
        selectedOrders.length > 1 &&
        (atomicStatus === "supported" || atomicStatus === "ready");

      if (canBatch) {
        await handleBatchTransactions();
      } else {
        await handleSequentialTransactions();
      }
    } catch (error) {
      toast("Error", {
        description: `Failed to buy order: ${error}`,
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
          buyerChainDeadline: height ? height.height + 10 : 10,
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
          `0x${ERC20_TRANSFER_METHOD_ID}${paddedTo}${paddedAmount}${memoHex}` as `0x${string}`;

        return {
          to: tradePair.contractAddress as `0x${string}`,
          value: BigInt(0),
          data,
        };
      });

      await sendCallsAsync({
        calls,
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

      // Clear selected orders after successful buy
      onOrdersCleared();
      onClose();
    } catch (error) {
      console.error(error);
      toast("Batch Transaction Failed", {
        description:
          "Failed to execute batch transaction. Falling back to sequential transactions.",
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

    // Initialize progress tracking
    setTransactionProgress({
      current: 0,
      total: selectedOrders.length,
      isProcessing: true,
    });

    try {
      // Fallback to sequential transactions
      for (let i = 0; i < selectedOrders.length; i++) {
        // Update progress
        setTransactionProgress({
          current: i + 1,
          total: selectedOrders.length,
          isProcessing: true,
        });
        const order = selectedOrders[i];

        const closeOrder: CloseOrder = {
          chain_id: order.committee,
          closeOrder: true,
          orderId: order.id,
        };

        const lockOrder: LockOrder = {
          chain_id: order.committee,
          orderId: order.id,
          buyerChainDeadline: height ? height.height + 10 : 4,
          buyerReceiveAddress: finalDestinationAddress,
          buyerSendAddress: sliceAddress(externalWallet.address),
        };

        const orderAmount = areOrdersLocked ? order.total : 0;
        const amountInUnits = Math.floor(numberToBlockchainUValue(orderAmount));
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
          `0x${ERC20_TRANSFER_METHOD_ID}${paddedTo}${paddedAmount}${memoHex}` as `0x${string}`;

        await sendTransaction(wagmiConfig, {
          to: tradePair.contractAddress as `0x${string}`,
          value: BigInt(0),
          data,
        });
      }

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

      // Clear selected orders after successful buy
      onOrdersCleared();
      onClose();
    } catch (error) {
      console.error(error);
      toast("Sequential Transaction Failed", {
        description: "One or more transactions failed. Please try again.",
        duration: 5000,
        richColors: true,
      });
    } finally {
      // Reset progress tracking
      setTransactionProgress({
        current: 0,
        total: 0,
        isProcessing: false,
      });
    }
  };

  // Initialize selected destination for sell orders
  useEffect(() => {
    if (isSellOrder && externalWallet && !selectedDestination) {
      setSelectedDestination(externalWallet.address);
    }
  }, [isSellOrder, externalWallet, selectedDestination]);

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="p-6 pb-2 flex flex-row items-center justify-between">
        <h2 className="text-xl font-bold">Transaction Summary</h2>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
        <AssetCard
          asset={payAsset}
          label="You pay"
          amount={payAmount}
          balance={payBalance}
        />

        <div className="flex justify-center">
          <div className="rounded-full bg-muted/50 w-10 h-10 flex items-center justify-center">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <AssetCard
          asset={receiveAsset}
          label="You receive"
          amount={receiveAmount}
          balance={receiveBalance}
        />

        {!isSwapped && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Transaction Summary</span>
              <span className="text-sm text-muted-foreground">
                {selectedOrders.length} orders selected
              </span>
            </div>

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

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">
              Destination Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSellOrder ? (
              <Select
                value={selectedDestination}
                onValueChange={setSelectedDestination}
              >
                <SelectTrigger className="w-full border rounded-lg p-3">
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
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium ml-auto">
                        {ellipsizeAddress(selectedDestination)}
                      </span>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg">
                  {externalWallet && (
                    <SelectItem
                      key={externalWallet.address}
                      value={externalWallet.address}
                      className="bg-popover hover:bg-muted cursor-pointer focus:bg-muted"
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
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium ml-auto">
                          {ellipsizeAddress(externalWallet.address)}
                        </span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-card rounded-lg p-3 flex items-center gap-3 border">
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
                  <span className="bg-primary/30 text-primary px-2 py-1 rounded text-xs font-medium ml-auto">
                    {ellipsizeAddress(finalDestinationAddress)}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Estimated Time</span>
          <span className="font-medium">{estimatedTime}</span>
        </div>

        {transactionProgress.isProcessing && (
          <div className="rounded-lg bg-muted/50 p-4 border-l-4 border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                Processing Transactions
              </span>
              <span className="text-sm text-muted-foreground">
                {transactionProgress.current} of {transactionProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(transactionProgress.current / transactionProgress.total) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Please confirm each transaction in your wallet when prompted
            </p>
          </div>
        )}

        <Button
          onClick={isSwapped ? handleSellOrder : handleBuyOrder}
          disabled={transactionProgress.isProcessing || isLoading}
          className="w-full h-12 text-lg font-medium rounded-xl mt-auto bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {transactionProgress.isProcessing || isLoading
            ? "Processing..."
            : "Confirm"}
        </Button>
      </div>
    </div>
  );
}

export default TransactionSummary;
