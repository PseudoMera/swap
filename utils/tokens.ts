import {
  TEST_ORACLE_CONTRACT,
  USDC_CONTRACT_SEPOLIA,
} from "@/constants/tokens";
import { AssetId } from "@/types/assets";

export const assetToAddress = (assetId: AssetId) => {
  switch (assetId) {
    case "cnpy":
      return TEST_ORACLE_CONTRACT;
    case "usdc":
      return TEST_ORACLE_CONTRACT;
    // return USDC_CONTRACT_SEPOLIA;
    default:
      return USDC_CONTRACT_SEPOLIA;
  }
};
