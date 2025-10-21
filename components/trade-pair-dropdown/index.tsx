import { useTradePairContext } from "@/context/trade-pair-context";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
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

  return (
    <Select value={tradePair.displayName} onValueChange={handlePairChange}>
      <SelectTrigger>
        <Image
          src={tradePair.quoteAsset.assetIcon}
          alt={tradePair.displayName}
          width={24}
          height={24}
          className="mr-2"
        />
        {tradePair.displayName}
      </SelectTrigger>
      <SelectContent>
        {TRADING_PAIRS_LIST.map((pair) => (
          <SelectItem key={pair.id} value={pair.displayName}>
            <Image
              src={pair.quoteAsset.assetIcon}
              alt={pair.displayName}
              width={24}
              height={24}
              className="mr-2"
            />
            {pair.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default TradePairDropdown;
