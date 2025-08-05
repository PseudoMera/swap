export const API_INTERVAL_REQUEST = 5_000;

export const POLLING_INTERVALS = {
  ORDERS: 5_000,
  BALANCE: 10_000,
  HEIGHT: 3_000,
} as const;

export const QUERY_KEYS = {
  ORDERS: ['orders'],
  USER_BALANCE: ['userBalance'],
  HEIGHT: ['height'],
} as const;
