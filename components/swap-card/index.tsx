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

export function SwapCard() {
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
            <Input className="ml-auto w-20 text-right" placeholder="0" />
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
              placeholder="0"
              disabled
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Balance: 1,245.00
          </div>
        </div>
        {/* Orders */}
        <div className="rounded-xl bg-[#F8F9FA] p-4 flex items-center justify-between text-muted-foreground text-base">
          <span>Orders</span>
          <span className="text-black font-medium">None Selected</span>
        </div>
        {/* Rate, Fee, Time */}
        <div className="rounded-xl bg-[#F8F9FA] p-4 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Rate</span>
            <span className="text-black">1 USDC = 2.45 CNPY</span>
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
