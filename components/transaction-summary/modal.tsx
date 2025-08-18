import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionSummary } from "./index";
import { ProcessedOrder } from "../order-book/TanStackOrderBook";
import { TradingPair } from "@/types/trading-pair";

interface TransactionSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: ProcessedOrder[];
  tradingPair: TradingPair;
  isSwapped: boolean;
  payAmount: string;
  receiveAmount: string;
  payBalance: string;
  receiveBalance: string;
  triggerLabel?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function TransactionSummaryModal({
  open,
  onOpenChange,
  selectedOrders,
  tradingPair,
  isSwapped,
  payAmount,
  receiveAmount,
  payBalance,
  receiveBalance,
  triggerLabel = "Connect Wallet",
  triggerClassName = "w-full bg-green-100 text-green-900 hover:bg-green-200 mt-2 h-12 text-lg font-medium rounded-xl",
  disabled = false,
}: TransactionSummaryModalProps) {
  // Only show modal if there are selected orders
  const hasValidTransaction = !isSwapped ? selectedOrders.length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={triggerClassName}
          disabled={disabled || !hasValidTransaction}
        >
          {hasValidTransaction ? "Review Transaction" : triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="p-0 w-full h-fit max-w-md overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Transaction Summary</DialogTitle>
        <TransactionSummary
          selectedOrders={selectedOrders}
          tradingPair={tradingPair}
          isSwapped={isSwapped}
          payAmount={payAmount}
          receiveAmount={receiveAmount}
          payBalance={payBalance}
          receiveBalance={receiveBalance}
          onClose={() => onOpenChange(false)}
          estimatedTime="~120 seconds"
        />
      </DialogContent>
    </Dialog>
  );
}

export default TransactionSummaryModal;
