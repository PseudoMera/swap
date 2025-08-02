"use client";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { X, Wallet2 } from "lucide-react";

const wallets = [
  {
    name: "MetaMask",
    icon: "/metamask.png",
    connected: true,
    address: "0x1234...5678",
  },
  {
    name: "Canopy Wallet",
    icon: "/canopy-logo.svg",
    connected: false,
    address: "",
  },
];

export function WalletManagementPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className="bg-green-100 text-green-900 hover:bg-green-200 flex items-center gap-2 font-medium px-4"
        >
          <Wallet2 size={18} className="mr-1" />
          Connect Wallet
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="sm:w-lg sm:max-w-lg max-w-2xs rounded-2xl p-0 shadow-lg"
        sideOffset={8}
      >
        <div className="p-6 pb-2">
          <div className="text-2xl font-bold mb-2">Wallet Management</div>
        </div>
        <div className="p-6 pt-0 flex flex-col gap-0">
          {/* Wallet options */}
          <div className="rounded-2xl  bg-[#F8F9FA]">
            {wallets.map((wallet, idx) => (
              <div key={wallet.name}>
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-3">
                    <Image
                      src={wallet.icon}
                      alt={wallet.name}
                      width={24}
                      height={24}
                      className="rounded-full bg-white border"
                    />
                    <span className="font-semibold text-sm">{wallet.name}</span>
                  </div>
                  {wallet.connected && (
                    <div className="flex items-center gap-2 bg-green-100 text-green-900 rounded-xl px-3 py-1 font-medium">
                      <span>{wallet.address}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  )}
                </div>
                {idx < wallets.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
