import { Card } from "../ui/card";
import { Select, SelectTrigger } from "../ui/select";
import { Input } from "../ui/input";
import Image from "next/image";

interface Asset {
  id: string;
  symbol: string;
  chainId: string;
  chainIcon: string;
  assetIcon: string;
}

interface AssetCardProps {
  asset: Asset;
  label: string;
  amount: string;
  balance: string;
  editable?: boolean;
  onAmountChange?: (value: string) => void;
}

export function AssetCard({
  asset,
  label,
  amount,
  balance,
  editable = false,
  onAmountChange,
}: AssetCardProps) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">Chain</span>
          <Select value={asset.chainId} disabled>
            <SelectTrigger className="w-full">
              <Image
                src={asset.chainIcon}
                alt={asset.chainId}
                width={20}
                height={20}
                className="mr-2"
              />
              <span className="text-sm">{asset.chainId}</span>
            </SelectTrigger>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">Asset</span>
          <Select value={asset.id} disabled>
            <SelectTrigger className="w-full">
              <Image
                src={asset.assetIcon}
                alt={asset.symbol}
                width={20}
                height={20}
                className="mr-2"
              />
              <span className="text-sm">{asset.symbol}</span>
            </SelectTrigger>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm text-right">
            {label}
          </span>
          {editable ? (
            <Input
              type="number"
              className="text-right font-semibold text-lg bg-transparent border-b-2 border-gray-300 focus:border-blue-500 transition-colors"
              value={amount}
              onChange={(e) => onAmountChange?.(e.target.value)}
              min="0"
              step="any"
            />
          ) : (
            <div className="text-right font-semibold text-lg">
              {amount}
            </div>
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        Balance: {balance}
      </div>
    </Card>
  );
}