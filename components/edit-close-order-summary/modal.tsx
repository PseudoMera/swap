import { TradingPair } from "@/types/trading-pair";
import EditCloseOrderSummary from ".";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { ProcessedTransaction } from "@/types/transactions";

interface EditCloseOrderSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
  tradingPair: TradingPair;
  isBuySide: boolean;
  payAmount: string;
  receiveAmount: string;
  payBalance: string;
  receiveBalance: string;
  transaction: ProcessedTransaction;
}

function EditCloseOrderSummaryModal({
  onOpenChange,
  open,
  disabled = false,
  isBuySide,
  payAmount,
  receiveAmount,
  payBalance,
  receiveBalance,
  tradingPair,
  transaction,
}: EditCloseOrderSummaryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 w-full h-fit max-w-md overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Transaction Summary</DialogTitle>
        <EditCloseOrderSummary
          tradingPair={tradingPair}
          isBuySide={isBuySide}
          payAmount={payAmount}
          receiveAmount={receiveAmount}
          payBalance={payBalance}
          receiveBalance={receiveBalance}
          transaction={transaction}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default EditCloseOrderSummaryModal;
