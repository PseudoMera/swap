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
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
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

function WalletManagementPopover() {
  const { connect, disconnect, selectedCanopyWallet } = useWallets();
  const {
    wallet: externalWallet,
    isConnected: isExternalConnected,
    isConnecting,
  } = useUnifiedWallet();

  // Check if any wallet is connected - external or Canopy
  const connectedAddress =
    externalWallet?.address || selectedCanopyWallet?.address || null;
  const isConnected = isExternalConnected || Boolean(selectedCanopyWallet);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className="bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700 flex items-center gap-2 font-medium px-4"
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
          <div className="rounded-lg  bg-muted/50">
            {reownSupportedWallets.map((wallet, idx) => (
              <React.Fragment key={wallet.name}>
                <Button
                  variant="ghost"
                  className="w-full h-20 flex justify-baseline hover:bg-muted/30"
                  disabled={isConnecting}
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
                    <span className="font-semibold text-sm">
                      {isConnecting ? "Connecting..." : wallet.name}
                    </span>
                  </div>

                  {externalWallet?.address && (
                    <div className="max-w-32 flex items-center gap-2 bg-green-100 text-green-700 rounded-xl px-3 py-1 font-medium ml-auto">
                      <span>{ellipsizeAddress(externalWallet.address)}</span>
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

export default WalletManagementPopover;
