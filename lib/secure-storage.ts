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
  private static readonly DB_NAME = "canopy_keyfiles";
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = "keyfiles";
  private static readonly MAX_KEYFILES = 10; // Limit storage

  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        SecureKeyfileStorage.DB_NAME,
        SecureKeyfileStorage.DB_VERSION,
      );

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(SecureKeyfileStorage.STORE_NAME)) {
          const store = db.createObjectStore(SecureKeyfileStorage.STORE_NAME, {
            keyPath: "id",
          });
          store.createIndex("filename", "filename", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });
  }

  /**
   * Store an encrypted keyfile
   */
  async storeKeyfile(filename: string, keyfileData: string): Promise<string> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Check storage limit
      const existingKeyfiles = await this.listKeyfiles();
      if (existingKeyfiles.length >= SecureKeyfileStorage.MAX_KEYFILES) {
        throw new Error(
          `Maximum ${SecureKeyfileStorage.MAX_KEYFILES} keyfiles allowed`,
        );
      }

      // Validate keyfile format and extract account addresses
      const parsedKeyfile = JSON.parse(keyfileData);
      const validationResult = validateKeyfileFormat(parsedKeyfile);
      
      if (!validationResult.isValid) {
        throw new Error(`Invalid keyfile format: ${validationResult.errors.join(', ')}`);
      }
      
      const accountAddresses = validationResult.accounts?.map(account => account.Address) || [];
      const keyfileFormat = validationResult.format || 'plain';

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

      // Store in IndexedDB
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(
          [SecureKeyfileStorage.STORE_NAME],
          "readwrite",
        );
        const store = transaction.objectStore(SecureKeyfileStorage.STORE_NAME);
        const request = store.add(storedKeyfile);

        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(new Error("Failed to store keyfile"));
      });
    } catch (error) {
      throw new Error(`Failed to store keyfile: ${error}`);
    }
  }

  /**
   * Retrieve and decrypt a keyfile
   */
  async getKeyfile(id: string): Promise<string> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [SecureKeyfileStorage.STORE_NAME],
        "readwrite",
      );
      const store = transaction.objectStore(SecureKeyfileStorage.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = async () => {
        const storedKeyfile: StoredKeyfile = request.result;

        if (!storedKeyfile) {
          reject(new Error("Keyfile not found"));
          return;
        }

        try {
          // Decrypt keyfile data
          const decryptedData = await CryptoUtils.decrypt(
            storedKeyfile.encryptedKeyfile,
          );

          // Verify integrity
          const hash = await CryptoUtils.hash(decryptedData);
          if (hash !== storedKeyfile.hash) {
            reject(new Error("Keyfile integrity check failed"));
            return;
          }

          // Update last accessed time
          storedKeyfile.lastAccessedAt = Date.now();
          store.put(storedKeyfile);

          resolve(decryptedData);
        } catch (error) {
          reject(new Error(`Failed to decrypt keyfile: ${error}`));
        }
      };

      request.onerror = () => reject(new Error("Failed to retrieve keyfile"));
    });
  }

  /**
   * List all stored keyfile metadata (without decrypting)
   */
  async listKeyfiles(): Promise<KeyfileMetadata[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [SecureKeyfileStorage.STORE_NAME],
        "readonly",
      );
      const store = transaction.objectStore(SecureKeyfileStorage.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const keyfiles: KeyfileMetadata[] = request.result.map(
          (stored: StoredKeyfile) => ({
            id: stored.id,
            filename: stored.filename,
            accountAddresses: stored.accountAddresses,
            keyfileFormat: stored.keyfileFormat || 'plain', // Fallback for old records
            createdAt: stored.createdAt,
            lastAccessedAt: stored.lastAccessedAt,
          }),
        );

        // Sort by last accessed (most recent first)
        keyfiles.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
        resolve(keyfiles);
      };

      request.onerror = () => reject(new Error("Failed to list keyfiles"));
    });
  }

  /**
   * Delete a stored keyfile
   */
  async deleteKeyfile(id: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [SecureKeyfileStorage.STORE_NAME],
        "readwrite",
      );
      const store = transaction.objectStore(SecureKeyfileStorage.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete keyfile"));
    });
  }

  /**
   * Clear all stored keyfiles (security cleanup)
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [SecureKeyfileStorage.STORE_NAME],
        "readwrite",
      );
      const store = transaction.objectStore(SecureKeyfileStorage.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to clear keyfiles"));
    });
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
      const keyfiles = await this.getAllStoredKeyfiles();
      return keyfiles.some((kf) => kf.hash === hash);
    } catch {
      return false;
    }
  }

  /**
   * Get all stored keyfiles (for internal use)
   */
  private async getAllStoredKeyfiles(): Promise<StoredKeyfile[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [SecureKeyfileStorage.STORE_NAME],
        "readonly",
      );
      const store = transaction.objectStore(SecureKeyfileStorage.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("Failed to get stored keyfiles"));
    });
  }

  /**
   * Generate unique ID for keyfile
   */
  private generateId(): string {
    return `keyfile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const secureStorage = new SecureKeyfileStorage();
