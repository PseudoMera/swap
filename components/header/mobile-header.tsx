import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { useTradePairContext } from "@/context/trade-pair-context";
import { TRADING_PAIRS_LIST } from "@/constants/trading-pairs";
import { navLinks } from "@/constants/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import WalletManagementPopover from "../wallet-management/popover";
import ThemeToggle from "../theme-toggle";
import { NotificationBell } from "../notifications/notification-bell";

function MobileHeader() {
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
    <section className="ml-auto">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Canopy Swap</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 px-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "relative py-2 text-base font-medium transition-colors",
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
          <div className="flex flex-col gap-4 px-6 py-4">
            <div className="flex justify-between">
              <Select
                value={tradePair.displayName}
                onValueChange={handlePairChange}
              >
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
              <div className="flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
              </div>
            </div>
            <WalletManagementPopover />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default MobileHeader;
