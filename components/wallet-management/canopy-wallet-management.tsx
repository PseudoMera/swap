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
import {
  Upload,
  AlertCircle,
  Trash2,
  X,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
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
import {
  storeKeyfilePassword,
  removeKeyfilePassword,
  hasStoredPassword,
  getKeyfilePassword,
} from "@/utils/keyfile-session";

const canopyWallet = {
  name: "Canopy Wallet",
  icon: "/chains-icons/canopy-logo.svg",
};

function CanopyWalletManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");
  const [pendingKeyfile, setPendingKeyfile] = useState<{
    file: File;
    content: string;
  } | null>(null);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(false);
  const [selectedKeyfileForAuth, setSelectedKeyfileForAuth] = useState<{
    id: string;
    filename: string;
  } | null>(null);
  const [expandedKeyfile, setExpandedKeyfile] = useState<string | null>(null);

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
    setPendingKeyfile(null);
    setPassword("");

    if (file) {
      await validateKeyfile(file);
    }
  };

  const validateKeyfile = async (file: File) => {
    setIsLoading(true);
    setValidationError("");

    try {
      const keyfileText = await file.text();

      let parsedKeyfile: CanopyKeyfile | CanopyKeyfile[];
      try {
        parsedKeyfile = JSON.parse(keyfileText);
      } catch (parseError) {
        setValidationError(
          `Invalid JSON file. Please check the file format: ${parseError}`,
        );
        return;
      }

      const validationResult = validateKeyfileFormat(parsedKeyfile);

      if (!validationResult.isValid) {
        setValidationError(getValidationErrorMessage(validationResult));
        return;
      }

      const exists = await secureStorage.keyfileExists(keyfileText);
      if (exists) {
        setValidationError("This keyfile is already stored.");
        return;
      }

      setPendingKeyfile({ file, content: keyfileText });
    } catch (err) {
      setValidationError(
        `Failed to validate keyfile: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPassword = async () => {
    if (!pendingKeyfile || !password.trim()) {
      setValidationError("Please enter a password for this keyfile.");
      return;
    }

    setIsLoading(true);
    setValidationError("");

    try {
      await secureStorage.storeKeyfile(
        pendingKeyfile.file.name,
        pendingKeyfile.content,
      );

      storeKeyfilePassword(pendingKeyfile.file.name, password);

      await refreshStoredKeyfiles();

      setPendingKeyfile(null);
      setPassword("");
      setSelectedFile(null);
    } catch (err) {
      setValidationError(
        `Failed to store keyfile: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPassword = () => {
    setPendingKeyfile(null);
    setPassword("");
    setSelectedFile(null);
  };

  const handleKeyfileSelect = (keyfileId: string) => {
    const keyfile = storedKeyfiles.find((kf) => kf.id === keyfileId);
    if (!keyfile) return;

    const storedPassword = getKeyfilePassword(keyfile.filename);

    if (storedPassword) {
      setExpandedKeyfile(keyfileId);
    } else {
      setSelectedKeyfileForAuth({ id: keyfileId, filename: keyfile.filename });
      setShowPasswordPrompt(true);
      setPassword("");
      setValidationError("");
    }
  };

  const handlePasswordSubmit = () => {
    if (!selectedKeyfileForAuth || !password.trim()) {
      setValidationError("Please enter a password.");
      return;
    }

    storeKeyfilePassword(selectedKeyfileForAuth.filename, password);

    const keyfile = storedKeyfiles.find(
      (kf) => kf.id === selectedKeyfileForAuth.id,
    );
    if (keyfile) {
      setExpandedKeyfile(selectedKeyfileForAuth.id);
    }

    setShowPasswordPrompt(false);
    setSelectedKeyfileForAuth(null);
    setPassword("");
    setValidationError("");
  };

  const handlePasswordPromptCancel = () => {
    setShowPasswordPrompt(false);
    setSelectedKeyfileForAuth(null);
    setPassword("");
    setValidationError("");
  };

  const handleAddressSelect = (keyfileId: string, address: string) => {
    const keyfile = storedKeyfiles.find((kf) => kf.id === keyfileId);
    if (!keyfile) return;

    setSelectedCanopyWallet({
      address,
      keyfileId,
      filename: keyfile.filename,
    });

    setExpandedKeyfile(null);
  };

  const handleRemoveKeyfile = async (keyfileId: string) => {
    try {
      setIsLoading(true);

      const keyfile = storedKeyfiles.find((kf) => kf.id === keyfileId);
      if (keyfile) {
        removeKeyfilePassword(keyfile.filename);
      }

      await secureStorage.deleteKeyfile(keyfileId);

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
            <span className="text-sm">
              {ellipsizeAddress(selectedCanopyWallet.address)}
            </span>
            <span
              className="h-6 w-6 p-0 flex items-center"
              onClick={() =>
                handleRemoveKeyfile(selectedCanopyWallet.keyfileId)
              }
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

        {pendingKeyfile && (
          <div className="space-y-3 p-4 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Keyfile validated successfully! Please set a password.
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyfile-password" className="text-green-800">
                Password for {pendingKeyfile.file.name}:
              </Label>
              <div className="relative">
                <Input
                  id="keyfile-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password for this keyfile"
                  className="pr-10 border-green-300 focus:border-green-500"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleConfirmPassword();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-green-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConfirmPassword}
                disabled={isLoading || !password.trim()}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Storing..." : "Store Keyfile"}
              </Button>
              <Button
                onClick={handleCancelPassword}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {validationError && (
          <div className="flex items-start gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="whitespace-pre-line">{validationError}</div>
          </div>
        )}

        {showPasswordPrompt && selectedKeyfileForAuth && (
          <div className="space-y-3 p-4 border border-primary/20 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Enter password for {selectedKeyfileForAuth.filename}
              </span>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter keyfile password"
                  className="pr-10 border-primary/30 focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePasswordSubmit();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-primary" />
                  ) : (
                    <Eye className="h-4 w-4 text-primary" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePasswordSubmit}
                disabled={!password.trim()}
                size="sm"
              >
                Unlock Wallet
              </Button>
              <Button
                onClick={handlePasswordPromptCancel}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {storedKeyfiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Select Keyfile:</Label>
            {storedKeyfiles.map((keyfile) => {
              const hasPassword = hasStoredPassword(keyfile.filename);
              const isSelected =
                selectedCanopyWallet?.keyfileId === keyfile.id && hasPassword;
              const isExpanded = expandedKeyfile === keyfile.id;

              return (
                <div key={keyfile.id} className="space-y-2">
                  <div
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "border-success bg-success-light"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                    onClick={() => handleKeyfileSelect(keyfile.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-foreground truncate">
                          {keyfile.filename}
                        </div>
                        {hasPassword && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Password stored
                          </span>
                        )}
                        {isSelected && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {keyfile.accountAddresses.length} account
                        {keyfile.accountAddresses.length !== 1 ? "s" : ""}
                        {isSelected &&
                          hasPassword &&
                          selectedCanopyWallet?.address && (
                            <span>
                              {" "}
                              • {ellipsizeAddress(selectedCanopyWallet.address)}
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveKeyfile(keyfile.id);
                        }}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {(isExpanded || isSelected) && hasPassword && (
                    <div className="ml-3 pl-3 border-l-2 border-purple-200">
                      <Select
                        key={selectedCanopyWallet?.address || "no-selection"}
                        onValueChange={(address) =>
                          handleAddressSelect(keyfile.id, address)
                        }
                      >
                        <SelectTrigger className="border-purple-300 bg-white">
                          <SelectValue placeholder="Choose an address..." />
                        </SelectTrigger>
                        <SelectContent>
                          {keyfile.accountAddresses.map((address) => {
                            const isCurrentAddress =
                              isSelected &&
                              address === selectedCanopyWallet?.address;
                            return (
                              <SelectItem
                                key={address}
                                value={address}
                                className={
                                  isCurrentAddress
                                    ? "border-l-4 border-l-success bg-success-light"
                                    : ""
                                }
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col items-start">
                                    <span className="font-mono text-sm">
                                      {ellipsizeAddress(address)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {address}
                                    </span>
                                  </div>
                                  {isCurrentAddress && (
                                    <Check className="h-4 w-4 text-success ml-2 flex-shrink-0" />
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CanopyWalletManagement;
