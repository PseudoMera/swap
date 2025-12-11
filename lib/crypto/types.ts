/**
 * Cryptographic types for multi-curve wallet support
 *
 * Supports: Ed25519, BLS12381, SECP256K1, ETHSECP256K1
 * Mirrors Go implementation in canopy/lib/crypto
 */

/**
 * Supported elliptic curve types
 * Detection based on key byte length (mirrors Go implementation)
 */
export enum CurveType {
  ED25519 = "ed25519",
  BLS12381 = "bls12381",
  SECP256K1 = "secp256k1",
  ETHSECP256K1 = "ethsecp256k1",
}

/**
 * Key sizes for each curve type
 */
export const KEY_SIZES = {
  // Private key sizes
  PRIVATE: {
    ED25519: 32,
    BLS12381: 32,
    SECP256K1: 32,
    ETHSECP256K1: 32,
  },
  // Public key sizes
  PUBLIC: {
    ED25519: 32,
    BLS12381: 48,
    SECP256K1: 33, // Compressed
    ETHSECP256K1: 64, // Uncompressed (without 0x04 prefix)
    ETHSECP256K1_FULL: 65, // Uncompressed with 0x04 prefix
  },
  // Signature sizes
  SIGNATURE: {
    ED25519: 64,
    BLS12381: 96,
    SECP256K1: 64,
    ETHSECP256K1: 64,
  },
  // Address size (all curves)
  ADDRESS: 20,
} as const;

/**
 * Represents a blockchain key pair with curve information
 */
export interface KeyEntry {
  privateKeyHex: string; // Hex-encoded private key
  publicKeyHex: string; // Hex-encoded public key
  address: string; // Derived address (20 bytes hex)
  curveType: CurveType; // Curve type for this key
  nickname?: string; // Optional nickname
  createdAt: number; // Timestamp
}

/**
 * Encrypted key entry for secure storage
 * Mirrors Go EncryptedPrivateKey structure
 */
export interface EncryptedKeyEntry {
  publicKeyHex: string; // Hex-encoded public key
  encryptedPrivateKey: string; // AES-GCM encrypted private key
  salt: string; // Hex-encoded salt for Argon2 KDF
  address: string; // Derived address
  curveType: CurveType; // Curve type
  nickname?: string; // Optional nickname
  createdAt: number; // Timestamp
}

/**
 * Transaction signature structure
 */
export interface TransactionSignature {
  publicKey: string; // Hex-encoded public key
  signature: string; // Hex-encoded signature
}

/**
 * Message payload for transactions
 * Union of all supported message types
 */
export type TransactionMessage =
  | MessageSendParams
  | MessageCreateOrderParams
  | MessageEditOrderParams
  | MessageDeleteOrderParams;

/**
 * Raw transaction structure (matches Go lib.Transaction)
 */
export interface RawTransaction {
  type: string; // Message type (e.g., "MessageSend")
  msg: TransactionMessage; // Message payload
  signature: TransactionSignature; // Signature + public key
  time: number; // Unix microseconds
  createdHeight: number; // Blockchain height
  fee: number; // Transaction fee
  memo?: string; // Optional memo
  networkID: number; // Network identifier
  chainID: number; // Chain identifier
}

/**
 * Parameters for building a transaction
 */
export interface TransactionParams {
  type: string; // Type of message
  msg: TransactionMessage; // Message payload
  fee: number; // Transaction fee
  memo?: string; // Optional memo
  networkID: number; // Network ID
  chainID: number; // Chain ID
  height: number; // Current blockchain height
}

// ============================================================================
// MESSAGE TYPE DEFINITIONS
// All message types mirror canopy-newest-version/lib/.proto/message.proto
// ============================================================================

/**
 * MessageSend - Standard token transfer
 * Proto: message.proto:26-33
 */
export interface MessageSendParams {
  fromAddress: string; // Hex-encoded sender address (no 0x)
  toAddress: string; // Hex-encoded recipient address (no 0x)
  amount: number; // Amount in micro units
}

/**
 * MessageCreateOrder - DEX legacy create order
 * Proto: message.proto:172-187
 */
export interface MessageCreateOrderParams {
  chainId: number; // Committee chain ID
  data: string; // Hex-encoded order data
  amountForSale: number; // Amount selling
  requestedAmount: number; // Amount requesting
  sellerReceiveAddress: string; // Hex-encoded receive address
  sellersSendAddress: string; // Hex-encoded send address
  orderId?: string; // Auto-populated, omit
}

/**
 * MessageEditOrder - DEX legacy edit order
 * Proto: message.proto:192-208
 */
export interface MessageEditOrderParams {
  orderId: string; // Hex-encoded order ID
  chainId: number; // Committee chain ID
  data: string; // Hex-encoded order data
  amountForSale: number; // New amount selling
  requestedAmount: number; // New amount requesting
  sellerReceiveAddress: string; // Hex-encoded receive address
}

/**
 * MessageDeleteOrder - DEX legacy delete order
 * Proto: message.proto:212-217
 */
export interface MessageDeleteOrderParams {
  orderId: string; // Hex-encoded order ID
  chainId: number; // Committee chain ID
}
