import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useWallets } from "@/context/wallet";
import { ellipsizeAddress } from "@/utils/address";
import { TransactionFilters } from "@/types/transactions";
import { getAllTradingPairs } from "@/utils/trading-pairs";
import { Search } from "lucide-react";

interface FilterBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
}

const STATUS_OPTIONS = ["All Status", "Open", "Pending", "Completed"];
const TIME_RANGE_OPTIONS = ["All Time", "24h", "7d", "30d", "90d"];

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const { selectedCanopyWallet, storedKeyfiles } = useWallets();
  const tradingPairs = getAllTradingPairs();
  const pairOptions = [
    "All Pairs",
    ...tradingPairs.map((pair) => pair.displayName),
  ];

  const connectedAddresses = [];
  if (selectedCanopyWallet?.address) {
    connectedAddresses.push({
      address: selectedCanopyWallet.address,
      label: `Canopy: ${ellipsizeAddress(selectedCanopyWallet.address)}`,
    });
  }

  storedKeyfiles.forEach((keyfile) => {
    keyfile.accountAddresses.forEach((addr) => {
      if (addr !== selectedCanopyWallet?.address) {
        connectedAddresses.push({
          address: addr,
          label: `Canopy: ${ellipsizeAddress(addr)}`,
        });
      }
    });
  });

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          {/* Left group - Filter dropdowns */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={filters.pair}
              onValueChange={(value) => handleFilterChange("pair", value)}
            >
              <SelectTrigger className="w-48 bg-muted">
                <SelectValue placeholder="Select pair" />
              </SelectTrigger>
              <SelectContent>
                {pairOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-48 bg-muted">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.timeRange}
              onValueChange={(value) => handleFilterChange("timeRange", value)}
            >
              <SelectTrigger className="w-48 bg-muted">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.address}
              onValueChange={(value) => handleFilterChange("address", value)}
            >
              <SelectTrigger className="w-64 bg-muted">
                <SelectValue placeholder="Select address" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Addresses">All Addresses</SelectItem>
                {connectedAddresses.map(({ address, label }) => (
                  <SelectItem key={address} value={address}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right group - Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by transaction hash..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-80 pl-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FilterBar;
