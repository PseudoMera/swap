/**
 * Multi-curve cryptography module for Canopy blockchain
 *
 * This module provides complete support for all curve types used in Canopy:
 * - Ed25519 (most common)
 * - BLS12381 (consensus/validators)
 * - SECP256K1 (Bitcoin-style, compressed)
 * - ETHSECP256K1 (Ethereum-style, uncompressed)
 *
 * Features:
 * - Automatic curve type detection from key bytes
 * - Correct address derivation for each curve type
 * - Correct signing algorithm for each curve type
 * - Multi-curve transaction signing
 */

// Type definitions
export { CurveType, KEY_SIZES } from "./types";
export type {
  KeyEntry,
  EncryptedKeyEntry,
  TransactionParams,
  TransactionMessage,
  TransactionSignature,
  RawTransaction,
} from "./types";

// Curve detection
export {
  detectPrivateKeyCurve,
  detectPublicKeyCurve,
  detectCurveType,
  validatePrivateKeyForCurve,
  validatePublicKeyForCurve,
} from "./curve-detection";

// Address derivation
export {
  deriveAddress,
  isValidAddress,
  normalizeAddress,
  addressesEqual,
} from "./address";

// Signing and verification
export { signMessage, verifySignature, derivePublicKey } from "./signing";

// Protobuf encoding (required for signature verification)
export {
  getSignBytesProtobuf,
  encodeMessageSend,
  encodeSignedTransaction,
  // debugProtobufEncoding,
} from "./protobuf";

// Transaction building
export {
  createAndSignTransaction,
  createSendMessage,
  createOrderMessage,
  validateTransactionParams,
  estimateTransactionSize,
  getTransactionHash,
} from "./transaction";

// Re-export wallet functions (backward compatibility)
export { encryptPrivateKey, decryptPrivateKey, verifyPassword } from "./wallet";
