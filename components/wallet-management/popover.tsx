"use client";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { X, Wallet2, ChevronDown } from "lucide-react";
import { useWallets } from "@/context/wallet";
import React from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { ellipsizeAddress } from "@/utils/address";
import { ChainType, WalletType } from "@/types/wallet";
import CanopyWalletManagement from "./canopy-wallet-management";

type SupportedWallet = "MetaMask" | "Canopy Wallet";

type ConnectWallets = {
  name: SupportedWallet;
  icon: string;
  reownName: WalletType;
  chain: ChainType;
};

const reownSupportedWallets: ConnectWallets[] = [
  {
    name: "MetaMask",
    icon: "/chains-icons/metamask.png",
    chain: "ethereum",
    reownName: "metamask",
  },
];

export function WalletManagementPopover() {
  const { connect, disconnect, wallets, selectedCanopyWallet } = useWallets();
  const eip155Account = useAppKitAccount({ namespace: "eip155" });
  
  // Check if any wallet is connected - first check external wallets, then fallback to Canopy
  const isExternalWalletConnected = wallets.length > 0 && wallets[0].connected;
  const connectedAddress = isExternalWalletConnected 
    ? wallets[0].address 
    : selectedCanopyWallet?.address || null;
  const isConnected = !!connectedAddress;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className="bg-green-100 text-green-900 hover:bg-green-200 flex items-center gap-2 font-medium px-4"
        >
          {isConnected ? (
            <>
              <Wallet2 size={18} />
              <span>{ellipsizeAddress(connectedAddress || "")}</span>
              <ChevronDown size={16} />
            </>
          ) : (
            <>
              <Wallet2 size={18} className="mr-1" />
              Connect Wallet
            </>
          )}
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
          <div className="rounded-lg  bg-[#F8F9FA]">
            {reownSupportedWallets.map((wallet, idx) => (
              <React.Fragment key={wallet.name}>
                <Button
                  variant="ghost"
                  className="w-full h-20 flex justify-baseline"
                  onClick={() => connect("metamask", "ethereum")}
                >
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

                  {eip155Account.isConnected && eip155Account.address && (
                    <div className="max-w-32 flex items-center gap-2 bg-green-100 text-green-900 rounded-xl px-3 py-1 font-medium ml-auto">
                      <span>{ellipsizeAddress(eip155Account.address)}</span>
                      <span
                        className="h-6 w-6 p-0 flex items-center"
                        onClick={() =>
                          disconnect(wallet.reownName, wallet.chain)
                        }
                      >
                        <X size={16} />
                      </span>
                    </div>
                  )}
                </Button>
                {idx < reownSupportedWallets.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
          <Separator />
          <CanopyWalletManagement />
        </div>
      </PopoverContent>
    </Popover>
  );
}
