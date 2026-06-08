// components/common/DetailRow.tsx
import React from "react";

export interface DetailRowProps {
  label: string;
  value: string;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[65%] truncate text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export default DetailRow;
