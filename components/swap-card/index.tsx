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
import { ProcessedOrder } from "@/components/order-book/StableOrderBook";
import { useMemo, useState } from "react";
import { TradingPair } from "@/constants/trading-pairs";
import { getAllChains } from "@/constants/chains";
import { getBuyableAssets, getSellableAssets } from "@/constants/assets";

// Get available chains and assets outside component
const chains = getAllChains();
const buyableAssets = getBuyableAssets();
const sellableAssets = getSellableAssets();

interface SwapCardProps {
  selectedOrders: ProcessedOrder[];
  onClearOrders?: () => void;
  tradingPair: TradingPair;
  onTradingPairChange?: (pair: TradingPair) => void;
  isSwapped: boolean;
  handleSwapDirection: () => void;
}

export function SwapCard({
  selectedOrders = [],
  onClearOrders,
  tradingPair,
  onTradingPairChange,
  handleSwapDirection,
  isSwapped,
}: SwapCardProps) {
  const [baseAmount, setBaseAmount] = useState(0);
  const [quoteAmount, setQuoteAmount] = useState(0);

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
          <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
            <span>Chain</span>
            <span>Asset</span>
            <span>You pay</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={payAsset.chainId || ""}>
              <SelectTrigger className="w-24">
                <Image
                  src={
                    payAsset.chainId === "ethereum"
                      ? "/globe.svg"
                      : "/canopy-logo.svg"
                  }
                  alt={payAsset.chainId || "Chain"}
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <SelectValue
                  placeholder={
                    chains.find((c) => c.id === payAsset.chainId)?.name ||
                    "Chain"
                  }
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
            <Select value={payAsset.id || ""}>
              <SelectTrigger className="w-28">
                <Image
                  src={
                    payAsset.symbol === "USDC"
                      ? "/file.svg"
                      : "/canopy-logo.svg"
                  }
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
            <Input
              className="ml-auto w-20 text-right"
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
          <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
            <span>Chain</span>
            <span>Asset</span>
            <span>You receive</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={receiveAsset.chainId || ""}>
              <SelectTrigger className="w-24">
                <Image
                  src={
                    receiveAsset.chainId === "ethereum"
                      ? "/globe.svg"
                      : "/canopy-logo.svg"
                  }
                  alt={receiveAsset.chainId || "Chain"}
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <SelectValue
                  placeholder={
                    chains.find((c) => c.id === receiveAsset.chainId)?.name ||
                    "Chain"
                  }
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
            <Select value={receiveAsset.id || ""}>
              <SelectTrigger className="w-28">
                <Image
                  src={
                    receiveAsset.symbol === "CNPY"
                      ? "/canopy-logo.svg"
                      : "/file.svg"
                  }
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
            <Input
              className="ml-auto w-20 text-right"
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
        {/* Connect Wallet Button */}
        <Button className="w-full bg-green-100 text-green-900 hover:bg-green-200 mt-2 h-12 text-lg font-medium rounded-xl">
          Connect Wallet
        </Button>
      </CardContent>
    </Card>
  );
}

export default SwapCard;
