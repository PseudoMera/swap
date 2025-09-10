import { ArrowDown, X } from "lucide-react";
import { Button } from "../ui/button";
import { Select, SelectTrigger } from "../ui/select";
import { Input } from "../ui/input";
import Image from "next/image";
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
        <div className="rounded-xl bg-muted/50 p-4 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Chain</span>
              <Select value={payAsset.chainId} disabled>
                <SelectTrigger className="w-full">
                  <Image
                    src={payAsset.chainIcon}
                    alt={payAsset.chainId}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <span className="text-sm">{payAsset.chainId}</span>
                </SelectTrigger>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Asset</span>
              <Select value={payAsset.id} disabled>
                <SelectTrigger className="w-full">
                  <Image
                    src={payAsset.assetIcon}
                    alt={payAsset.symbol}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <span className="text-sm">{payAsset.symbol}</span>
                </SelectTrigger>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm text-right">
                You pay
              </span>
              <Input
                type="number"
                className="text-right font-semibold text-lg bg-transparent border-b-2 border-gray-300 focus:border-blue-500 transition-colors"
                value={payInput}
                onChange={(e) => setPayInput(e.target.value)}
                min="0"
                step="any"
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Balance: {payBalance}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="rounded-full bg-muted/50 w-10 h-10 flex items-center justify-center">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-xl bg-muted/50 p-4 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Chain</span>
              <Select value={receiveAsset.chainId} disabled>
                <SelectTrigger className="w-full">
                  <Image
                    src={receiveAsset.chainIcon}
                    alt={receiveAsset.chainId}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <span className="text-sm">{receiveAsset.chainId}</span>
                </SelectTrigger>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm">Asset</span>
              <Select value={receiveAsset.id} disabled>
                <SelectTrigger className="w-full">
                  <Image
                    src={receiveAsset.assetIcon}
                    alt={receiveAsset.symbol}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <span className="text-sm">{receiveAsset.symbol}</span>
                </SelectTrigger>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm text-right">
                You receive
              </span>
              <Input
                type="number"
                className="text-right font-semibold text-lg bg-transparent border-b-2 border-gray-300 focus:border-blue-500 transition-colors"
                value={receiveInput}
                onChange={(e) => setReceiveInput(e.target.value)}
                min="0"
                step="any"
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Balance: {receiveBalance}
          </div>
        </div>

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
