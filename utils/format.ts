export const truncateAddress = (address: string): string =>
  `${address.slice(0, 9)}...${address.slice(-6)}`;

export const formatEther = (wei: bigint): string =>
  (Number(wei) / 1e18).toFixed(4);

// Relative time function (like "2 hours ago" or "in 3 days")
export const relativeTime = (date: Date): string => {
  const now = Number(new Date());
  const diff = new Date(date).getTime() - now;
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((absDiff / (1000 * 60)) % 60);

  let timeStr = '';
  if (days > 0) {
    timeStr = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  } else if (hours > 0) {
    timeStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    timeStr = `${minutes}m`;
  } else {
    timeStr = 'now';
  }

  if (timeStr === 'now') return 'now';
  return isPast ? `${timeStr} ago` : `in ${timeStr}`;
};
