/**
 * Secure IndexedDB storage for encrypted keyfiles
 */

import { CryptoUtils, type EncryptedData } from "./crypto";
import type { CanopyKeyfile, KeyfileFormat } from "@/types/wallet";
import { validateKeyfileFormat } from "@/utils/keyfile-validation";

export interface StoredKeyfile {
  id: string;
  filename: string;
  encryptedKeyfile: EncryptedData;
  accountAddresses: string[]; // Addresses for display
  keyfileFormat: KeyfileFormat; // Track which format this keyfile uses
  createdAt: number;
  lastAccessedAt: number;
  hash: string; // Integrity check
}

export interface KeyfileMetadata {
  id: string;
  filename: string;
  accountAddresses: string[];
  keyfileFormat: KeyfileFormat;
  createdAt: number;
  lastAccessedAt: number;
}

export class SecureKeyfileStorage {
  private static readonly STORAGE_KEY = "canopy_keyfiles";
  private static readonly MAX_KEYFILES = 10; // Limit storage

  /**
   * Initialize storage (no-op for localStorage, kept for compatibility)
   */
  async init(): Promise<void> {
    // No initialization needed for localStorage
    return Promise.resolve();
  }

  /**
   * Get all stored keyfiles from localStorage
   */
  private getAllStoredKeyfiles(): StoredKeyfile[] {
    try {
      const data = localStorage.getItem(SecureKeyfileStorage.STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to parse stored keyfiles:", error);
      return [];
    }
  }

  /**
   * Save all keyfiles to localStorage
   */
  private saveAllKeyfiles(keyfiles: StoredKeyfile[]): void {
    localStorage.setItem(
      SecureKeyfileStorage.STORAGE_KEY,
      JSON.stringify(keyfiles),
    );
  }

  /**
   * Store an encrypted keyfile
   */
  async storeKeyfile(filename: string, keyfileData: string): Promise<string> {
    try {
      // Check storage limit
      const existingKeyfiles = this.getAllStoredKeyfiles();
      if (existingKeyfiles.length >= SecureKeyfileStorage.MAX_KEYFILES) {
        throw new Error(
          `Maximum ${SecureKeyfileStorage.MAX_KEYFILES} keyfiles allowed`,
        );
      }

      // Validate keyfile format and extract account addresses
      const parsedKeyfile = JSON.parse(keyfileData);
      const validationResult = validateKeyfileFormat(parsedKeyfile);

      if (!validationResult.isValid) {
        throw new Error(
          `Invalid keyfile format: ${validationResult.errors.join(", ")}`,
        );
      }

      const accountAddresses =
        validationResult.accounts?.map((account) => account.Address) || [];
      const keyfileFormat = validationResult.format || "plain";

      // Encrypt keyfile data
      const encryptedKeyfile = await CryptoUtils.encrypt(keyfileData);

      // Generate hash for integrity
      const hash = await CryptoUtils.hash(keyfileData);

      // Create storage record
      const id = this.generateId();
      const now = Date.now();

      const storedKeyfile: StoredKeyfile = {
        id,
        filename,
        encryptedKeyfile,
        accountAddresses,
        keyfileFormat,
        createdAt: now,
        lastAccessedAt: now,
        hash,
      };

      // Add to existing keyfiles and save
      existingKeyfiles.push(storedKeyfile);
      this.saveAllKeyfiles(existingKeyfiles);

      return id;
    } catch (error) {
      throw new Error(`Failed to store keyfile: ${error}`);
    }
  }

  /**
   * Retrieve and decrypt a keyfile
   */
  async getKeyfile(id: string): Promise<string> {
    try {
      const keyfiles = this.getAllStoredKeyfiles();
      const storedKeyfile = keyfiles.find((kf) => kf.id === id);

      if (!storedKeyfile) {
        throw new Error("Keyfile not found");
      }

      // Decrypt keyfile data
      const decryptedData = await CryptoUtils.decrypt(
        storedKeyfile.encryptedKeyfile,
      );

      // Verify integrity
      const hash = await CryptoUtils.hash(decryptedData);
      if (hash !== storedKeyfile.hash) {
        throw new Error("Keyfile integrity check failed");
      }

      // Update last accessed time
      storedKeyfile.lastAccessedAt = Date.now();
      this.saveAllKeyfiles(keyfiles);

      return decryptedData;
    } catch (error) {
      throw new Error(`Failed to retrieve keyfile: ${error}`);
    }
  }

  /**
   * List all stored keyfile metadata (without decrypting)
   */
  async listKeyfiles(): Promise<KeyfileMetadata[]> {
    try {
      const storedKeyfiles = this.getAllStoredKeyfiles();
      const keyfiles: KeyfileMetadata[] = storedKeyfiles.map(
        (stored: StoredKeyfile) => ({
          id: stored.id,
          filename: stored.filename,
          accountAddresses: stored.accountAddresses,
          keyfileFormat: stored.keyfileFormat || "plain", // Fallback for old records
          createdAt: stored.createdAt,
          lastAccessedAt: stored.lastAccessedAt,
        }),
      );

      // Sort by last accessed (most recent first)
      keyfiles.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
      return keyfiles;
    } catch (error) {
      throw new Error(`Failed to list keyfiles: ${error}`);
    }
  }

  /**
   * Delete a stored keyfile
   */
  async deleteKeyfile(id: string): Promise<void> {
    try {
      const keyfiles = this.getAllStoredKeyfiles();
      const filtered = keyfiles.filter((kf) => kf.id !== id);
      this.saveAllKeyfiles(filtered);
    } catch (error) {
      throw new Error(`Failed to delete keyfile: ${error}`);
    }
  }

  /**
   * Clear all stored keyfiles (security cleanup)
   */
  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(SecureKeyfileStorage.STORAGE_KEY);
    } catch (error) {
      throw new Error(`Failed to clear keyfiles: ${error}`);
    }
  }

  /**
   * Get parsed keyfile data with proper format handling
   */
  async getParsedKeyfile(id: string): Promise<{
    accounts: CanopyKeyfile[];
    format: KeyfileFormat;
    raw: string;
  }> {
    const decryptedData = await this.getKeyfile(id);
    const parsedData = JSON.parse(decryptedData);
    const validationResult = validateKeyfileFormat(parsedData);
    
    if (!validationResult.isValid) {
      throw new Error(`Stored keyfile is corrupted: ${validationResult.errors.join(', ')}`);
    }
    
    return {
      accounts: validationResult.accounts || [],
      format: validationResult.format || 'plain',
      raw: decryptedData
    };
  }

  /**
   * Get a specific account from a keyfile by address
   */
  async getAccountFromKeyfile(keyfileId: string, address: string): Promise<CanopyKeyfile | null> {
    try {
      const { accounts } = await this.getParsedKeyfile(keyfileId);
      return accounts.find(account => account.Address === address) || null;
    } catch (error) {
      console.error('Failed to get account from keyfile:', error);
      return null;
    }
  }

  /**
   * Check if a keyfile with the same content already exists
   */
  async keyfileExists(keyfileData: string): Promise<boolean> {
    try {
      const hash = await CryptoUtils.hash(keyfileData);
      const keyfiles = this.getAllStoredKeyfiles();
      return keyfiles.some((kf) => kf.hash === hash);
    } catch {
      return false;
    }
  }

  /**
   * Generate unique ID for keyfile
   */
  private generateId(): string {
    return `keyfile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close storage (no-op for localStorage, kept for compatibility)
   */
  close(): void {
    // No cleanup needed for localStorage
  }
}

// Singleton instance
export const secureStorage = new SecureKeyfileStorage();
