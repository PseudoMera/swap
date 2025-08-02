export function ellipsizeAddress(address: string, chars = 4) {
  if (!address) return "";
  return address.length > chars * 2
    ? `${address.slice(0, chars)}...${address.slice(-chars)}`
    : address;
}
