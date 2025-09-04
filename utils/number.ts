export const formatNumber = (
  number: number | bigint | undefined,
  decimals = 2,
): string => {
  if (number === undefined || number === null) {
    return (0).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return Number(number).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatTokenBalance = (
  balanceObj:
    | {
        decimals: number;
        formatted: string;
        symbol: string;
        value: bigint;
      }
    | undefined,
  displayDecimals = 2,
): string => {
  if (
    !balanceObj ||
    balanceObj.value === undefined ||
    balanceObj.decimals === undefined
  ) {
    return (0).toLocaleString(undefined, {
      minimumFractionDigits: displayDecimals,
      maximumFractionDigits: displayDecimals,
    });
  }
  const realValue =
    Number(balanceObj.value) / Math.pow(10, balanceObj.decimals);
  return realValue.toLocaleString(undefined, {
    minimumFractionDigits: displayDecimals,
    maximumFractionDigits: displayDecimals,
  });
};
