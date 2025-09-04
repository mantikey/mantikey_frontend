export const truncateAddress = (address: string): string =>
  `${address.slice(0, 9)}...${address.slice(-6)}`;

export const formatEther = (wei: bigint): string =>
  (Number(wei) / 1e18).toFixed(4);
