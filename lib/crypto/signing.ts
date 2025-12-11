/**
 * Multi-curve message signing
 *
 * Each curve type has a different signing algorithm.
 * This module mirrors the exact Go implementation for each curve.
 */

import { ed25519 } from "@noble/curves/ed25519.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils.js";
import { CurveType, KEY_SIZES } from "./types";

/**
 * Signs a message with the correct algorithm based on curve type
 *
 * Curve-specific implementations:
 * - Ed25519: canopy/lib/crypto/ed25519.go:60
 * - SECP256K1: canopy/lib/crypto/secp256k1.go:95-99
 * - ETHSECP256K1: Same as SECP256K1 (same parent class)
 * - BLS12381: canopy/lib/crypto/bls.go:85-88 ✅ IMPLEMENTED
 *
 * @param messageBytes - Message to sign
 * @param privateKeyHex - Hex-encoded private key
 * @param curveType - Curve type
 * @returns Hex-encoded signature
 * @throws Error if signing fails or curve is unsupported
 */
export function signMessage(
  messageBytes: Uint8Array,
  privateKeyHex: string,
  curveType: CurveType,
): string {
  const privKeyBytes = hexToBytes(privateKeyHex);

  switch (curveType) {
    case CurveType.ED25519:
      return signED25519(messageBytes, privKeyBytes);

    case CurveType.SECP256K1:
    case CurveType.ETHSECP256K1:
      return signSECP256K1(messageBytes, privKeyBytes);

    case CurveType.BLS12381:
      return signBLS12381(messageBytes, privKeyBytes);

    default:
      throw new Error(`Unsupported curve type for signing: ${curveType}`);
  }
}

/**
 * Ed25519 signing
 * Mirrors: canopy/lib/crypto/ed25519.go:60
 *
 * Algorithm:
 * - Signs the message directly (no hashing)
 * - Returns 64-byte signature
 *
 * @param messageBytes - Message to sign
 * @param privKeyBytes - Private key bytes (32 bytes)
 * @returns Hex-encoded signature (64 bytes)
 */
