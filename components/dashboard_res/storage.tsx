"use client";
import { formatBytesBigInt, getStorageColor, getStoragePercent } from "@/utils/storage";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";

type Props = {
  usedBytes?: bigint;
  quotaBytes?: bigint;
};

export function StorageWidget({ usedBytes, quotaBytes }: Props) {
  if (usedBytes == null || quotaBytes == null) {
    return (

      <div className="rounded-xl border p-4 text-sm text-gray-500">
        No storage data available
      </div>
    );
  }

  const percent = getStoragePercent(usedBytes, quotaBytes);
  const barColor = getStorageColor(percent);

  const [animatedWidth, setAnimatedWidth] = useState(0);

useEffect(() => {
  const timer = setTimeout(() => {
    setAnimatedWidth(Math.min(percent, 100));
  }, 50); 

  return () => clearTimeout(timer);
}, [percent]); 

  return (
    <div className="rounded-xl border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Storage</h3>
        
        <span className="text-sm dark:text-white text-black">
          {percent.toFixed(1)}%
        </span>
        <Button variant="outline" size="sm" onClick={() => toast.info("Storage upgrade coming soon!")}>
          Upgrade
        </Button>
      </div>

      {/* Usage */}
      <div className="text-sm dark:text-white text-black">
        {formatBytesBigInt(usedBytes)} / {formatBytesBigInt(quotaBytes)}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
    <div
      className={`h-full transition-all ease-out duration-1000 ${barColor}`}
      style={{ width: `${animatedWidth}%` }}
    />
  </div>

      {/* Status */}
      {percent >= 90 && (
        <div className="text-xs text-red-500">
          Storage almost full
        </div>
      )}
      {percent >= 70 && percent < 90 && (
        <div className="text-xs text-yellow-600">
          Storage getting high
        </div>
      )}
    </div>
  );
}