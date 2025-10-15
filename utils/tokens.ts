import {
  TEST_ORACLE_CONTRACT,
  USDC_CONTRACT_ETHEREUM_MAINNET,
} from "@/constants/tokens";
import { AssetId } from "@/types/assets";

export const assetToAddress = (assetId: AssetId) => {
  switch (assetId) {
    case "cnpy":
      return TEST_ORACLE_CONTRACT;
    case "usdc":
      return USDC_CONTRACT_ETHEREUM_MAINNET;
    default:
      return USDC_CONTRACT_ETHEREUM_MAINNET;
  }
};
