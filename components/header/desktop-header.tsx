import { navLinks } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "../theme-toggle";
import WalletManagementPopover from "../wallet-management/popover";
import { NotificationBell } from "../notifications/notification-bell";
import TradePairDropdown from "../trade-pair-dropdown";

function DesktopHeader() {
  const pathname = usePathname();

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
        <TradePairDropdown />
        <NotificationBell />
        <ThemeToggle />

        <WalletManagementPopover />
      </div>
    </section>
  );
}

export default DesktopHeader;
