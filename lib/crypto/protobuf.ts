/**
 * Protobuf serialization for Canopy transactions
 *
 * This module provides EXACT protobuf encoding compatible with Canopy Go implementation.
 * The sign bytes must match EXACTLY what the backend generates, or signature verification fails.
 *
 * CRITICAL: The backend omits fields with default values from protobuf encoding.
 * We MUST do the same or the bytes won't match and signatures will be invalid.
 *
 * Protobuf default values that are OMITTED:
 * - string: "" (empty string)
 * - bytes: [] (empty Uint8Array or zero-length)
 * - int/uint: 0
 * - bool: false
 * - repeated: [] (empty array)
 *
 * References:
 * - canopy/lib/.proto/tx.proto - Transaction structure
 * - canopy/lib/.proto/message.proto - Message structures
 * - canopy/lib/tx.go:149-162 - GetSignBytes() implementation
 * - canopy-newest-version/fsm/message.pb.go - All message type definitions
 *
 * SUPPORTED MESSAGE TYPES (16 total):
 *
 * ┌─ Transfer ────────────────────────────────────────────────────────────┐
 * │ • MessageSend - Standard token transfer                               │
 * └───────────────────────────────────────────────────────────────────────┘
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ DEX ──────────────────────────────────────────────────────────┐
 * │ • MessageCreateOrder - Create token swap order                        │
 * │ • MessageEditOrder - Edit existing order                              │
 * │ • MessageDeleteOrder - Delete order                                   │
 * └───────────────────────────────────────────────────────────────────────┘
 */

import protobuf from "protobufjs";
import { hexToBytes } from "@noble/hashes/utils.js";
import type {
  MessageCreateOrderParams,
  MessageDeleteOrderParams,
  MessageEditOrderParams,
  MessageSendParams,
  TransactionMessage,
} from "./types";

/**
 * Helper function to check if a value should be omitted from protobuf encoding
 * (i.e., it's a default value that the backend would omit)
 */
function shouldOmit(
  value: string | Uint8Array | number | boolean | undefined | null,
): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value === "") return true;
  if (value instanceof Uint8Array && value.length === 0) return true;
  if (typeof value === "number" && value === 0) return true;
  if (typeof value === "boolean" && !value) return true;
  return Array.isArray(value) && value.length === 0;
}

/**
 * Protobuf root containing all message definitions
 * Created dynamically to avoid need for .proto file compilation
 *
 * ALL field IDs and types MUST match canopy/fsm/message.pb.go exactly
 */
const root = protobuf.Root.fromJSON({
  nested: {
    types: {
      nested: {
        // Transaction message (from tx.proto)
        Transaction: {
          fields: {
            message_type: { type: "string", id: 1 },
            msg: { type: "google.protobuf.Any", id: 2 },
            signature: { type: "Signature", id: 3 },
            created_height: { type: "uint64", id: 4 },
            time: { type: "uint64", id: 5 },
            fee: { type: "uint64", id: 6 },
            memo: { type: "string", id: 7 },
            network_id: { type: "uint64", id: 8 },
            chain_id: { type: "uint64", id: 9 },
          },
        },
        // Signature message (from tx.proto)
        Signature: {
          fields: {
            public_key: { type: "bytes", id: 1 },
            signature: { type: "bytes", id: 2 },
          },
        },
        // MessageSend - Standard token transfer
        MessageSend: {
          fields: {
            from_address: { type: "bytes", id: 1 },
            to_address: { type: "bytes", id: 2 },
            amount: { type: "uint64", id: 3 },
          },
        },
        // MessageCreateOrder - DEX create sell order
        MessageCreateOrder: {
          fields: {
            ChainId: { type: "uint64", id: 1 },
            data: { type: "bytes", id: 2 },
            AmountForSale: { type: "uint64", id: 3 },
            RequestedAmount: { type: "uint64", id: 4 },
            SellerReceiveAddress: { type: "bytes", id: 5 },
            SellersSendAddress: { type: "bytes", id: 6 },
            OrderId: { type: "bytes", id: 7 },
          },
        },
        // MessageEditOrder - DEX edit sell order
        MessageEditOrder: {
          fields: {
            OrderId: { type: "bytes", id: 1 },
            ChainId: { type: "uint64", id: 2 },
            data: { type: "bytes", id: 3 },
            AmountForSale: { type: "uint64", id: 4 },
            RequestedAmount: { type: "uint64", id: 5 },
            SellerReceiveAddress: { type: "bytes", id: 6 },
          },
        },
        // MessageDeleteOrder - DEX delete sell order
        MessageDeleteOrder: {
          fields: {
            OrderId: { type: "bytes", id: 1 },
            ChainId: { type: "uint64", id: 2 },
          },
        },
      },
    },
    google: {
      nested: {
        protobuf: {
          nested: {
            // google.protobuf.Any
            Any: {
              fields: {
                type_url: { type: "string", id: 1 },
                value: { type: "bytes", id: 2 },
              },
            },
          },
        },
      },
    },
  },
});

