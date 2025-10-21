import { useTradePairContext } from "@/context/trade-pair-context";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "../ui/select";
import { TRADING_PAIRS_LIST } from "@/constants/trading-pairs";
import Image from "next/image";

function TradePairDropdown() {
  const { tradePair, updateSelectedPair } = useTradePairContext();

  const handlePairChange = (value: string) => {
    const newPair = TRADING_PAIRS_LIST.find(
      (pair) => pair.displayName === value,
    );
    if (newPair) {
      updateSelectedPair(newPair);
    }
  };

  // Group trading pairs by quote asset chain
  const pairsByChain = TRADING_PAIRS_LIST.reduce(
    (acc, pair) => {
      const chainId = pair.quoteAsset.chainId;
      if (!acc[chainId]) {
        acc[chainId] = {
          chainName: pair.quoteAsset.chainId,
          chainIcon: pair.quoteAsset.chainIcon,
          pairs: [],
        };
      }
      acc[chainId].pairs.push(pair);
      return acc;
    },
    {} as Record<
      string,
      { chainName: string; chainIcon: string; pairs: typeof TRADING_PAIRS_LIST }
    >,
  );

  return (
    <Select value={tradePair.displayName} onValueChange={handlePairChange}>
      <SelectTrigger>
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-2">
            <Image
              src={tradePair.quoteAsset.chainIcon}
              alt={`${tradePair.quoteAsset.chainId} chain`}
              width={20}
              height={20}
              className="rounded-full ring-2 ring-background"
            />
            <Image
              src={tradePair.baseAsset.chainIcon}
              alt={`${tradePair.baseAsset.chainId} chain`}
              width={20}
              height={20}
              className="rounded-full ring-2 ring-background"
            />
          </div>
          <span>{tradePair.displayName}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.values(pairsByChain).map((group) => (
          <SelectGroup key={group.chainName}>
            <SelectLabel className="flex items-center gap-2 capitalize">
              <Image
                src={group.chainIcon}
                alt={group.chainName}
                width={16}
                height={16}
                className="rounded-full"
              />
              {group.chainName}
            </SelectLabel>
            {group.pairs.map((pair) => (
              <SelectItem key={pair.id} value={pair.displayName}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-2">
                    <Image
                      src={pair.quoteAsset.chainIcon}
                      alt={`${pair.quoteAsset.chainId} chain`}
                      width={20}
                      height={20}
                      className="rounded-full ring-2 ring-background"
                    />
                    <Image
                      src={pair.baseAsset.chainIcon}
                      alt={`${pair.baseAsset.chainId} chain`}
                      width={20}
                      height={20}
                      className="rounded-full ring-2 ring-background"
                    />
                  </div>
                  <span>{pair.displayName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

export default TradePairDropdown;
