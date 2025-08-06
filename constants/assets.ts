export interface Asset {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: string;
  committee: number;
  canSell: boolean;
  canBuy: boolean;
}

export const ASSETS: Record<string, Asset> = {
  cnpy: {
    id: 'cnpy',
    name: 'Canopy',
    symbol: 'CNPY',
    decimals: 6,
    chainId: 'canopy',
    committee: 1,
    canSell: true,
    canBuy: false, // CNPY can be sold but not bought (it's the base asset)
  },
  usdc: {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    chainId: 'ethereum',
    committee: 2,
    canSell: false, // USDC cannot be sold (it's the quote asset)
    canBuy: true,   // USDC can be bought
  },
};

export const getAssetById = (assetId: string): Asset => {
  const asset = ASSETS[assetId];
  if (!asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }
  return asset;
};

export const getAssetByCommittee = (committee: number): Asset => {
  const asset = Object.values(ASSETS).find(a => a.committee === committee);
  if (!asset) {
    throw new Error(`Asset not found for committee: ${committee}`);
  }
  return asset;
};

export const getAssetBySymbol = (symbol: string): Asset => {
  const asset = Object.values(ASSETS).find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
  if (!asset) {
    throw new Error(`Asset not found for symbol: ${symbol}`);
  }
  return asset;
};

export const getSellableAssets = (): Asset[] => {
  return Object.values(ASSETS).filter(asset => asset.canSell);
};

export const getBuyableAssets = (): Asset[] => {
  return Object.values(ASSETS).filter(asset => asset.canBuy);
};

export const getAllAssets = (): Asset[] => {
  return Object.values(ASSETS);
};