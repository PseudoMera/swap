export function ellipsizeAddress(address: string, chars = 4) {
  if (!address) return "";
  return address.length > chars * 2
    ? `${address.slice(0, chars)}...${address.slice(-chars)}`
    : address;
}

export function sliceAddress(
  address: string,
  start: number = 0,
  end: number = 2,
) {
  if (!address) return "";
  return address.slice(start, end);
}

export function padAddress(address: string) {
  if (!address) return "";
  return address.padStart(64, "0");
}
