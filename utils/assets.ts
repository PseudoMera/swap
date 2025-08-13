import { ASSETS } from "@/constants/assets";
import { Asset } from "@/types/assets";

export const getAssetById = (assetId: string): Asset => {
  const asset = ASSETS[assetId];
  if (!asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }
  return asset;
};

export const getAssetByCommittee = (committee: number): Asset => {
  const asset = Object.values(ASSETS).find((a) => a.committee === committee);
  if (!asset) {
    throw new Error(`Asset not found for committee: ${committee}`);
  }
  return asset;
};

export const getAssetBySymbol = (symbol: string): Asset => {
  const asset = Object.values(ASSETS).find(
    (a) => a.symbol.toLowerCase() === symbol.toLowerCase(),
  );
  if (!asset) {
    throw new Error(`Asset not found for symbol: ${symbol}`);
  }
  return asset;
};

export const getSellableAssets = (): Asset[] => {
  return Object.values(ASSETS).filter((asset) => asset.canSell);
};

export const getBuyableAssets = (): Asset[] => {
  return Object.values(ASSETS).filter((asset) => asset.canBuy);
};

export const getAllAssets = (): Asset[] => {
  return Object.values(ASSETS);
};
