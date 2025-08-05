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
import { ProcessedOrder } from "@/components/order-book";
import { useMemo } from "react";

interface SwapCardProps {
  selectedOrders: ProcessedOrder[];
  onClearOrders?: () => void;
}

export function SwapCard({ selectedOrders = [], onClearOrders }: SwapCardProps) {
  // Calculate totals from selected orders
  const orderTotals = useMemo(() => {
    if (selectedOrders.length === 0) {
      return {
        totalUSDC: 0,
        totalCNPY: 0,
        averageRate: 0,
        orderCount: 0,
      };
    }

    const totalUSDC = selectedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalCNPY = selectedOrders.reduce((sum, order) => sum + order.amountForSale, 0);
    const averageRate = totalCNPY > 0 ? totalUSDC / totalCNPY : 0;

    return {
      totalUSDC,
      totalCNPY,
      averageRate,
      orderCount: selectedOrders.length,
    };
  }, [selectedOrders]);

  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">
          Select Chain & Tokens
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
            <Select>
              <SelectTrigger className="w-24">
                <Image
                  src="/globe.svg"
                  alt="Ethereum"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <SelectValue placeholder="ETH" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eth">Ethereum</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-28">
                <Image
                  src="/file.svg"
                  alt="USDC"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <SelectValue placeholder="USDC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usdc">USDC</SelectItem>
                <SelectItem value="usdt">USDT</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              className="ml-auto w-20 text-right" 
              value={orderTotals.totalUSDC > 0 ? orderTotals.totalUSDC.toFixed(2) : "0"}
              readOnly
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Balance: 1,245.00
          </div>
        </div>
        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="rounded-full bg-[#F8F9FA] w-10 h-10 flex items-center justify-center">
            <ArrowDown className="text-muted-foreground" />
          </div>
        </div>
        {/* Receive Section */}
        <div className="rounded-xl bg-[#F8F9FA] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
            <span>Chain</span>
            <span>Asset</span>
            <span>You receive</span>
          </div>
          <div className="flex items-center gap-2">
            <Select>
              <SelectTrigger className="w-24">
                <Image
                  src="/canopy-logo.svg"
                  alt="CNPY Chain"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <SelectValue placeholder="CNPY" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cnpy">CNPY Chain</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-28">
                <Image
                  src="/canopy-logo.svg"
                  alt="CNPY"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <SelectValue placeholder="CNPY" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cnpy">CNPY</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="ml-auto w-20 text-right"
              value={orderTotals.totalCNPY > 0 ? orderTotals.totalCNPY.toLocaleString() : "0"}
              disabled
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
                {orderTotals.orderCount === 0 ? "None Selected" : `${orderTotals.orderCount} Selected`}
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
                  <div key={order.id} className="flex justify-between items-center py-1">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <span className="font-mono">{order.amountForSale.toLocaleString()}</span>
                      <span>CNPY</span>
                      <span>@</span>
                      <span className="font-mono">{order.price.toFixed(4)}</span>
                    </div>
                    <div className="font-mono text-muted-foreground">
                      {order.total.toFixed(2)} USDC
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Totals Section */}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Total:</span>
                  <span className="font-mono">{orderTotals.totalCNPY.toLocaleString()} CNPY</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Avg Price:</span>
                  <span className="font-mono">{orderTotals.averageRate.toFixed(4)} USDC</span>
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
              {orderTotals.orderCount > 0 
                ? `1 USDC = ${orderTotals.averageRate.toFixed(4)} CNPY`
                : "1 USDC = 2.45 CNPY"
              }
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