function signED25519(
  messageBytes: Uint8Array,
  privKeyBytes: Uint8Array,
): string {
  // Validate private key size
  if (privKeyBytes.length !== KEY_SIZES.PRIVATE.ED25519) {
    throw new Error(
      `Invalid Ed25519 private key size: ${privKeyBytes.length} bytes. ` +
        `Expected ${KEY_SIZES.PRIVATE.ED25519}.`,
    );
  }

  try {
    // Ed25519 signs the message directly (no pre-hashing)
    const signature = ed25519.sign(messageBytes, privKeyBytes);

    // Validate signature size
    if (signature.length !== KEY_SIZES.SIGNATURE.ED25519) {
      throw new Error(
        `Invalid Ed25519 signature size: ${signature.length} bytes. ` +
          `Expected ${KEY_SIZES.SIGNATURE.ED25519}.`,
      );
    }

    return bytesToHex(signature);
  } catch (error) {
    throw new Error(
      `Ed25519 signing failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * SECP256K1 signing (also used for ETHSECP256K1)
 * Mirrors: canopy/lib/crypto/secp256k1.go:95-99
 *
 * Algorithm:
 * 1. Hash the message with SHA256
 * 2. Sign the hash with secp256k1
 * 3. Return signature WITHOUT recovery byte (64 bytes)
 *
 * IMPORTANT: Go implementation removes the recovery byte:
 * ```go
 * sig, _ := ethCrypto.Sign(Hash(msg), s.PrivateKey)
 * return sig[:len(sig)-1]  // Remove last byte (recovery byte)
 * ```
 *
 * @param messageBytes - Message to sign
 * @param privKeyBytes - Private key bytes (32 bytes)
 * @returns Hex-encoded signature (64 bytes, NO recovery byte)
 */
function signSECP256K1(
  messageBytes: Uint8Array,
  privKeyBytes: Uint8Array,
): string {
  // Validate private key size
  if (privKeyBytes.length !== KEY_SIZES.PRIVATE.SECP256K1) {
    throw new Error(
      `Invalid SECP256K1 private key size: ${privKeyBytes.length} bytes. ` +
        `Expected ${KEY_SIZES.PRIVATE.SECP256K1}.`,
    );
  }

  try {
    // Step 1: Hash the message with SHA256
    const messageHash = sha256(messageBytes);

    // Step 2: Sign the hash
    const signature = secp256k1.sign(messageHash, privKeyBytes);

    // Step 3: Get raw signature bytes (r || s format, 64 bytes)
    const sigBytes = signature;

    // Validate signature size (should be 64 bytes)
    if (sigBytes.length !== KEY_SIZES.SIGNATURE.SECP256K1) {
      throw new Error(
        `Invalid SECP256K1 signature size: ${sigBytes.length} bytes. ` +
          `Expected ${KEY_SIZES.SIGNATURE.SECP256K1}.`,
      );
    }

    // Return WITHOUT recovery byte (Go removes it)
    return bytesToHex(sigBytes);
  } catch (error) {
    throw new Error(
      `SECP256K1 signing failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  return BigInt("0x" + bytesToHex(bytes));
}

/**
 * BLS12-381 signing
 * Mirrors: canopy/lib/crypto/bls.go:85-88
 *
 * Algorithm:
 * - Signs the message directly (no pre-hashing)
 * - Returns 96-byte signature
 *
 * BLS12-381 uses pairing-based cryptography which allows:
 * - Signature aggregation
 * - Threshold signatures
 * - More complex cryptographic protocols
 *
 * @param messageBytes - Message to sign
 * @param privKeyBytes - Private key bytes (32 bytes)
 * @returns Hex-encoded signature (96 bytes)
 */
function signBLS12381(
  messageBytes: Uint8Array,
  privKeyBytes: Uint8Array,
): string {
  // Validate private key size
  if (privKeyBytes.length !== KEY_SIZES.PRIVATE.BLS12381) {
    throw new Error(
      `Invalid BLS12381 private key size: ${privKeyBytes.length} bytes. ` +
        `Expected ${KEY_SIZES.PRIVATE.BLS12381}.`,
    );
  }

  try {
    const x = bytesToBigInt(privKeyBytes); // scalar

    const Hm = bls12_381.G2.hashToCurve(messageBytes);

    const sigPoint = Hm.multiply(x);

    const signature = sigPoint.toBytes(true);

    // Validate signature size (should be 96 bytes)
    if (signature.length !== KEY_SIZES.SIGNATURE.BLS12381) {
      throw new Error(
        `Invalid BLS12381 signature size: ${signature.length} bytes. ` +
          `Expected ${KEY_SIZES.SIGNATURE.BLS12381}.`,
      );
    }

    return bytesToHex(signature);
  } catch (error) {
    throw new Error(
      `BLS12381 signing failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Verifies a BLS12-381 signature
 * Mirrors: canopy/lib/crypto/bls.go:222-229
 *
 * @param messageBytes - Original message
 * @param sigBytes - Signature bytes (96 bytes)
 * @param pubKeyBytes - Public key bytes (48 bytes)
 * @returns true if valid
 */
function verifyBLS12381(
  messageBytes: Uint8Array,
  sigBytes: Uint8Array,
  pubKeyBytes: Uint8Array,
): boolean {
  // Validate sizes
  if (pubKeyBytes.length !== KEY_SIZES.PUBLIC.BLS12381) {
    throw new Error(
      `Invalid BLS12381 public key size: ${pubKeyBytes.length} bytes`,
    );
  }
  if (sigBytes.length !== KEY_SIZES.SIGNATURE.BLS12381) {
    throw new Error(
      `Invalid BLS12381 signature size: ${sigBytes.length} bytes`,
    );
  }

  try {
    const pk = bls12_381.G1.Point.fromBytes(pubKeyBytes);
    const sig = bls12_381.G2.Point.fromBytes(sigBytes);
    const Hm = bls12_381.G2.hashToCurve(messageBytes);

    const e1 = bls12_381.pairing(bls12_381.G1.Point.BASE, sig, true);
    const e2 = bls12_381.pairing(pk, Hm, true);

    return e1 === e2;
  } catch (e) {
    console.error("BLS verify error:", e);
    return false;
  }
}

/**
 * Verifies a signature against a message and public key
 *
 * @param messageBytes - Original message
 * @param signatureHex - Hex-encoded signature
 * @param publicKeyHex - Hex-encoded public key
 * @param curveType - Curve type
 * @returns true if signature is valid, false otherwise
 */
export async function verifySignature(
  messageBytes: Uint8Array,
  signatureHex: string,
  publicKeyHex: string,
  curveType: CurveType,
): Promise<boolean> {
  const sigBytes = hexToBytes(signatureHex);
  const pubKeyBytes = hexToBytes(publicKeyHex);

  try {
    switch (curveType) {
      case CurveType.ED25519:
        return verifyED25519(messageBytes, sigBytes, pubKeyBytes);

      case CurveType.SECP256K1:
      case CurveType.ETHSECP256K1:
        return verifySECP256K1(messageBytes, sigBytes, pubKeyBytes);

      case CurveType.BLS12381:
        return verifyBLS12381(messageBytes, sigBytes, pubKeyBytes);

      default:
        throw new Error(
          `Unsupported curve type for verification: ${curveType}`,
        );
    }
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Verifies an Ed25519 signature
 *
 * @param messageBytes - Original message
 * @param sigBytes - Signature bytes (64 bytes)
 * @param pubKeyBytes - Public key bytes (32 bytes)
 * @returns true if valid
 */
function verifyED25519(
  messageBytes: Uint8Array,
  sigBytes: Uint8Array,
  pubKeyBytes: Uint8Array,
): boolean {
  // Validate sizes
  if (pubKeyBytes.length !== KEY_SIZES.PUBLIC.ED25519) {
    throw new Error(
      `Invalid Ed25519 public key size: ${pubKeyBytes.length} bytes`,
    );
  }
  if (sigBytes.length !== KEY_SIZES.SIGNATURE.ED25519) {
    throw new Error(`Invalid Ed25519 signature size: ${sigBytes.length} bytes`);
  }

  return ed25519.verify(sigBytes, messageBytes, pubKeyBytes);
}

/**
 * Verifies a SECP256K1 signature
 *
 * @param messageBytes - Original message
 * @param sigBytes - Signature bytes (64 bytes)
 * @param pubKeyBytes - Public key bytes (33 bytes compressed)
 * @returns true if valid
 */
function verifySECP256K1(
  messageBytes: Uint8Array,
  sigBytes: Uint8Array,
  pubKeyBytes: Uint8Array,
): boolean {
  // Validate signature size
  if (sigBytes.length !== KEY_SIZES.SIGNATURE.SECP256K1) {
    throw new Error(
      `Invalid SECP256K1 signature size: ${sigBytes.length} bytes`,
    );
  }

  // Hash the message (same as signing)
  const messageHash = sha256(messageBytes);

  // Verify signature
  return secp256k1.verify(sigBytes, messageHash, pubKeyBytes);
}

/**
 * Derives a public key from a private key
 *
 * @param privateKeyHex - Hex-encoded private key
 * @param curveType - Curve type
 * @returns Hex-encoded public key
 * @throws Error if derivation fails or curve is unsupported
 */
export function derivePublicKey(
  privateKeyHex: string,
  curveType: CurveType,
): string {
  const privKeyBytes = hexToBytes(privateKeyHex);

  switch (curveType) {
    case CurveType.ED25519:
      return deriveED25519PublicKey(privKeyBytes);

    case CurveType.SECP256K1:
      return deriveSECP256K1PublicKey(privKeyBytes, true); // Compressed

    case CurveType.ETHSECP256K1:
      return deriveETHSECP256K1PublicKey(privKeyBytes);

    case CurveType.BLS12381:
      return deriveBLS12381PublicKey(privKeyBytes);

    default:
      throw new Error(
        `Unsupported curve type for public key derivation: ${curveType}`,
      );
  }
}

/**
 * Derives Ed25519 public key from private key
 */
function deriveED25519PublicKey(privKeyBytes: Uint8Array): string {
  if (privKeyBytes.length !== KEY_SIZES.PRIVATE.ED25519) {
    throw new Error(
      `Invalid Ed25519 private key size: ${privKeyBytes.length} bytes`,
    );
  }

  const pubKeyBytes = ed25519.getPublicKey(privKeyBytes);
  return bytesToHex(pubKeyBytes);
}

/**
 * Derives SECP256K1 public key from private key
 */
function deriveSECP256K1PublicKey(
  privKeyBytes: Uint8Array,
  compressed: boolean,
): string {
  if (privKeyBytes.length !== KEY_SIZES.PRIVATE.SECP256K1) {
    throw new Error(
      `Invalid SECP256K1 private key size: ${privKeyBytes.length} bytes`,
    );
  }

  const pubKeyBytes = secp256k1.getPublicKey(privKeyBytes, compressed);
  return bytesToHex(pubKeyBytes);
}

/**
 * Derives ETHSECP256K1 public key from private key (uncompressed)
 */
function deriveETHSECP256K1PublicKey(privKeyBytes: Uint8Array): string {
  if (privKeyBytes.length !== KEY_SIZES.PRIVATE.ETHSECP256K1) {
    throw new Error(
      `Invalid ETHSECP256K1 private key size: ${privKeyBytes.length} bytes`,
    );
  }

  // Get uncompressed public key (65 bytes with 0x04 prefix)
  const pubKeyBytesWithPrefix = secp256k1.getPublicKey(privKeyBytes, false);

  // Remove 0x04 prefix to get 64 bytes (matches Go implementation)
  const pubKeyBytes = pubKeyBytesWithPrefix.slice(1);

  return bytesToHex(pubKeyBytes);
}

/**
 * Derives BLS12-381 public key from private key
 * Mirrors: canopy/lib/crypto/bls.go:90-96
 *
 * BLS12-381 public keys are G1 points on the BLS12-381 curve
 */
function deriveBLS12381PublicKey(privKeyBytes: Uint8Array): string {
  if (privKeyBytes.length !== KEY_SIZES.PRIVATE.BLS12381) {
    throw new Error(
      `Invalid BLS12381 private key size: ${privKeyBytes.length} bytes`,
    );
  }

  try {
    // Derive BLS12-381 public key (48 bytes)
    // getPublicKey returns a Point object, need to convert to bytes
    const pubKeyPoint = bls12_381.longSignatures.getPublicKey(privKeyBytes);

    // Convert point to compressed bytes (48 bytes for G1)
    const pubKeyBytes = pubKeyPoint.toBytes(true);

    // Validate public key size
    if (pubKeyBytes.length !== KEY_SIZES.PUBLIC.BLS12381) {
      throw new Error(
        `Invalid BLS12381 public key size: ${pubKeyBytes.length} bytes. ` +
          `Expected ${KEY_SIZES.PUBLIC.BLS12381}.`,
      );
    }

    return bytesToHex(pubKeyBytes);
  } catch (error) {
    throw new Error(
      `BLS12381 public key derivation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
