import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger } from "@/components/ui/select";
import Image from "next/image";
import { ArrowDown, ArrowRight, RefreshCcw, X } from "lucide-react";
import { createOrder } from "@/services/orders";
import { useWallets } from "@/context/wallet";
import { numberToBlockchainUValue } from "@/utils/blockchain";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { Progress } from "../ui/progress";
import { ProcessedOrder } from "../order-book/TanStackOrderBook";
import { TradingPair } from "@/types/trading-pair";

interface TransactionSummaryProps {
  selectedOrders: ProcessedOrder[];
  tradingPair: TradingPair;
  isSwapped: boolean;
  payAmount: string;
  receiveAmount: string;
  payBalance: string;
  receiveBalance: string;
  destinationAddress?: string;
  onClose: () => void;
  estimatedTime?: string;
}

export function TransactionSummary({
  selectedOrders,
  tradingPair,
  isSwapped,
  payAmount,
  receiveAmount,
  payBalance,
  receiveBalance,
  destinationAddress,
  onClose,
  estimatedTime = "~120 seconds",
}: TransactionSummaryProps) {
  const { selectedCanopyWallet } = useWallets();

  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current pay and receive assets based on swap direction
  const payAsset = isSwapped ? tradingPair.baseAsset : tradingPair.quoteAsset;
  const receiveAsset = isSwapped
    ? tradingPair.quoteAsset
    : tradingPair.baseAsset;

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
    try {
      await createOrder({
        address: selectedCanopyWallet?.address || "",
        committees: "1",
        data: "",
        amount: numberToBlockchainUValue(Number(receiveAmount)),
        receiveAmount: numberToBlockchainUValue(Number(payAmount)),
        receiveAddress: selectedCanopyWallet?.address || "",
        memo: "",
        fee: 0,
        submit: true,
        password: "test",
      });

      // Start timer to decrease progress
      const interval = 100; // ms between updates
      const decrement = 100 / (20_000 / interval);

      if (timerRef.current) clearInterval(timerRef.current); // Clear any previous timer

      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev - decrement;
          if (next <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return next;
        });
      }, interval);

      toast("Transaction Status", {
        description: (
          <div className="w-full min-w-[320px] text-black">
            <div className="w-full flex justify-between flex-col gap-2">
              <RefreshCcw />
              <div className="text-muted">
                <p className="text-black">Ask Creation in Progress</p>
                <span className="flex gap-4">
                  {payAsset.symbol} <ArrowRight /> {receiveAsset.symbol}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Estimated completion: {Math.ceil((progress / 100) * 20)} seconds
              </div>
            </div>
            <Progress
              value={progress}
              className="w-full bg-[#76E698] fill-[#76E698]"
            />
          </div>
        ),
      });

      onClose();
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const handleBuyOrder = async () => {
    console.log("Buy order!");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
                    {tradingPair.baseAsset.symbol} @ {order.price.toFixed(3)}
                  </span>
                  <span className="font-medium">
                    {order.total.toFixed(2)} {tradingPair.quoteAsset.symbol}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between font-medium">
                <span>
                  Total: {orderSummary.totalAmount.toFixed(2)}{" "}
                  {tradingPair.baseAsset.symbol}
                </span>
                <span>
                  Avg. Price: {averagePrice.toFixed(4)}{" "}
                  {tradingPair.quoteAsset.symbol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Destination Address */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Destination Address:</Label>
          <div className="w-full p-4 rounded-xl bg-[#F8F9FA] border">
            <div className="flex items-center gap-3">
              <Image
                src="/chains-icons/canopy-logo.svg"
                alt="Canopy Wallet"
                width={24}
                height={24}
                className="rounded-full bg-white border"
              />
              <span className="font-semibold text-sm">Canopy Wallet</span>
              <div className="ml-auto">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                  {destinationAddress
                    ? `${destinationAddress.slice(0, 6)}...${destinationAddress.slice(-4)}`
                    : "0x1234...5678"}
                </span>
              </div>
            </div>
          </div>
        </div>

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
