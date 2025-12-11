/**
 * Multi-curve address derivation
 *
 * Each curve type has a different address derivation algorithm.
 * This module mirrors the exact Go implementation for each curve.
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils.js';
import { CurveType, KEY_SIZES } from './types';
import {ripemd160} from "@noble/hashes/legacy.js";

/**
 * Derives a blockchain address from a public key
 * MUST match the Go implementation exactly for each curve type
 *
 * Curve-specific implementations:
 * - Ed25519: canopy/lib/crypto/ed25519.go:104-111
 * - BLS12381: canopy/lib/crypto/bls.go:181-188
 * - SECP256K1: canopy/lib/crypto/secp256k1.go:162-167
 * - ETHSECP256K1: canopy/lib/crypto/eth_secp256k1.go:90-92
 *
 * @param publicKeyHex - Hex-encoded public key
 * @param curveType - Curve type for this key
 * @returns Hex-encoded address (20 bytes, NO 0x prefix)
 * @throws Error if curve type is unsupported
 */
export function deriveAddress(publicKeyHex: string, curveType: CurveType): string {
  const pubKeyBytes = hexToBytes(publicKeyHex);

  switch (curveType) {
    case CurveType.ED25519:
      return deriveED25519Address(pubKeyBytes);

    case CurveType.BLS12381:
      return deriveBLS12381Address(pubKeyBytes);

    case CurveType.SECP256K1:
      return deriveSECP256K1Address(pubKeyBytes);

    case CurveType.ETHSECP256K1:
      return deriveETHSECP256K1Address(pubKeyBytes);

    default:
      throw new Error(`Unsupported curve type for address derivation: ${curveType}`);
  }
}

/**
 * Ed25519 address derivation
 * Mirrors: canopy/lib/crypto/ed25519.go:104-111
 *
 * Algorithm:
 * 1. Hash the public key with SHA256
 * 2. Take first 20 bytes of hash
 *
 * @param pubKeyBytes - Public key bytes (32 bytes)
 * @returns Hex-encoded address (20 bytes)
 */
function deriveED25519Address(pubKeyBytes: Uint8Array): string {
  // Validate key size
  if (pubKeyBytes.length !== KEY_SIZES.PUBLIC.ED25519) {
    throw new Error(
      `Invalid Ed25519 public key size: ${pubKeyBytes.length} bytes. Expected ${KEY_SIZES.PUBLIC.ED25519}.`
    );
  }

  // Hash the public key
  const pubHash = sha256(pubKeyBytes);

  // Take first 20 bytes of hash
  const address = pubHash.slice(0, KEY_SIZES.ADDRESS);

  // Return as hex WITHOUT 0x prefix
  return bytesToHex(address);
}

/**
 * BLS12381 address derivation
 * Mirrors: canopy/lib/crypto/bls.go:181-188
 *
 * Algorithm:
 * 1. Hash the public key with SHA256
 * 2. Take first 20 bytes of hash
 *
 * @param pubKeyBytes - Public key bytes (48 bytes)
 * @returns Hex-encoded address (20 bytes)
 */
function deriveBLS12381Address(pubKeyBytes: Uint8Array): string {
  // Validate key size
  if (pubKeyBytes.length !== KEY_SIZES.PUBLIC.BLS12381) {
    throw new Error(
      `Invalid BLS12381 public key size: ${pubKeyBytes.length} bytes. Expected ${KEY_SIZES.PUBLIC.BLS12381}.`
    );
  }

  // Hash the public key
  const pubHash = sha256(pubKeyBytes);

  // Take first 20 bytes of hash
  const address = pubHash.slice(0, KEY_SIZES.ADDRESS);

  // Return as hex WITHOUT 0x prefix
  return bytesToHex(address);
}

/**
 * SECP256K1 address derivation
 * Mirrors: canopy/lib/crypto/secp256k1.go:162-167
 *
 * Algorithm:
 * 1. Hash the public key with SHA256
 * 2. Hash the result with RIPEMD160
 * 3. Use all 20 bytes of RIPEMD160 output
 *
 * This is the Bitcoin/Cosmos/Tendermint addressing scheme:
 * RIPEMD160(SHA256(pubkey))
 *
 * @param pubKeyBytes - Compressed public key bytes (33 bytes)
 * @returns Hex-encoded address (20 bytes)
 */
