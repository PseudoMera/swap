import { BLOCKCHAIN_DIVISOR } from "@/constants/blockchain";

export const numberToBlockchainUValue = (number: number): number => {
  return number * BLOCKCHAIN_DIVISOR;
};

export const blockchainUValueToNumber = (number: number): number => {
  return number / BLOCKCHAIN_DIVISOR;
};
