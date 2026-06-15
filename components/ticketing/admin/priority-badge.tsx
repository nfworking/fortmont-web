import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const priorityVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      priority: {
        LOW: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        HIGH: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
        CRITICAL: 'bg-red-600 text-white dark:bg-red-500/80 dark:text-white',
      },
    },
    defaultVariants: {
      priority: 'LOW',
    },
  }
);

interface PriorityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof priorityVariants> {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function PriorityBadge({ priority, className, ...props }: PriorityBadgeProps) {
  return (
    <span className={cn(priorityVariants({ priority }), className)} {...props}>
      {priority}
    </span>
  );
}
