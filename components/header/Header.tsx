import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Wallet2, Moon } from "lucide-react";
import { Input } from "../ui/input";
import { WalletManagementPopover } from "../wallet-management/popover";

const navLinks = [
  { name: "Swap", active: true },
  { name: "Order Book", active: false },
  { name: "History", active: false },
  { name: "Stats", active: false },
];

export function Header() {
  return (
    <header className="w-full border-b bg-white flex items-center h-16 px-4 md:px-8">
      {/* Logo and Brand */}
      <div className="flex items-center gap-2 min-w-[180px]">
        <Image
          src="/canopy-logo.svg"
          alt="Canopy Swap Logo"
          width={32}
          height={32}
          className="rounded-full"
          priority
        />
        <span className="font-bold text-lg tracking-tight">Canopy Swap</span>
      </div>

      {/* Navigation */}
      <nav className="ml-8 flex gap-6">
        {navLinks.map((link) => (
          <a
            key={link.name}
            href="#"
            className={cn(
              "relative text-base font-medium transition-colors",
              link.active
                ? "text-black"
                : "text-muted-foreground hover:text-black",
            )}
          >
            {link.name}
            {link.active && (
              <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-green-800 rounded" />
            )}
          </a>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search, Theme Toggle, Wallet */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search size={18} />
          </span>
          <Input
            type="text"
            placeholder="Search pairs"
            className="pl-9 pr-3 py-2 rounded-md bg-muted text-sm border-none focus:ring-2 focus:ring-green-200 transition w-[180px] placeholder:text-muted-foreground"
          />
        </div>
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="bg-muted hover:bg-muted/80 text-muted-foreground"
          aria-label="Toggle theme"
        >
          <Moon size={18} />
        </Button>

        <WalletManagementPopover />
      </div>
    </header>
  );
}

export default Header;
