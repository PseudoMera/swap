import { navLinks } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import Image from "next/image";
import { TRADING_PAIRS_LIST } from "@/constants/trading-pairs";
import { usePathname } from "next/navigation";
import { useTradePairContext } from "@/context/trade-pair-context";
import ThemeToggle from "../theme-toggle";
import WalletManagementPopover from "../wallet-management/popover";
import { NotificationBell } from "../notifications/notification-bell";

function DesktopHeader() {
  const pathname = usePathname();

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
    <section className="md:flex-row w-full flex flex-col justify-between">
      <nav className="ml-8 flex gap-6">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "relative text-base font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.name}
              {isActive && (
                <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-primary rounded" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
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
        <NotificationBell />
        <ThemeToggle />

        <WalletManagementPopover />
      </div>
    </section>
  );
}

export default DesktopHeader;
