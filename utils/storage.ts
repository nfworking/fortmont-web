export const formatBytesBigInt = (bytes?: bigint | null) => {
  if (bytes == null) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024n;

  let size = bytes;
  let unitIndex = 0;

  // scale down while we can
  while (size >= k && unitIndex < units.length - 1) {
    size = size / k;
    unitIndex++;
  }

  // convert only final value for decimal formatting
  const value = Number(size);

  return `${unitIndex === 0 ? value : value.toFixed(2)} ${units[unitIndex]}`;
};

export const getStoragePercent = (used: bigint, quota: bigint) => {
  if (quota === 0n) return 0;

  // multiply first to avoid truncation
  return Number((used * 10000n) / quota) / 100;
};

export const getStorageColor = (percent: number) => {
  if (percent < 70) return "bg-green-500";
  if (percent < 90) return "bg-yellow-500";
  return "bg-red-500";
};