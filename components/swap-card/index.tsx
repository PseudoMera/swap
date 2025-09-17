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
import { ArrowDown } from "lucide-react";
import { useMemo, useState } from "react";
import { usePollingData } from "@/context/polling-context";
import { TransactionSummaryModal } from "@/components/transaction-summary/modal";
import { getAllChains } from "@/utils/chains";
import { getBuyableAssets, getSellableAssets } from "@/utils/assets";
import { ProcessedOrder } from "../order-book/tanstack-order-book";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { useBalance } from "wagmi";
import { ZeroXAddress } from "@/types/wallet";
import { formatNumber, formatTokenBalance } from "@/utils/number";
import { useTradePairContext } from "@/context/trade-pair-context";

const chains = getAllChains();
const buyableAssets = getBuyableAssets();
const sellableAssets = getSellableAssets();

interface SwapCardProps {
  selectedOrders: ProcessedOrder[];
  onClearOrders: () => void;
  isSwapped: boolean;
  handleSwapDirection: () => void;
}

function SwapCard({
  selectedOrders = [],
  onClearOrders,
  handleSwapDirection,
  isSwapped,
}: SwapCardProps) {
  const { tradePair } = useTradePairContext();
  const { canopyBalance } = usePollingData();
  const { wallet } = useUnifiedWallet();
  const { data } = useBalance({
    address: wallet?.address as ZeroXAddress,
  });

  const [baseAmount, setBaseAmount] = useState(0);
  const [quoteAmount, setQuoteAmount] = useState(0);
  const [isTransactionSummaryModalOpen, setIsTransactionSummaryModalOpen] =
    useState(false);

  // Get current pay and receive assets based on swap direction
  const payBalance = isSwapped
    ? formatNumber(canopyBalance)
    : formatTokenBalance(data);
  const receiveBalance = isSwapped
    ? formatTokenBalance(data)
    : formatNumber(canopyBalance);
  const payAsset = isSwapped ? tradePair.baseAsset : tradePair.quoteAsset;
  const receiveAsset = isSwapped ? tradePair.quoteAsset : tradePair.baseAsset;
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
    if (selectedOrders.length === 0 || !tradePair) {
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
  }, [selectedOrders, tradePair]);

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

  const handleOrdersCleared = () => {
    onClearOrders();
    setBaseAmount(0);
    setQuoteAmount(0);
  };

  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">
          {isSwapped
            ? `Sell ${tradePair.baseAsset.symbol}`
            : `Select chain & Tokens`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-xl bg-muted/50 p-4 flex flex-col gap-2">
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
            Balance: {payBalance?.toLocaleString() || "N/A"}
          </div>
        </div>
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapDirection}
            className="rounded-full bg-muted/50 w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowDown className="text-muted-foreground" />
          </Button>
        </div>
        <div className="rounded-xl bg-muted/50 p-4 flex flex-col gap-2">
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
            Balance: {receiveBalance || "0"}
          </div>
        </div>

        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-center justify-between text-muted-foreground text-base mb-2">
            <span>Orders</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium">
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
                      <span>{tradePair?.baseAsset.symbol || "BASE"}</span>
                      <span>@</span>
                      <span className="font-mono">
                        {order.price.toFixed(4)}
                      </span>
                    </div>
                    <div className="font-mono text-muted-foreground">
                      {order.total.toFixed(2)}{" "}
                      {tradePair?.quoteAsset.symbol || "QUOTE"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Total:</span>
                  <span className="font-mono">
                    {orderTotals.totalBase.toLocaleString()}{" "}
                    {tradePair?.baseAsset.symbol || "BASE"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Avg Price:</span>
                  <span className="font-mono">
                    {orderTotals.averageRate.toFixed(4)}{" "}
                    {tradePair?.quoteAsset.symbol || "QUOTE"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-muted/50 p-4 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {orderTotals.orderCount > 0 ? "Average Rate" : "Last Rate"}
            </span>
            <span className="text-foreground">
              {orderTotals.orderCount > 0 && tradePair
                ? `1 ${tradePair.quoteAsset.symbol} = ${orderTotals.averageRate.toFixed(4)} ${tradePair.baseAsset.symbol}`
                : tradePair
                  ? `1 ${tradePair.quoteAsset.symbol} = 2.45 ${tradePair.baseAsset.symbol}`
                  : "Loading..."}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="text-foreground">0.0001 ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Time</span>
            <span className="text-foreground">~120 seconds</span>
          </div>
        </div>
        {/* Transaction Summary Modal */}
        <TransactionSummaryModal
          open={isTransactionSummaryModalOpen}
          onOpenChange={setIsTransactionSummaryModalOpen}
          selectedOrders={selectedOrders}
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
          payBalance={payBalance?.toString() || "N/A"}
          receiveBalance={receiveBalance?.toString() || "N/A"}
          onOrdersCleared={handleOrdersCleared}
        />
      </CardContent>
    </Card>
  );
}

export default SwapCard;
