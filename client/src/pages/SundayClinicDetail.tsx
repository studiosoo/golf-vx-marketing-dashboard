import DashboardLayout from "@/components/DashboardLayout";
import ProgramMarketingPanel from "@/components/ProgramMarketingPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, UserPlus, TrendingUp, Calendar, Share2 } from "lucide-react";

export default function SundayClinicDetail() {
  const { data: metrics, isLoading } = trpc.campaigns.getSundayClinicMetrics.useQuery({
    minDate: "2026-01-25",
    maxDate: "2026-03-29",
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!metrics) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground">No data available</div>
      </DashboardLayout>
    );
  }

  const memberGoalProgress = (metrics.memberAttendees / metrics.totalMembers) * 100;
  const targetMemberAttendance = 50; // Example target: 50% of members attend at least once
  const memberPerformance = (memberGoalProgress / targetMemberAttendance) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sunday Clinic</h1>
          <p className="text-muted-foreground">Public drive day events - Member retention & new visitor acquisition</p>
        </div>

        {/* Dual Goal Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Member Retention Goal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Member Retention</CardTitle>
                </div>
                <Badge variant={memberPerformance >= 80 ? "default" : "secondary"}>
                  {Math.round(memberPerformance)}% Performance
                </Badge>
              </div>
              <CardDescription>Track member engagement through clinic attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.totalMembers}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Members Attended</p>
                  <p className="text-2xl font-bold text-primary">{metrics.memberAttendees}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  <p className="text-lg font-semibold text-foreground">{metrics.memberAttendanceRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Repeat Rate</p>
                  <p className="text-lg font-semibold text-foreground">{metrics.memberRepeatRate.toFixed(1)}%</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Member Engagement Goal</span>
                  <span>{memberGoalProgress.toFixed(0)}%</span>
                </div>
                <Progress value={memberGoalProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Non-Member Acquisition Goal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <CardTitle>New Visitor Acquisition</CardTitle>
                </div>
                <Badge variant="secondary">
                  {metrics.nonMemberAttendees} Prospects
                </Badge>
              </div>
              <CardDescription>Convert clinic attendees to paying members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">New Visitors</p>
                  <p className="text-2xl font-bold text-primary">{metrics.nonMemberAttendees}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.nonMemberTotalBookings}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conversion Opportunities</p>
                  <p className="text-lg font-semibold text-foreground">{metrics.conversionOpportunities}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Visits/Person</p>
                  <p className="text-lg font-semibold text-foreground">
                    {metrics.nonMemberAttendees > 0 
                      ? (metrics.nonMemberTotalBookings / metrics.nonMemberAttendees).toFixed(1) 
                      : '0'}
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 Follow up with {metrics.conversionOpportunities} prospects to convert them into members
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acquisition Source Attribution */}
        {metrics.sourceBreakdown && Object.keys(metrics.sourceBreakdown).length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                <CardTitle>Acquisition Sources</CardTitle>
              </div>
              <CardDescription>
                How attendees found out about Sunday Clinic events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.sourceBreakdown)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([source, count]) => {
                    const percentage = ((count as number) / metrics.totalBookings) * 100;
                    
                    // Define goals for each source (example targets)
                    const sourceGoals: Record<string, number> = {
                      'Social Media': 15,  // Target: 15 attendees from social
                      'PBGA': 20,          // Target: 20 attendees from PBGA
                      'Golf VX': 10,       // Target: 10 attendees from Golf VX
                      'Referral': 5,       // Target: 5 from referrals
                    };
                    
                    const goal = sourceGoals[source] || 0;
                    const goalProgress = goal > 0 ? Math.min(((count as number) / goal) * 100, 100) : 0;
                    
                    return (
                      <div key={source} className="space-y-2 p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <span className="font-medium text-foreground">{source}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-foreground">{count}</span>
                            <span className="text-sm text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        
                        {goal > 0 && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                            <span>Goal: {goal} attendees</span>
                            <span className={goalProgress >= 100 ? "text-green-600 font-semibold" : ""}>
                              {goalProgress.toFixed(0)}% of goal
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Event Breakdown</CardTitle>
            </div>
            <CardDescription>
              {metrics.totalEvents} events • {metrics.totalBookings} total bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.events.map((event) => (
                <div key={event.date} className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.uniqueAttendees} unique attendees
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{event.totalBookings}</p>
                      <p className="text-xs text-muted-foreground">bookings</p>
                    </div>
                  </div>
                  
                  {/* Source breakdown for this event */}
                  {event.sourceBreakdown && Object.keys(event.sourceBreakdown).length > 0 && (
                    <div className="pl-16 pr-3 pb-2">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(event.sourceBreakdown)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([source, count]) => (
                            <Badge key={source} variant="outline" className="text-xs">
                              {source}: {count}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overall Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{metrics.totalEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{metrics.totalBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique Attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{metrics.uniqueAttendees}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Repeat Attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{metrics.repeatAttendees}</p>
              <p className="text-sm text-muted-foreground">{metrics.repeatRate.toFixed(1)}% repeat rate</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Marketing Intelligence ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Marketing Intelligence</h2>
          <p className="text-sm text-muted-foreground mt-1">Meta Ads, Instagram, and newsletter efforts for Drive Day Clinics.</p>
        </div>
        <ProgramMarketingPanel
          programName="Drive Day Clinics"
          programKeywords={["drive day", "sunday clinic"]}
        />
      </div>
    </DashboardLayout>
  );
}