// Lookup all message types
const Transaction = root.lookupType("types.Transaction");
const MessageSend = root.lookupType("types.MessageSend");
const MessageCreateOrder = root.lookupType("types.MessageCreateOrder");
const MessageEditOrder = root.lookupType("types.MessageEditOrder");
const MessageDeleteOrder = root.lookupType("types.MessageDeleteOrder");

/**
 * Creates a google.protobuf.Any from a message
 * Mirrors: canopy/lib/util.go:354-364 (NewAny function)
 *
 * @param messageTypeName - Fully qualified type name (e.g., "types.MessageSend")
 * @param messageBytes - Protobuf-encoded message bytes
 * @returns google.protobuf.Any object
 */
function createAny(messageTypeName: string, messageBytes: Uint8Array) {
  return {
    type_url: `type.googleapis.com/${messageTypeName}`,
    value: messageBytes,
  };
}

// ============================================================================
// MESSAGE ENCODING FUNCTIONS
// Each function encodes a specific message type to protobuf bytes
// ============================================================================

/**
 * Encodes MessageSend - Standard token transfer
 */
export function encodeMessageSend(params: MessageSendParams): Uint8Array {
  const message = MessageSend.create({
    from_address: hexToBytes(params.fromAddress),
    to_address: hexToBytes(params.toAddress),
    amount: params.amount,
  });
  return MessageSend.encode(message).finish();
}

/**
 * Encodes MessageCreateOrder - DEX create sell order
 *
 * Backend reference: canopy/fsm/transaction.go:367-374
 * Fields included: ChainId, Data, AmountForSale, RequestedAmount, SellerReceiveAddress, SellersSendAddress
 * Fields NEVER included: OrderId (backend never sets this, gets auto-populated)
 */
export function encodeMessageCreateOrder(
  params: MessageCreateOrderParams,
): Uint8Array {
  const messageData = {
    ChainId: params.chainId, // Always include
    data: hexToBytes(params.data), // Always include
    AmountForSale: params.amountForSale,
    RequestedAmount: params.requestedAmount,
    SellerReceiveAddress: hexToBytes(params.sellerReceiveAddress),
    SellersSendAddress: hexToBytes(params.sellersSendAddress),
  };

  // NEVER include OrderId - backend never sets this field
  const message = MessageCreateOrder.create(messageData);
  return MessageCreateOrder.encode(message).finish();
}

/**
 * Encodes MessageEditOrder - DEX edit sell order
 *
 * Backend reference: canopy/fsm/transaction.go:383-390
 * Fields included: OrderId, ChainId, Data, AmountForSale, RequestedAmount, SellerReceiveAddress
 */
export function encodeMessageEditOrder(
  params: MessageEditOrderParams,
): Uint8Array {
  const messageData = {
    OrderId: hexToBytes(params.orderId),
    ChainId: params.chainId, // Always include
    data: hexToBytes(params.data), // Always include
    AmountForSale: params.amountForSale,
    RequestedAmount: params.requestedAmount,
    SellerReceiveAddress: hexToBytes(params.sellerReceiveAddress),
  };

  const message = MessageEditOrder.create(messageData);
  return MessageEditOrder.encode(message).finish();
}

/**
 * Encodes MessageDeleteOrder - DEX delete sell order
 *
 * Backend reference: canopy/fsm/transaction.go:399-402
 * Fields included: OrderId, ChainId
 */
export function encodeMessageDeleteOrder(
  params: MessageDeleteOrderParams,
): Uint8Array {
  const messageData = {
    OrderId: hexToBytes(params.orderId),
    ChainId: params.chainId, // Always include
  };

  const message = MessageDeleteOrder.create(messageData);
  return MessageDeleteOrder.encode(message).finish();
}

// ============================================================================
// TRANSACTION SIGN BYTES GENERATION
// ============================================================================

/**
 * Gets the canonical sign bytes for a transaction
 * Mirrors: canopy/lib/tx.go:149-162 (GetSignBytes function)
 *
 * CRITICAL: This MUST produce the EXACT same bytes as the Go implementation,
 * or signature verification will fail.
 *
 * The sign bytes are the protobuf-encoded transaction WITHOUT the signature field.
 *
 * @param tx - Unsigned transaction object
 * @returns Protobuf-encoded sign bytes
 */
