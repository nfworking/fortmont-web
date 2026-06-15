import * as React from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Circle,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'warning' | 'success' | 'danger';
}

function StatCard({ title, value, description, icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    success: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
    danger: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    warning: 'text-amber-600 dark:text-amber-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-xs font-medium',
                trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}>
                <TrendingUp className={cn('h-3 w-3', !trend.isPositive && 'rotate-180')} />
                <span>{trend.isPositive ? '+' : ''}{trend.value}% from last week</span>
              </div>
            )}
          </div>
          <div className={cn('rounded-lg p-2.5 bg-muted/50', iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    critical: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Tickets"
        value={stats.total}
        icon={<BarChart3 className="h-5 w-5" />}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Open"
        value={stats.open}
        description="Awaiting triage"
        icon={<Circle className="h-5 w-5" />}
        variant="warning"
      />
      <StatCard
        title="In Progress"
        value={stats.inProgress}
        description="Being worked on"
        icon={<Clock className="h-5 w-5" />}
      />
      <StatCard
        title="Resolved"
        value={stats.resolved}
        icon={<CheckCircle2 className="h-5 w-5" />}
        variant="success"
      />
      <StatCard
        title="Critical"
        value={stats.critical}
        description="Requires immediate attention"
        icon={<AlertTriangle className="h-5 w-5" />}
        variant="danger"
      />
    </div>
  );
}
