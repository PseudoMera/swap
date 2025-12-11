/**
 * ED25519 keypair generation utilities
 */

import { ed25519 } from "@noble/curves/ed25519.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

/**
 * Generates a new random ED25519 keypair
 *
 * @returns Object with privateKey and publicKey as hex strings
 */
export function generateED25519Keypair(): {
  privateKey: string;
  publicKey: string;
} {
  // Generate 32 random bytes for private key using Web Crypto API
  const privateKeyBytes = new Uint8Array(32);
  crypto.getRandomValues(privateKeyBytes);

  // Derive public key
  const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);

  return {
    privateKey: bytesToHex(privateKeyBytes),
    publicKey: bytesToHex(publicKeyBytes),
  };
}

/**
 * Derives the public key from a private key
 *
 * @param privateKeyHex - Hex-encoded ED25519 private key (32 bytes / 64 hex chars)
 * @returns Hex-encoded public key
 */
export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  const privateKeyBytes = hexToBytes(privateKeyHex);
  const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);
  return bytesToHex(publicKeyBytes);
}

/**
 * Validates an ED25519 private key
 *
 * @param privateKeyHex - Hex-encoded private key to validate
 * @returns true if valid
 */
export function isValidPrivateKey(privateKeyHex: string): boolean {
  try {
    const privateKeyBytes = hexToBytes(privateKeyHex);
    if (privateKeyBytes.length !== 32) {
      return false;
    }
    // Try to derive public key - if this works, key is valid
    ed25519.getPublicKey(privateKeyBytes);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an ED25519 public key
 *
 * @param publicKeyHex - Hex-encoded public key to validate
 * @returns true if valid
 */
export function isValidPublicKey(publicKeyHex: string): boolean {
  try {
    const publicKeyBytes = hexToBytes(publicKeyHex);
    return publicKeyBytes.length === 32;
  } catch {
    return false;
  }
}
