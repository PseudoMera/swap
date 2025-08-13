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
}
