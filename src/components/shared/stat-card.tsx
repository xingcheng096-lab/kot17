import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  titleKh?: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  accent?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive';
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, { bg: string; text: string; ring: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', ring: 'ring-primary/20' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary', ring: 'ring-secondary/20' },
  success: { bg: 'bg-success/10', text: 'text-success', ring: 'ring-success/20' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', ring: 'ring-warning/20' },
  info: { bg: 'bg-info/10', text: 'text-info', ring: 'ring-info/20' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive', ring: 'ring-destructive/20' },
};

export function StatCard({
  title,
  titleKh,
  value,
  icon: Icon,
  trend,
  trendLabel,
  accent = 'primary',
}: StatCardProps) {
  const styles = accentStyles[accent];
  const trendUp = trend !== undefined && trend >= 0;

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
            {titleKh && <p className="font-khmer truncate text-xs text-muted-foreground/80">{titleKh}</p>}
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {trend !== undefined && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                    trendUp ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(trend)}%
                </span>
                {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1',
              styles.bg,
              styles.text,
              styles.ring,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
