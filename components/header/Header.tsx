"use client";

import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileHeader from "./mobile-header";
import DesktopHeader from "./desktop-header";

function Header() {
  const isMobile = useIsMobile();

  return (
    <header className="w-full border-b bg-white flex items-center h-16 px-4 md:px-8">
      <div className="flex items-center gap-2 min-w-[180px]">
        <Image
          src="/chains-icons/canopy-logo.svg"
          alt="Canopy Swap Logo"
          width={28}
          height={28}
          className="rounded-full"
          priority
        />
        <span className="font-bold text-lg tracking-tight">Canopy Swap</span>
      </div>

      {!isMobile ? <DesktopHeader /> : <MobileHeader />}
    </header>
  );
}

export default Header;
