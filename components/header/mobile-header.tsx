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
import { navLinks } from "@/constants/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import WalletManagementPopover from "../wallet-management/popover";
import ThemeToggle from "../theme-toggle";
import { NotificationBell } from "../notifications/notification-bell";
import TradePairDropdown from "../trade-pair-dropdown";

function MobileHeader() {
  const pathname = usePathname();

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
              <TradePairDropdown />
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