function deriveSECP256K1Address(pubKeyBytes: Uint8Array): string {
  // Validate key size (compressed)
  if (pubKeyBytes.length !== KEY_SIZES.PUBLIC.SECP256K1) {
    throw new Error(
      `Invalid SECP256K1 public key size: ${pubKeyBytes.length} bytes. ` +
      `Expected ${KEY_SIZES.PUBLIC.SECP256K1} (compressed).`
    );
  }

  // First hash: SHA256
  const sha = sha256(pubKeyBytes);

  // Second hash: RIPEMD160
  const ripemd = ripemd160(sha);

  // Use all 20 bytes
  return bytesToHex(ripemd);
}

/**
 * ETHSECP256K1 address derivation
 * Mirrors: canopy/lib/crypto/eth_secp256k1.go:90-92
 *
 * Algorithm:
 * 1. Hash the public key with Keccak256
 * 2. Take LAST 20 bytes (bytes 12-31)
 *
 * This is the Ethereum addressing scheme.
 * NOTE: Ethereum uses uncompressed public keys (64 bytes without 0x04 prefix)
 *
 * @param pubKeyBytes - Uncompressed public key bytes (64 or 65 bytes)
 * @returns Hex-encoded address (20 bytes, NO 0x prefix)
 */
function deriveETHSECP256K1Address(pubKeyBytes: Uint8Array): string {
  let keyBytes = pubKeyBytes;

  // If key has 0x04 prefix (65 bytes), remove it
  if (pubKeyBytes.length === KEY_SIZES.PUBLIC.ETHSECP256K1_FULL) {
    if (pubKeyBytes[0] !== 0x04) {
      throw new Error(
        `Invalid ETHSECP256K1 public key: 65-byte key must start with 0x04 prefix.`
      );
    }
    keyBytes = pubKeyBytes.slice(1);
  }

  // Validate key size (should be 64 bytes now)
  if (keyBytes.length !== KEY_SIZES.PUBLIC.ETHSECP256K1) {
    throw new Error(
      `Invalid ETHSECP256K1 public key size: ${keyBytes.length} bytes. ` +
      `Expected ${KEY_SIZES.PUBLIC.ETHSECP256K1} or ${KEY_SIZES.PUBLIC.ETHSECP256K1_FULL}.`
    );
  }

  // Hash with Keccak256
  const keccak = keccak_256(keyBytes);

  // Take LAST 20 bytes (bytes 12-31)
  const address = keccak.slice(12, 32);

  // Return as hex WITHOUT 0x prefix (to match Go implementation)
  return bytesToHex(address);
}

/**
 * Validates a blockchain address format
 *
 * Valid format:
 * - Exactly 40 hexadecimal characters (20 bytes)
 * - NO 0x prefix (matches Go implementation)
 *
 * @param address - Address to validate
 * @returns true if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  if (!address) {
    return false;
  }

  // Check length (40 hex chars = 20 bytes)
  if (address.length !== 40) {
    return false;
  }

  // Check if all characters are valid hex (0-9, a-f, A-F)
  const hexRegex = /^[0-9a-fA-F]{40}$/;
  return hexRegex.test(address);
}

/**
 * Normalizes an address to lowercase
 *
 * @param address - Address to normalize
 * @returns Normalized address (lowercase, no 0x prefix)
 * @throws Error if address is invalid
 */
export function normalizeAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error('Invalid address format: must be 40 hex characters without 0x prefix');
  }

  return address.toLowerCase();
}

/**
 * Compares two addresses for equality (case-insensitive)
 *
 * @param address1 - First address
 * @param address2 - Second address
 * @returns true if addresses are equal, false otherwise
 */
export function addressesEqual(address1: string, address2: string): boolean {
  try {
    const normalized1 = normalizeAddress(address1);
    const normalized2 = normalizeAddress(address2);
    return normalized1 === normalized2;
  } catch {
    return false;
  }
}
