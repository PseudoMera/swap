/**
 * Curve type detection based on key byte length
 *
 * Mirrors Go implementation in canopy/lib/crypto/key.go
 * The Go backend does NOT store curve type explicitly - it detects from byte length
 */

import { hexToBytes } from "@noble/hashes/utils.js";
import { CurveType, KEY_SIZES } from "./types";

/**
 * Detects curve type from private key bytes
 * Mirrors canopy/lib/crypto/key.go:120-133 (NewPrivateKeyFromBytes)
 *
 * @param privateKeyHex - Hex-encoded private key
 * @returns Detected curve type
 * @throws Error if key format is not recognized
 */
export function detectPrivateKeyCurve(privateKeyHex: string): CurveType {
  const bytes = hexToBytes(privateKeyHex);

  switch (bytes.length) {
    case 32:
      // Could be BLS12381 or Ed25519
      // Go tries BLS12381 first, falls back to Ed25519
      // For frontend, we default to Ed25519 (most common)
      // To properly detect BLS, we'd need to try deserializing
      return CurveType.ED25519;

    case 64:
      // Ed25519 extended private key format
      return CurveType.ED25519;

    default:
      throw new Error(
        `Unrecognized private key format: ${bytes.length} bytes. ` +
          `Expected 32 (Ed25519/BLS12381) or 64 (Ed25519 extended).`,
      );
  }
}

/**
 * Detects curve type from public key bytes
 * Mirrors canopy/lib/crypto/key.go:88-98 (NewPublicKeyFromBytes)
 *
 * @param publicKeyHex - Hex-encoded public key
 * @returns Detected curve type
 * @throws Error if key format is not recognized
 */
export function detectPublicKeyCurve(publicKeyHex: string): CurveType {
  const bytes = hexToBytes(publicKeyHex);

  switch (bytes.length) {
    case KEY_SIZES.PUBLIC.ED25519:
      return CurveType.ED25519;

    case KEY_SIZES.PUBLIC.SECP256K1:
      return CurveType.SECP256K1;

    case KEY_SIZES.PUBLIC.BLS12381:
      return CurveType.BLS12381;

    case KEY_SIZES.PUBLIC.ETHSECP256K1:
    case KEY_SIZES.PUBLIC.ETHSECP256K1_FULL:
      return CurveType.ETHSECP256K1;

    default:
      throw new Error(
        `Unrecognized public key format: ${bytes.length} bytes. ` +
          `Expected 32 (Ed25519), 33 (SECP256K1), 48 (BLS12381), or 64-65 (ETHSECP256K1).`,
      );
  }
}

/**
 * Validates that a private key is the correct length for its curve type
 *
 * @param privateKeyHex - Hex-encoded private key
 * @param curveType - Expected curve type
 * @returns true if valid
 * @throws Error if invalid
 */
export function validatePrivateKeyForCurve(
  privateKeyHex: string,
  curveType: CurveType,
): boolean {
  const bytes = hexToBytes(privateKeyHex);
  const expectedSize =
    KEY_SIZES.PRIVATE[
      curveType.toUpperCase() as keyof typeof KEY_SIZES.PRIVATE
    ];

  if (bytes.length !== expectedSize) {
    throw new Error(
      `Invalid private key size for ${curveType}: ${bytes.length} bytes. ` +
        `Expected ${expectedSize} bytes.`,
    );
  }

  return true;
}

/**
 * Validates that a public key is the correct length for its curve type
 *
 * @param publicKeyHex - Hex-encoded public key
 * @param curveType - Expected curve type
 * @returns true if valid
 * @throws Error if invalid
 */
export function validatePublicKeyForCurve(
  publicKeyHex: string,
  curveType: CurveType,
): boolean {
  const bytes = hexToBytes(publicKeyHex);
  const expectedSizes: number[] = [];

  switch (curveType) {
    case CurveType.ED25519:
      expectedSizes.push(KEY_SIZES.PUBLIC.ED25519);
      break;

    case CurveType.SECP256K1:
      expectedSizes.push(KEY_SIZES.PUBLIC.SECP256K1);
      break;

    case CurveType.BLS12381:
      expectedSizes.push(KEY_SIZES.PUBLIC.BLS12381);
      break;

    case CurveType.ETHSECP256K1:
      expectedSizes.push(KEY_SIZES.PUBLIC.ETHSECP256K1);
      expectedSizes.push(KEY_SIZES.PUBLIC.ETHSECP256K1_FULL);
      break;
  }

  if (!expectedSizes.includes(bytes.length)) {
    throw new Error(
      `Invalid public key size for ${curveType}: ${bytes.length} bytes. ` +
        `Expected ${expectedSizes.join(" or ")} bytes.`,
    );
  }

  return true;
}

/**
 * Attempts to detect curve type from either private or public key
 * Tries public key first (more deterministic), falls back to private key
 *
 * @param privateKeyHex - Optional hex-encoded private key
 * @param publicKeyHex - Optional hex-encoded public key
 * @returns Detected curve type
 * @throws Error if both keys are missing or unrecognized
 */
export function detectCurveType(
  privateKeyHex?: string,
  publicKeyHex?: string,
): CurveType {
  // Try public key first (more deterministic detection)
  if (publicKeyHex) {
    try {
      return detectPublicKeyCurve(publicKeyHex);
    } catch (error) {
      // Fall through to private key detection
      throw error;
    }
  }

  // Fall back to private key
  if (privateKeyHex) {
    return detectPrivateKeyCurve(privateKeyHex);
  }

  throw new Error("No valid key provided for curve detection");
}
