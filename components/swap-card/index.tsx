import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Image from "next/image";
import { ArrowDown, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { usePollingData } from "@/context/polling-context";
import { TransactionSummaryModal } from "@/components/transaction-summary/modal";
import { getAllChains } from "@/utils/chains";
import { getBuyableAssets, getSellableAssets } from "@/utils/assets";
import { ProcessedOrder } from "../order-book/TanStackOrderBook";
import { TradingPair } from "@/types/trading-pair";

// Get available chains and assets outside component
const chains = getAllChains();
const buyableAssets = getBuyableAssets();
const sellableAssets = getSellableAssets();

interface SwapCardProps {
  selectedOrders: ProcessedOrder[];
  onClearOrders?: () => void;
  tradingPair: TradingPair;
  isSwapped: boolean;
  handleSwapDirection: () => void;
}

export function SwapCard({
  selectedOrders = [],
  onClearOrders,
  tradingPair,
  handleSwapDirection,
  isSwapped,
}: SwapCardProps) {
  const { userBalance: canopyBalance } = usePollingData();
  const [baseAmount, setBaseAmount] = useState(0);
  const [quoteAmount, setQuoteAmount] = useState(0);
  const [isTransactionSummaryModalOpen, setIsTransactionSummaryModalOpen] =
    useState(false);

  // Get current pay and receive assets based on swap direction
  const payAsset = isSwapped ? tradingPair.baseAsset : tradingPair.quoteAsset;
  const receiveAsset = isSwapped
    ? tradingPair.quoteAsset
    : tradingPair.baseAsset;
  const payChains = isSwapped
    ? chains.filter((chain) =>
        sellableAssets.some((asset) => asset.chainId === chain.id),
      )
    : chains.filter((chain) =>
        buyableAssets.some((asset) => asset.chainId === chain.id),
      );
  const receiveChains = isSwapped
    ? chains.filter((chain) =>
        buyableAssets.some((asset) => asset.chainId === chain.id),
      )
    : chains.filter((chain) =>
        sellableAssets.some((asset) => asset.chainId === chain.id),
      );
  const payAssets = isSwapped ? sellableAssets : buyableAssets;
  const receiveAssets = isSwapped ? buyableAssets : sellableAssets;
  // Calculate totals from selected orders
  const orderTotals = useMemo(() => {
    if (selectedOrders.length === 0 || !tradingPair) {
      return {
        totalQuote: 0,
        totalBase: 0,
        averageRate: 0,
        orderCount: 0,
      };
    }

    const totalQuote = selectedOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );
    const totalBase = selectedOrders.reduce(
      (sum, order) => sum + order.amountForSale,
      0,
    );
    const averageRate = totalBase > 0 ? totalQuote / totalBase : 0;

    return {
      totalQuote,
      totalBase,
      averageRate,
      orderCount: selectedOrders.length,
    };
  }, [selectedOrders, tradingPair]);

  const handleBaseAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setBaseAmount(Number(event.target.value));
  };

  const handleQuoteAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setQuoteAmount(Number(event.target.value));
  };

  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">
          {isSwapped
            ? `Sell ${tradingPair.baseAsset.symbol}`
            : `Select chain & Tokens`}
        </CardTitle>
        {/* Avatar and settings icon can go here */}
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost">
            <span className="sr-only">Settings</span>
            <Settings />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Pay Section */}
        <div className="rounded-xl bg-background p-4 flex flex-col gap-2">
          <div className="grid grid-cols-[60px_1fr_120px] gap-2">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Chain</span>
              <Select value={payAsset.chainId || ""}>
                <SelectTrigger className="w-full">
                  <Image
                    src={payAsset.chainIcon}
                    alt={payAsset.chainId || "Chain"}
                    width={20}
                    height={20}
                  />
                </SelectTrigger>
                <SelectContent>
                  {payChains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Asset</span>
              <Select value={payAsset.id || ""}>
                <SelectTrigger className="w-full">
                  <Image
                    src={payAsset.assetIcon}
                    alt={payAsset.symbol || "Asset"}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <SelectValue placeholder={payAsset.symbol || "Asset"} />
                </SelectTrigger>
                <SelectContent>
                  {payAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm text-right">
                You pay
              </span>
              <Input
                className="text-right"
                value={
                  isSwapped
                    ? baseAmount
                    : orderTotals.totalQuote > 0
                      ? orderTotals.totalQuote.toFixed(2)
                      : "0"
                }
                disabled={!isSwapped}
                onChange={
                  isSwapped ? (e) => handleBaseAmountChange(e) : undefined
                }
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Balance: 1,245.00
          </div>
        </div>
        {/* Arrow Down */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapDirection}
            className="rounded-full bg-[#F8F9FA] w-10 h-10 flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
          >
            <ArrowDown className="text-muted-foreground" />
          </Button>
        </div>
        {/* Receive Section */}
        <div className="rounded-xl bg-[#F8F9FA] p-4 flex flex-col gap-2">
          <div className="grid grid-cols-[60px_1fr_120px] gap-2">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Chain</span>
              <Select value={receiveAsset.chainId || ""}>
                <SelectTrigger className="w-full">
                  <Image
                    src={receiveAsset.chainIcon}
                    alt={receiveAsset.chainId || "Chain"}
                    width={20}
                    height={20}
                  />
                </SelectTrigger>
                <SelectContent>
                  {receiveChains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Asset</span>
              <Select value={receiveAsset.id || ""}>
                <SelectTrigger className="w-full">
                  <Image
                    src={receiveAsset.assetIcon}
                    alt={receiveAsset.symbol || "Asset"}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <SelectValue placeholder={receiveAsset.symbol || "Asset"} />
                </SelectTrigger>
                <SelectContent>
                  {receiveAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm text-right">
                You receive
              </span>
              <Input
                className="text-right"
                value={
                  isSwapped
                    ? quoteAmount
                    : orderTotals.totalBase > 0
                      ? orderTotals.totalBase.toLocaleString()
                      : "0"
                }
                disabled={!isSwapped}
                onChange={isSwapped ? handleQuoteAmountChange : undefined}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Balance: 1,245.00
          </div>
        </div>
        {/* Orders */}
        <div className="rounded-xl bg-[#F8F9FA] p-4">
          <div className="flex items-center justify-between text-muted-foreground text-base mb-2">
            <span>Orders</span>
            <div className="flex items-center gap-2">
              <span className="text-black font-medium">
                {orderTotals.orderCount === 0
                  ? "None Selected"
                  : `${orderTotals.orderCount} Selected`}
              </span>
              {orderTotals.orderCount > 0 && onClearOrders && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearOrders}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {orderTotals.orderCount > 0 && (
            <div className="space-y-2 text-xs">
              {/* Individual Order List */}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center py-1"
                  >
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <span className="font-mono">
                        {order.amountForSale.toLocaleString()}
                      </span>
                      <span>{tradingPair?.baseAsset.symbol || "BASE"}</span>
                      <span>@</span>
                      <span className="font-mono">
                        {order.price.toFixed(4)}
                      </span>
                    </div>
                    <div className="font-mono text-muted-foreground">
                      {order.total.toFixed(2)}{" "}
                      {tradingPair?.quoteAsset.symbol || "QUOTE"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Section */}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Total:</span>
                  <span className="font-mono">
                    {orderTotals.totalBase.toLocaleString()}{" "}
                    {tradingPair?.baseAsset.symbol || "BASE"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Avg Price:</span>
                  <span className="font-mono">
                    {orderTotals.averageRate.toFixed(4)}{" "}
                    {tradingPair?.quoteAsset.symbol || "QUOTE"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Rate, Fee, Time */}
        <div className="rounded-xl bg-[#F8F9FA] p-4 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {orderTotals.orderCount > 0 ? "Average Rate" : "Last Rate"}
            </span>
            <span className="text-black">
              {orderTotals.orderCount > 0 && tradingPair
                ? `1 ${tradingPair.quoteAsset.symbol} = ${orderTotals.averageRate.toFixed(4)} ${tradingPair.baseAsset.symbol}`
                : tradingPair
                  ? `1 ${tradingPair.quoteAsset.symbol} = 2.45 ${tradingPair.baseAsset.symbol}`
                  : "Loading..."}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="text-black">0.0001 ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Time</span>
            <span className="text-black">~120 seconds</span>
          </div>
        </div>
        {/* Transaction Summary Modal */}
        <TransactionSummaryModal
          open={isTransactionSummaryModalOpen}
          onOpenChange={setIsTransactionSummaryModalOpen}
          selectedOrders={selectedOrders}
          tradingPair={tradingPair}
          isSwapped={isSwapped}
          payAmount={
            isSwapped
              ? baseAmount.toString()
              : orderTotals.totalQuote > 0
                ? orderTotals.totalQuote.toFixed(2)
                : "0"
          }
          receiveAmount={
            isSwapped
              ? quoteAmount.toString()
              : orderTotals.totalBase > 0
                ? orderTotals.totalBase.toLocaleString()
                : "0"
          }
          payBalance="1,245.00"
          receiveBalance="1,245.00"
        />
      </CardContent>
    </Card>
  );
}

export default SwapCard;