export function getSignBytesProtobuf(tx: {
  type: string;
  msg: TransactionMessage;
  time: number;
  createdHeight: number;
  fee: number;
  memo?: string;
  networkID: number;
  chainID: number;
}): Uint8Array {
  // Step 1: Encode the message payload based on type
  let msgBytes: Uint8Array;
  let msgTypeName: string;

  switch (tx.type) {
    case "send":
      msgBytes = encodeMessageSend(tx.msg as MessageSendParams);
      msgTypeName = "types.MessageSend";
      break;

    case "createOrder":
      msgBytes = encodeMessageCreateOrder(tx.msg as MessageCreateOrderParams);
      msgTypeName = "types.MessageCreateOrder";
      break;

    case "editOrder":
      msgBytes = encodeMessageEditOrder(tx.msg as MessageEditOrderParams);
      msgTypeName = "types.MessageEditOrder";
      break;

    case "deleteOrder":
      msgBytes = encodeMessageDeleteOrder(tx.msg as MessageDeleteOrderParams);
      msgTypeName = "types.MessageDeleteOrder";
      break;

    default:
      throw new Error(`Unsupported message type: ${tx.type}`);
  }

  // Step 2: Wrap message in google.protobuf.Any
  const anyMsg = createAny(msgTypeName, msgBytes);

  // Step 3: Create transaction WITHOUT signature
  // Mirrors lib.Transaction.GetSignBytes() which sets Signature to nil
  const transactionData = {
    message_type: tx.type,
    msg: anyMsg,
    signature: null, // CRITICAL: signature must be null for sign bytes
    created_height: tx.createdHeight,
    time: tx.time,
    fee: tx.fee,
    network_id: tx.networkID,
    chain_id: tx.chainID,
    // CRITICAL: Only include memo if it's not empty
    // The backend omits empty strings from protobuf
    ...(!shouldOmit(tx.memo) && { memo: tx.memo }),
  };

  const transaction = Transaction.create(transactionData);

  // Step 4: Encode to protobuf bytes
  return Transaction.encode(transaction).finish();
}

/**
 * Encodes a complete signed transaction to protobuf
 * Used after signing to create the full transaction object
 *
 * NOTE: This is only needed if you want to send raw protobuf bytes.
 * For Launchpad, we send JSON and it does the proto conversion.
 *
 * @param tx - Complete transaction with signature
 * @returns Protobuf-encoded transaction bytes
 */
export function encodeSignedTransaction(tx: {
  type: string;
  msg: TransactionMessage;
  signature: {
    publicKey: string;
    signature: string;
  };
  time: number;
  createdHeight: number;
  fee: number;
  memo: string;
  networkID: number;
  chainID: number;
}): Uint8Array {
  // Get the Any-wrapped message
  let msgBytes: Uint8Array;
  let msgTypeName: string;

  switch (tx.type) {
    case "MessageSend":
      msgBytes = encodeMessageSend(tx.msg as MessageSendParams);
      msgTypeName = "types.MessageSend";
      break;
    // ... (add other cases as needed)
    default:
      throw new Error(`Unsupported message type: ${tx.type}`);
  }

  const anyMsg = createAny(msgTypeName, msgBytes);

  // Create transaction WITH signature
  const transaction = Transaction.create({
    message_type: tx.type,
    msg: anyMsg,
    signature: {
      public_key: hexToBytes(tx.signature.publicKey),
      signature: hexToBytes(tx.signature.signature),
    },
    created_height: tx.createdHeight,
    time: tx.time,
    fee: tx.fee,
    memo: tx.memo ?? "",
    network_id: tx.networkID,
    chain_id: tx.chainID,
  });

  return Transaction.encode(transaction).finish();
}

/**
 * Verifies that our protobuf encoding matches expected format
 * Useful for debugging signature verification issues
 */
// export function debugProtobufEncoding(tx: any): void {
//   const signBytes = getSignBytesProtobuf(tx);

//   console.log("=== Protobuf Encoding Debug ===");
//   console.log("Transaction:", JSON.stringify(tx, null, 2));
//   console.log("Sign bytes length:", signBytes.length);
//   console.log("Sign bytes (hex):", Buffer.from(signBytes).toString("hex"));
//   console.log(
//     "Sign bytes (base64):",
//     Buffer.from(signBytes).toString("base64"),
//   );
// }
