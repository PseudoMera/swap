import Image from "next/image";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Upload, AlertCircle, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { secureStorage } from "@/lib/secure-storage";
import { useWallets } from "@/context/wallet";
import {
  validateKeyfileFormat,
  getValidationErrorMessage,
} from "@/utils/keyfile-validation";
import { ellipsizeAddress } from "@/utils/address";
import type { CanopyKeyfile } from "@/types/wallet";

const canopyWallet = {
  name: "Canopy Wallet",
  icon: "/chains-icons/canopy-logo.svg",
};

function CanopyWalletManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");

  const {
    storedKeyfiles,
    selectedCanopyWallet,
    setSelectedCanopyWallet,
    refreshStoredKeyfiles,
  } = useWallets();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setValidationError("");

    if (file) {
      await handleStoreKeyfile(file);
    }
  };

  const handleStoreKeyfile = async (file: File) => {
    setIsLoading(true);
    setValidationError("");

    try {
      const keyfileText = await file.text();

      // Parse JSON
      let parsedKeyfile: CanopyKeyfile | CanopyKeyfile[];
      try {
        parsedKeyfile = JSON.parse(keyfileText);
      } catch (parseError) {
        setValidationError(
          `Invalid JSON file. Please check the file format: ${parseError}`,
        );
        return;
      }

      // Validate keyfile format
      const validationResult = validateKeyfileFormat(parsedKeyfile);

      if (!validationResult.isValid) {
        setValidationError(getValidationErrorMessage(validationResult));
        return;
      }

      // Check if keyfile already exists
      const exists = await secureStorage.keyfileExists(keyfileText);
      if (exists) {
        setValidationError("This keyfile is already stored.");
        return;
      }

      // Store the validated keyfile
      await secureStorage.storeKeyfile(file.name, keyfileText);
      await refreshStoredKeyfiles();

      // Reset file selection after a brief delay
      setTimeout(() => {
        setSelectedFile(null);
      }, 3000);
    } catch (err) {
      setValidationError(
        `Failed to store keyfile: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelect = (address: string) => {
    // Find the keyfile that contains this address
    const keyfile = storedKeyfiles.find((kf) =>
      kf.accountAddresses.includes(address),
    );

    if (keyfile) {
      setSelectedCanopyWallet({
        address,
        keyfileId: keyfile.id,
        filename: keyfile.filename,
      });
    }
  };

  const handleRemoveKeyfile = async (keyfileId: string) => {
    try {
      setIsLoading(true);
      await secureStorage.deleteKeyfile(keyfileId);
      
      // Clear selection if the removed keyfile was selected
      if (selectedCanopyWallet?.keyfileId === keyfileId) {
        setSelectedCanopyWallet(null);
      }
      
      await refreshStoredKeyfiles();
    } catch (err) {
      setValidationError(
        `Failed to remove keyfile: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full p-4 flex flex-col gap-4 justify-baseline rounded-lg  bg-muted/50">
      <div className="flex items-center gap-3">
        <Image
          src={canopyWallet.icon}
          alt={canopyWallet.name}
          width={24}
          height={24}
          className="rounded-full bg-white border"
        />
        <span className="font-semibold text-sm">{canopyWallet.name}</span>
        
        {selectedCanopyWallet?.address && (
          <div className="max-w-32 flex items-center gap-2 bg-green-100 text-green-700 rounded-xl px-3 py-1 font-medium ml-auto">
            <span className="text-sm">{ellipsizeAddress(selectedCanopyWallet.address)}</span>
            <span
              className="h-6 w-6 p-0 flex items-center"
              onClick={() => handleRemoveKeyfile(selectedCanopyWallet.keyfileId)}
            >
              <X size={16} />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Label className="text-muted-foreground">Login with Keyfile:</Label>
        <div className="relative">
          <Input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={isLoading}
            className="opacity-0 absolute inset-0 w-full h-14 cursor-pointer z-20"
          />
          <div className="border-2 border-dashed border-input hover:border-gray-400 h-14 rounded-md flex items-center justify-center gap-2 bg-background">
            {isLoading ? (
              <span className="text-sm text-muted-foreground">
                Storing keyfile...
              </span>
            ) : selectedFile ? (
              <span className="text-sm">{selectedFile.name}</span>
            ) : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  keyfile().json
                </span>
              </>
            )}
          </div>
        </div>

        {/* Validation messages */}
        {validationError && (
          <div className="flex items-start gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="whitespace-pre-line">{validationError}</div>
          </div>
        )}

        {/* Show stored keyfiles if any exist */}
        {storedKeyfiles.length > 0 && (
          <>
            <Label className="text-muted-foreground">Select Account:</Label>
            <Select
              value={selectedCanopyWallet?.address || ""}
              onValueChange={handleAccountSelect}
            >
              <SelectTrigger className="w-full">
                <span className="bg-green-100 px-2 py-1 rounded text-green-700">
                  <SelectValue placeholder="Choose an account..." />
                </span>
              </SelectTrigger>
              <SelectContent>
                {storedKeyfiles.map((keyfile) =>
                  keyfile.accountAddresses.map((address) => (
                    <SelectItem key={address} value={address}>
                      {address}
                    </SelectItem>
                  )),
                )}
              </SelectContent>
            </Select>

            {/* Stored keyfiles list with remove buttons */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Stored Keyfiles:</Label>
              {storedKeyfiles.map((keyfile) => (
                <div
                  key={keyfile.id}
                  className="flex items-center justify-between p-2 bg-card border border-border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {keyfile.filename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {keyfile.accountAddresses.length} account{keyfile.accountAddresses.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveKeyfile(keyfile.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CanopyWalletManagement;
