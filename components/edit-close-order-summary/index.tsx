import { ArrowDown, X } from "lucide-react";
import { Button } from "../ui/button";
import { AssetCard } from "../asset-card";
import { TradingPair } from "@/types/trading-pair";
import { deleteOrder, editOrder } from "@/services/orders";
import { numberToBlockchainUValue } from "@/utils/blockchain";
import { ProcessedTransaction } from "@/types/transactions";
import { useState } from "react";
import { useWallets } from "@/context/wallet";
import { toast } from "sonner";
import ProgressToast from "../headless-toast/progress-toast";

interface EditCloseOrderSummaryProps {
  tradingPair: TradingPair;
  isBuySide: boolean;
  payAmount: string;
  receiveAmount: string;
  payBalance: string;
  receiveBalance: string;
  transaction: ProcessedTransaction;
  onClose: () => void;
}

function EditCloseOrderSummary({
  tradingPair,
  isBuySide,
  onClose,
  payAmount,
  receiveAmount,
  payBalance,
  receiveBalance,
  transaction,
}: EditCloseOrderSummaryProps) {
  const { selectedCanopyWallet } = useWallets();

  const [payInput, setPayInput] = useState(payAmount);
  const [receiveInput, setReceiveInput] = useState(receiveAmount);

  const payAsset = isBuySide ? tradingPair.baseAsset : tradingPair.quoteAsset;
  const receiveAsset = isBuySide
    ? tradingPair.quoteAsset
    : tradingPair.baseAsset;

  const handleEditAskOrder = async () => {
    try {
      if (transaction.rawData.order && selectedCanopyWallet) {
        await editOrder({
          address: selectedCanopyWallet.address,
          amount: numberToBlockchainUValue(Number(payInput)),
          committees: "1",
          data: "",
          memo: "",
          orderId: transaction.rawData.order.id,
          password: "test",
          receiveAddress: transaction.rawData.order.sellerReceiveAddress,
          receiveAmount: numberToBlockchainUValue(Number(receiveInput)),
          submit: true,
          fee: 0,
        });

        toast("Transaction Status", {
          description: (
            <ProgressToast
              payAssetSymbol={payAsset.symbol}
              receiveAssetSymbol={receiveAsset.symbol}
              duration={20000}
              title="Edit order in Progress"
            />
          ),
          duration: 20000,
        });
      }

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAskOrder = async () => {
    try {
      if (transaction.rawData.order && selectedCanopyWallet) {
        // Prepare delete order payload
        const payload = {
          address: selectedCanopyWallet.address,
          committees: "1",
          orderId: transaction.rawData.order.id,
          fee: 0,
          memo: "",
          submit: true,
          password: "test",
        };
        // Dynamically import deleteOrder to avoid circular deps if any
        await deleteOrder(payload);

        toast("Transaction Status", {
          description: (
            <ProgressToast
              payAssetSymbol={payAsset.symbol}
              receiveAssetSymbol={receiveAsset.symbol}
              duration={20000}
              title="Cancelation in Progress"
            />
          ),
          duration: 20000,
        });
      }

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background p-6">
      <div className="pb-2 flex flex-row items-center justify-between">
        <h2 className="text-xl font-bold">Transaction Summary</h2>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <AssetCard
          asset={payAsset}
          label="You pay"
          amount={payInput}
          balance={payBalance}
          editable={true}
          onAmountChange={setPayInput}
        />

        <div className="flex justify-center">
          <div className="rounded-full w-10 h-10 flex items-center justify-center">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <AssetCard
          asset={receiveAsset}
          label="You receive"
          amount={receiveInput}
          balance={receiveBalance}
          editable={true}
          onAmountChange={setReceiveInput}
        />

        <div className="flex flex-col gap-2 my-2">
          <Button
            variant="ghost"
            className="w-full h-12 text-lg font-medium rounded-xl mt-auto bg-primary text-primary-foreground"
            onClick={handleEditAskOrder}
          >
            Edit Ask Order
          </Button>
          <Button
            variant="secondary"
            className="w-full h-12 text-lg font-medium rounded-xl mt-auto text-error-foreground bg-error"
            onClick={handleDeleteAskOrder}
          >
            Cancel Ask Order
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditCloseOrderSummary;
