import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, HelpCircle, Wrench, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
  {
    variants: {
      variant: {
        Incident: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
        'Service Request': 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
        'Change Request': 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
        Problem: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      },
    },
    defaultVariants: {
      variant: 'Incident',
    },
  }
);

const typeIcons: Record<string, React.ReactNode> = {
  Incident: <AlertTriangle className="h-3.5 w-3.5" />,
  'Service Request': <HelpCircle className="h-3.5 w-3.5" />,
  'Change Request': <Wrench className="h-3.5 w-3.5" />,
  Problem: <Clock className="h-3.5 w-3.5" />,
};

const validTypes = ['Incident', 'Service Request', 'Change Request', 'Problem'] as const;

interface TypeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: string;
}

export function TypeBadge({ type, className, ...props }: TypeBadgeProps) {
  const isValidType = validTypes.includes(type as any);
  const variant = isValidType ? (type as VariantProps<typeof typeVariants>['variant']) : 'Incident';
  const icon = typeIcons[type] || <HelpCircle className="h-3.5 w-3.5" />;

  return (
    <span className={cn(typeVariants({ variant }), className)} {...props}>
      {icon}
      {type}
    </span>
  );
}
