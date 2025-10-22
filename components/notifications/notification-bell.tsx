"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePollingData } from "@/context/polling-context";
import { useWallets } from "@/context/wallet";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { useMemo, useState, useEffect, useRef } from "react";
import { blockchainUValueToNumber } from "@/utils/blockchain";
import { ellipsizeAddress } from "@/utils/address";
import { useTradePairContext } from "@/context/trade-pair-context";
import { toast } from "sonner";
import { TransactionSummaryModal } from "../transaction-summary/modal";
import { ProcessedOrder } from "../order-book";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<ProcessedOrder[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const { orders } = usePollingData();
  const { selectedCanopyWallet } = useWallets();
  const { wallet: externalWallet } = useUnifiedWallet();
  const { tradePair } = useTradePairContext();
  const previousOrderIdsRef = useRef<Set<string>>(new Set());

  // Get locked orders where user is involved
  const userLockedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders) || !tradePair) return [];

    const userCanopyAddress = selectedCanopyWallet?.address?.toLowerCase();
    const userExternalAddress = externalWallet?.address?.toLowerCase();

    return orders
      .filter((order) => {
        // Must be locked (has buyer)
        if (!order.buyerSendAddress) return false;

        // Check if user is the seller
        const isUserSeller =
          userCanopyAddress &&
          order.sellersSendAddress?.toLowerCase() === userCanopyAddress;

        // Check if user is the buyer
        const isUserBuyer =
          (userExternalAddress &&
            order.buyerSendAddress?.toLowerCase() === userExternalAddress) ||
          (userCanopyAddress &&
            order.buyerReceiveAddress?.toLowerCase() === userCanopyAddress);

        return isUserSeller || isUserBuyer;
      })
      .map((order) => {
        const amountForSale = blockchainUValueToNumber(
          order.amountForSale || 0,
        );
        const requestedAmount = blockchainUValueToNumber(
          order.requestedAmount || 0,
        );
        const price = amountForSale > 0 ? requestedAmount / amountForSale : 0;

        return {
          ...order,
          price,
          amountForSale,
          requestedAmount,
          total: price * amountForSale,
        } as ProcessedOrder;
      });
  }, [orders, selectedCanopyWallet, externalWallet, tradePair]);

  // Count orders where user is the buyer (they need to close the order)
  const actionRequiredCount = useMemo(() => {
    if (!selectedCanopyWallet?.address && !externalWallet?.address) return 0;

    const userCanopyAddress = selectedCanopyWallet?.address?.toLowerCase();
    const userExternalAddress = externalWallet?.address?.toLowerCase();

    return userLockedOrders.filter((order) => {
      // Check if user is the buyer (needs to close the order)
      const isUserBuyer =
        (userExternalAddress &&
          order.buyerSendAddress?.toLowerCase() === userExternalAddress) ||
        (userCanopyAddress &&
          order.buyerReceiveAddress?.toLowerCase() === userCanopyAddress);

      return isUserBuyer;
    }).length;
  }, [userLockedOrders, selectedCanopyWallet, externalWallet]);

  const getUserRole = useMemo(
    () => (order: ProcessedOrder) => {
      const userCanopyAddress = selectedCanopyWallet?.address?.toLowerCase();
      const userExternalAddress = externalWallet?.address?.toLowerCase();

      const isUserBuyer =
        (userExternalAddress &&
          order.buyerSendAddress?.toLowerCase() === userExternalAddress) ||
        (userCanopyAddress &&
          order.buyerReceiveAddress?.toLowerCase() === userCanopyAddress);

      return isUserBuyer ? "buyer" : "seller";
    },
    [externalWallet, selectedCanopyWallet],
  );

  const handleCloseSelectedOrders = () => {
    setModalOpen(true);
    setOpen(false);
  };

  const handleOrdersCleared = () => {
    setSelectedOrders([]);
  };

  const handleOrderSelection = (order: ProcessedOrder, checked: boolean) => {
    if (checked) {
      setSelectedOrders((prev) => [...prev, order]);
    } else {
      setSelectedOrders((prev) => prev.filter((o) => o.id !== order.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const buyerOrders = userLockedOrders.filter(
        (order) => getUserRole(order) === "buyer",
      );
      setSelectedOrders(buyerOrders);
    } else {
      setSelectedOrders([]);
    }
  };

  const isOrderSelected = (order: ProcessedOrder) => {
    return selectedOrders.some((o) => o.id === order.id);
  };

  const getTimeRemaining = (order: ProcessedOrder) => {
    if (!order.buyerChainDeadline) return null;

    // TODO: Calculate actual time remaining based on current height and deadline
    // For now, show the deadline value
    return `Block ${order.buyerChainDeadline}`;
  };

  // Calculate total amounts for selected orders
  const selectedOrderTotals = useMemo(() => {
    const totalBaseAmount = selectedOrders.reduce(
      (sum, order) => sum + order.amountForSale,
      0,
    );
    const totalQuoteAmount = selectedOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );

    return {
      payAmount: totalQuoteAmount.toString(), // User pays USDC
      receiveAmount: totalBaseAmount.toString(), // User receives base asset
      payBalance: "0", // We don't track balance here
      receiveBalance: "0", // We don't track balance here
    };
  }, [selectedOrders]);

  useEffect(() => {
    const currentBuyerOrders = userLockedOrders.filter(
      (order) => getUserRole(order) === "buyer",
    );
    const currentOrderIds = new Set(
      currentBuyerOrders.map((order) => order.id),
    );

    const newOrderIds = [...currentOrderIds].filter(
      (id) => !previousOrderIdsRef.current.has(id),
    );

    if (newOrderIds.length > 0 && previousOrderIdsRef.current.size > 0) {
      toast("New Order Locked!", {
        description: `${newOrderIds.length} order${newOrderIds.length > 1 ? "s" : ""} ${newOrderIds.length > 1 ? "are" : "is"} ready to close`,
        duration: 5000,
      });
    }

    // Update the ref with current order IDs (automatically handles cleanup)
    previousOrderIdsRef.current = currentOrderIds;

    // Clean up ref when there are no more locked orders
    if (userLockedOrders.length === 0) {
      previousOrderIdsRef.current = new Set();
    }
  }, [userLockedOrders, selectedCanopyWallet, externalWallet, getUserRole]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`relative p-2 ${className}`}
          >
            <Bell className="h-5 w-5" />
            {actionRequiredCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {actionRequiredCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Order Notifications</h3>
              {actionRequiredCount > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedOrders.length ===
                        userLockedOrders.filter(
                          (order) => getUserRole(order) === "buyer",
                        ).length && selectedOrders.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <Label
                    htmlFor="select-all"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Select All
                  </Label>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {userLockedOrders.length > 0
                ? `${userLockedOrders.length} locked order${userLockedOrders.length > 1 ? "s" : ""}`
                : "No locked orders"}
            </p>
            {selectedOrders.length > 0 && (
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={handleCloseSelectedOrders}
                  className="w-full text-xs h-8"
                >
                  Close {selectedOrders.length} Selected Order
                  {selectedOrders.length > 1 ? "s" : ""}
                </Button>
              </div>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {userLockedOrders.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No locked orders to display
              </div>
            ) : (
              <div className="space-y-1">
                {userLockedOrders.map((order) => {
                  const userRole = getUserRole(order);
                  const timeRemaining = getTimeRemaining(order);
                  const isActionRequired = userRole === "buyer";

                  return (
                    <div
                      key={order.id}
                      className={`p-3 border-b last:border-b-0 ${
                        isActionRequired ? "bg-green-50" : "bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isActionRequired && (
                          <Checkbox
                            id={`order-${order.id}`}
                            checked={isOrderSelected(order)}
                            onCheckedChange={(checked) =>
                              handleOrderSelection(order, checked as boolean)
                            }
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                isActionRequired ? "default" : "secondary"
                              }
                              className="text-xs bg-green-600 hover:bg-green-700"
                            >
                              {isActionRequired ? "Ready to Close" : "Locked"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              You are the {userRole}
                            </span>
                          </div>
                          <div className="text-sm font-medium">
                            {order.amountForSale.toFixed(2)}{" "}
                            {tradePair?.baseAsset.symbol} @{" "}
                            {order.price.toFixed(4)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total: {order.total.toFixed(2)}{" "}
                            {tradePair?.quoteAsset.symbol}
                          </div>
                          {timeRemaining && (
                            <div className="text-xs text-muted-foreground">
                              Deadline: {timeRemaining}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Order: {ellipsizeAddress(order.id)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <TransactionSummaryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedOrders={selectedOrders}
        isSwapped={false} // For close orders, user is buying (paying USDC for base asset)
        payAmount={selectedOrderTotals.payAmount}
        receiveAmount={selectedOrderTotals.receiveAmount}
        payBalance={selectedOrderTotals.payBalance}
        receiveBalance={selectedOrderTotals.receiveBalance}
        onOrdersCleared={handleOrdersCleared}
        showTrigger={false}
      />
    </>
  );
}
