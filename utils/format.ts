export const truncateAddress = (address: string): string =>
  `${address.slice(0, 9)}...${address.slice(-6)}`;

export const formatEther = (wei: bigint): string =>
  (Number(wei) / 1e18).toFixed(4);

export const timeLeft = (deadline: Date): string => {
  const now = new Date().getTime();
  const diff = deadline.getTime() - now;

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  return `in ${days}d ${hours}h`;
};
