"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { ProcessedTransaction } from "@/types/transactions";
import { exportTransactionsToPDF } from "@/utils/pdf-export";
import { useWallets } from "@/context/wallet";

type ExportFormat = "excel" | "csv" | "pdf";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ProcessedTransaction[];
}

function ExportModal({ open, onOpenChange, data }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | "">("");
  const { selectedCanopyWallet } = useWallets();

  const handleExport = () => {
    if (selectedFormat) {
      switch (selectedFormat) {
        case "pdf":
          exportTransactionsToPDF(data, {
            walletAddress: selectedCanopyWallet?.address,
            includeStats: true,
          });
          break;
        case "excel":
          // TODO: Implement Excel export
          console.log("Excel export not implemented yet");
          break;
        case "csv":
          // TODO: Implement CSV export
          console.log("CSV export not implemented yet");
          break;
      }

      // Reset and close modal
      setSelectedFormat("");
      onOpenChange(false);
    }
  };

  const handleSelectedChange = (value: string) => {
    setSelectedFormat(value as ExportFormat);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Transaction History</DialogTitle>
          <DialogDescription>
            Choose the format you&apos;d like to export your transaction history
            in. All visible transactions will be included in the export.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="export-format">Export Format</Label>
            <Select value={selectedFormat} onValueChange={handleSelectedChange}>
              <SelectTrigger id="export-format">
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!selectedFormat}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExportModal;
