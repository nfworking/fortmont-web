import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Circle, Clock, PauseCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { TicketStatus } from './ticket';

const statusVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      status: {
        open: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
        in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400',
        resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        closed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400',
      },
    },
    defaultVariants: {
      status: 'open',
    },
  }
);

const statusIcons: Record<TicketStatus, React.ReactNode> = {
  open: <Circle className="h-3 w-3" />,
  in_progress: <Clock className="h-3 w-3" />,
  pending: <PauseCircle className="h-3 w-3" />,
  resolved : <CheckCircle2 className="h-3 w-3" />,
  closed: <XCircle className="h-3 w-3" />,
};

const statusLabels: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
};

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: TicketStatus;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const icon = statusIcons[status];
  const label = statusLabels[status];

  return (
    <span className={cn(statusVariants({ status }), className)} {...props}>
      {icon}
      {label}
    </span>
  );
}
