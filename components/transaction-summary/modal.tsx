import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallets } from "@/context/wallet";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import TransactionSummary from ".";
import { ProcessedOrder } from "../order-book";

interface TransactionSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: ProcessedOrder[];
  isSwapped: boolean;
  payAmount: string;
  receiveAmount: string;
  payBalance: string;
  receiveBalance: string;
  triggerClassName?: string;
  disabled?: boolean;
  onOrdersCleared: () => void;
  showTrigger?: boolean;
}

export function TransactionSummaryModal({
  open,
  onOpenChange,
  selectedOrders,
  isSwapped,
  payAmount,
  receiveAmount,
  payBalance,
  receiveBalance,
  triggerClassName = "w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2 h-12 text-lg font-medium rounded-xl",
  disabled = false,
  onOrdersCleared,
  showTrigger = true,
}: TransactionSummaryModalProps) {
  const { selectedCanopyWallet } = useWallets();
  const { isConnected: isExternalConnected } = useUnifiedWallet();

  // Buy orders (!isSwapped) require external wallet for USDC payments
  // Sell orders (isSwapped) require Canopy wallet for base asset payments
  const hasRequiredWallet = !isSwapped
    ? isExternalConnected // Buy orders need external wallet
    : Boolean(selectedCanopyWallet); // Sell orders need Canopy wallet

  // Only show modal if there are selected orders AND required wallet is connected
  const hasValidTransaction = !isSwapped
    ? selectedOrders.length > 0 && hasRequiredWallet
    : hasRequiredWallet;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            className={triggerClassName}
            disabled={disabled || !hasValidTransaction}
          >
            {!hasRequiredWallet
              ? "Connect Wallet"
              : disabled
                ? "Insufficient Balance"
                : selectedOrders.length === 0 && !isSwapped
                  ? "Select Orders"
                  : "Review Transaction"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className="p-0 w-full h-fit max-w-md overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Transaction Summary</DialogTitle>
        <TransactionSummary
          selectedOrders={selectedOrders}
          isSwapped={isSwapped}
          payAmount={payAmount}
          receiveAmount={receiveAmount}
          payBalance={payBalance}
          receiveBalance={receiveBalance}
          onClose={() => onOpenChange(false)}
          estimatedTime="~120 seconds"
          onOrdersCleared={onOrdersCleared}
        />
      </DialogContent>
    </Dialog>
  );
}

export default TransactionSummaryModal;
