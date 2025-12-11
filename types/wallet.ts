import { TransactionMessage } from "../lib/crypto/types";

export type WalletType = "metamask" | "canopy";
export type ChainType = "ethereum" | "canopy";

export interface CanopyKeyfile {
  Address: string;
  PublicKey: string;
  PrivateKey: string;
}

export interface EncryptedCanopyKeyfile {
  publicKey: string;
  salt: string;
  encrypted: string;
  keyAddress: string;
  keyNickname: string;
}

export type CanopyKeyfileCollection = Record<string, EncryptedCanopyKeyfile>;

export type KeyfileFormat = "plain" | "encrypted";

export interface CanopyWalletAccount {
  address: string;
  keyfileId: string;
  filename: string;
  encryptedKeyfile: EncryptedCanopyKeyfile;
}

export type ZeroXAddress = `0x${string}`;

export interface SendRawTransactionRequest {
  raw_transaction: {
    type: string;
    msg: TransactionMessage;
    signature: {
      publicKey: string;
      signature: string;
    };
    time: number;
    createdHeight: number;
    fee: number;
    memo?: string;
    networkID: number;
    chainID: number;
  };
}
