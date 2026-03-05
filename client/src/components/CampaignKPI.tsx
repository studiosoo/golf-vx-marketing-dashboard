import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Campaign {
  goalType?: string | null;
  goalTarget?: string | null;
  goalActual?: string | null;
  goalUnit?: string | null;
  actualSpend: string;
  actualRevenue: string;
}

interface CampaignKPIProps {
  campaign: Campaign;
  className?: string;
}

export function CampaignKPI({ campaign, className = "" }: CampaignKPIProps) {
  const spent = Number(campaign.actualSpend) || 0;
  const current = Number(campaign.goalActual) || 0;
  const target = Number(campaign.goalTarget) || 1;
  const revenue = Number(campaign.actualRevenue) || 0;
  const progress = Math.min((current / target) * 100, 100);

  // If no goalType is set, fall back to ROI display
  if (!campaign.goalType) {
    const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;
    return (
      <div className={className}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">ROI</span>
          <div className={`flex items-center gap-1.5 text-sm font-bold ${roi >= 0 ? 'text-[#3DB855] dark:text-[#3DB855]' : 'text-red-600 dark:text-[#E8453C]'}`}>
            {roi >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
          </div>
        </div>
      </div>
    );
  }

  switch (campaign.goalType) {
    case "revenue": {
      const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;
      const roas = spent > 0 ? (revenue / spent) * 100 : 0;
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">ROI</span>
            <div className={`flex items-center gap-1.5 text-sm font-bold ${roi >= 0 ? 'text-[#3DB855] dark:text-[#3DB855]' : 'text-red-600 dark:text-[#E8453C]'}`}>
              {roi >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>ROAS</span>
            <span className="font-semibold">{roas.toFixed(0)}%</span>
          </div>
        </div>
      );
    }

    case "followers": {
      const costPerFollower = current > 0 ? (spent / current).toFixed(2) : "—";
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Follower Growth</span>
            <span className="text-sm font-bold">
              {current.toLocaleString()} / {target.toLocaleString()}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Cost per follower</span>
            <span className="font-semibold">${costPerFollower}</span>
          </div>
        </div>
      );
    }

    case "leads": {
      const costPerLead = current > 0 ? (spent / current).toFixed(2) : "—";
      const unitLabel = campaign.goalUnit || "leads";
      const isPerWeek = unitLabel.includes("per week");
      const isPerEvent = unitLabel.includes("per event");
      
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {isPerWeek ? "This Week" : isPerEvent ? "This Event" : "Lead Generation"}
            </span>
            <span className="text-sm font-bold">
              {current} / {target}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {(isPerWeek || isPerEvent) && (
            <div className="text-xs text-muted-foreground italic">
              📅 {isPerWeek ? "Weekly" : "Per-event"} target (resets each {isPerWeek ? "week" : "occurrence"})
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Cost per {unitLabel.split(" ")[0].replace(/s$/, "")}</span>
            <span className="font-semibold">${costPerLead}</span>
          </div>
        </div>
      );
    }

    case "attendance": {
      const costPerAttendee = current > 0 ? (spent / current).toFixed(2) : "—";
      const isPerEvent = campaign.goalUnit?.includes("per event");
      
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {isPerEvent ? "Last Event Attendance" : "Attendance"}
            </span>
            <span className="text-sm font-bold">
              {current} / {target}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {isPerEvent && (
            <div className="text-xs text-muted-foreground italic">
              📅 Per-event target (resets each occurrence)
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Cost per attendee</span>
            <span className="font-semibold">${costPerAttendee}</span>
          </div>
        </div>
      );
    }

    case "retention": {
      // Seasonal membership pacing for "active members" goal
      if (campaign.goalUnit === "active members") {
        const membershipMonthlyTargets: Record<number, number> = {
          1: 20, 2: 20, 3: 15, 4: 10, 5: 8, 6: -5,
          7: -8, 8: -5, 9: 10, 10: 20, 11: 25, 12: 20
        };
        
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const monthlyTarget = membershipMonthlyTargets[currentMonth] || 0;
        const isChurnMonth = monthlyTarget < 0;
        const stillNeeded = Math.max(0, target - current);
        
        return (
          <div className={`space-y-2 ${className}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Membership Growth</span>
              <span className="text-sm font-bold">
                {current} / {target} members
              </span>
            </div>
            <Progress value={(current / target) * 100} className="h-2" />
            
            {/* Monthly target */}
            {isChurnMonth ? (
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-[#E8453C] font-medium">
                ⚠️ Churn season — expect net {monthlyTarget} members
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#3DB855] dark:text-[#3DB855] font-medium">
                📈 Target: +{monthlyTarget} new members this month
              </div>
            )}
            
            {/* Critical window alert for Apr-May */}
            {(currentMonth === 4 || currentMonth === 5) && (
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded text-xs text-orange-900 dark:text-orange-200">
                🚨 Pre-summer critical window — maximize acquisition NOW before June churn
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Still needed</span>
              <span className="font-semibold">{stillNeeded} members</span>
            </div>
          </div>
        );
      }
      
      // Regular retention rate display
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Retention Rate</span>
            <span className={`text-sm font-bold ${current >= target ? 'text-[#3DB855] dark:text-[#3DB855]' : 'text-orange-600 dark:text-[#F5C72C]'}`}>
              {current}% / {target}%
            </span>
          </div>
          <Progress value={(current / target) * 100} className="h-2" />
        </div>
      );
    }

    default:
      return null;
  }
}
