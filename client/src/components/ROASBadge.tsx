import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ROASBadgeProps {
  roas: number;
  revenue: number;
  adSpend: number;
}

export function ROASBadge({ roas, revenue, adSpend }: ROASBadgeProps) {
  if (adSpend === 0) {
    return (
      <Badge variant="outline" className="gap-1">
        <Minus className="h-3 w-3" />
        No Ad Spend
      </Badge>
    );
  }

  const roasValue = roas;
  const isPositive = roasValue > 100;
  const isNegative = roasValue < 100;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}
        className="gap-1"
      >
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {isNegative && <TrendingDown className="h-3 w-3" />}
        {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
        ROAS: {roasValue.toFixed(0)}%
      </Badge>
      <span className="text-xs text-muted-foreground">
        ${revenue.toFixed(0)} / ${adSpend.toFixed(0)}
      </span>
    </div>
  );
}
