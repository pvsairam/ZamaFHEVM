import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { EncryptionBadge } from "./EncryptionBadge";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  encrypted?: boolean;
  className?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, encrypted = false, className }: MetricCardProps) {
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  return (
    <Card className={cn("hover-elevate transition-all duration-200", className)} data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {encrypted && <EncryptionBadge status="fhe-aggregated" />}
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight" data-testid={`text-metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {isPositive && <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
            {isNegative && <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />}
            <span className={cn(
              "font-medium",
              isPositive && "text-emerald-600 dark:text-emerald-400",
              isNegative && "text-red-600 dark:text-red-400",
              !isPositive && !isNegative && "text-muted-foreground"
            )}>
              {trend.value > 0 && '+'}{trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
