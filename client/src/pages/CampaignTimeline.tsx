import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, addMonths, subMonths, isWithinInterval, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS = {
  trial_conversion: "bg-green-500",
  membership_acquisition: "bg-red-500",
  member_retention: "bg-blue-500",
  corporate_events: "bg-orange-500",
};

const CATEGORY_LABELS = {
  trial_conversion: "Trial Conversion Campaign",
  membership_acquisition: "Membership Acquisition Campaign",
  member_retention: "Member Retention + Community Flywheel",
  corporate_events: "Corporate Events & B2B Sales Campaign",
};

export default function CampaignTimeline() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();

  // Generate 6 months view (current month ± 2 months)
  const startDate = startOfMonth(subMonths(currentDate, 2));
  const endDate = endOfMonth(addMonths(currentDate, 3));
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Group campaigns by category
  const campaignsByCategory = campaigns?.reduce((acc, campaign) => {
    if (!acc[campaign.category]) {
      acc[campaign.category] = [];
    }
    acc[campaign.category].push(campaign);
    return acc;
  }, {} as Record<string, typeof campaigns>);

  // Calculate campaign position on timeline
  const getCampaignStyle = (campaign: any) => {
    if (!campaign.startDate || !campaign.endDate) return null;

    // Handle both Date objects and string dates
    const campStart = campaign.startDate instanceof Date 
      ? campaign.startDate 
      : typeof campaign.startDate === 'string' 
        ? parseISO(campaign.startDate) 
        : new Date(campaign.startDate);
    
    const campEnd = campaign.endDate instanceof Date 
      ? campaign.endDate 
      : typeof campaign.endDate === 'string' 
        ? parseISO(campaign.endDate) 
        : new Date(campaign.endDate);

    // Check if campaign overlaps with visible timeline
    if (!isWithinInterval(campStart, { start: startDate, end: endDate }) &&
        !isWithinInterval(campEnd, { start: startDate, end: endDate }) &&
        !(campStart <= startDate && campEnd >= endDate)) {
      return null;
    }

    // Calculate position as percentage
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const startOffset = Math.max(0, (campStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = (campEnd.getTime() - campStart.getTime()) / (1000 * 60 * 60 * 24);

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, width)}%`,
    };
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="text-center text-muted-foreground">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaign Timeline</h1>
          <p className="text-muted-foreground mt-1">
            Gantt-chart view of all marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline View</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Month headers */}
          <div className="flex border-b border-border mb-4">
            {months.map((month) => (
              <div
                key={month.toISOString()}
                className="flex-1 text-center py-2 text-sm font-medium"
              >
                {format(month, "MMM yyyy")}
              </div>
            ))}
          </div>

          {/* Campaign rows grouped by category */}
          <div className="space-y-8">
            {Object.entries(campaignsByCategory || {}).map(([category, categoryCampaigns]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                </h3>
                <div className="space-y-2">
                  {categoryCampaigns.map((campaign) => {
                    const style = getCampaignStyle(campaign);
                    if (!style) return null;

                    return (
                      <div key={campaign.id} className="relative h-12 bg-muted/30 rounded">
                        <div
                          className={`absolute top-1 bottom-1 rounded px-3 py-1 ${
                            CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
                          } text-white text-sm font-medium flex items-center cursor-pointer hover:opacity-90 transition-opacity`}
                          style={style}
                          title={`${campaign.name}\n${campaign.startDate} - ${campaign.endDate}`}
                        >
                          <span className="truncate">{campaign.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!campaigns || campaigns.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              No campaigns with dates found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
