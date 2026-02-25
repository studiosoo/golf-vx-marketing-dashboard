import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCw, Trophy, Users, Calendar, TrendingUp } from "lucide-react";

const LEAGUE_PROGRAMS = [
  { name: "Sunday Clinic", type: "clinic", description: "Weekly Sunday group lessons and clinics", acuityKey: "sunday" },
  { name: "PBGA Winter Clinic", type: "clinic", description: "PBGA-affiliated winter training program", acuityKey: "winter" },
  { name: "Corporate Events", type: "corporate", description: "Corporate golf outings and team events", acuityKey: null },
  { name: "Junior Golf", type: "junior", description: "Junior development programs", acuityKey: null },
];

export default function Leagues() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"sunday" | "winter">("sunday");

  const { data: sundayMetrics, isLoading: sundayLoading } = trpc.campaigns.getSundayClinicMetrics.useQuery({});
  const { data: winterMetrics, isLoading: winterLoading } = trpc.campaigns.getWinterClinicMetrics.useQuery({});
  const { data: corporateCampaigns, isLoading: corpLoading } = trpc.campaigns.getByCategory.useQuery({ category: "corporate_events" });

  const isLoading = sundayLoading || winterLoading;
  const activeMetrics = activeTab === "sunday" ? sundayMetrics : winterMetrics;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Leagues & Programs</h1>
            <p className="text-muted-foreground mt-1 text-sm">Clinic performance, league management, and program metrics</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
            onClick={() => { utils.campaigns.getSundayClinicMetrics.invalidate(); utils.campaigns.getWinterClinicMetrics.invalidate(); }}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {LEAGUE_PROGRAMS.map((prog) => (
            <Card key={prog.name} className={`cursor-pointer transition-all ${prog.acuityKey === activeTab ? "border-primary/60 bg-primary/5" : "hover:border-muted-foreground/30"}`}
              onClick={() => prog.acuityKey && setActiveTab(prog.acuityKey as "sunday" | "winter")}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <Badge variant="outline" className="text-xs capitalize">{prog.type}</Badge>
                </div>
                <p className="text-sm font-semibold text-foreground">{prog.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{prog.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              {activeTab === "sunday" ? "Sunday Clinic Metrics" : "PBGA Winter Clinic Metrics"}
            </CardTitle>
            <div className="flex gap-1">
              {(["sunday", "winter"] as const).map((tab) => (
                <Button key={tab} size="sm" variant={activeTab === tab ? "default" : "ghost"}
                  className="h-7 text-xs capitalize" onClick={() => setActiveTab(tab)}>
                  {tab === "sunday" ? "Sunday" : "Winter"}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : activeMetrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Total Bookings", value: (activeMetrics as any)?.totalBookings ?? (activeMetrics as any)?.total ?? "—", icon: Calendar, color: "text-primary" },
                    { label: "Unique Participants", value: (activeMetrics as any)?.uniqueParticipants ?? (activeMetrics as any)?.uniqueClients ?? "—", icon: Users, color: "text-blue-400" },
                    { label: "Member Bookings", value: (activeMetrics as any)?.memberBookings ?? "—", icon: Trophy, color: "text-green-400" },
                    { label: "Conversion Rate", value: (activeMetrics as any)?.conversionRate ? `${(activeMetrics as any).conversionRate}%` : "—", icon: TrendingUp, color: "text-amber-400" },
                  ].map((s) => (
                    <div key={s.label} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                      <p className={`text-xl font-bold ${s.color}`}>{String(s.value)}</p>
                    </div>
                  ))}
                </div>
                {(activeMetrics as any)?.recentAppointments?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recent Appointments</p>
                    <div className="space-y-1.5">
                      {(activeMetrics as any).recentAppointments.slice(0, 5).map((appt: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-muted/20 rounded-md px-3 py-2">
                          <div>
                            <span className="text-sm font-medium text-foreground">{appt.firstName} {appt.lastName}</span>
                            <span className="text-xs text-muted-foreground ml-2">{appt.email}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{appt.datetime ? new Date(appt.datetime).toLocaleDateString() : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No data available. Acuity sync may be pending.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" /> Corporate Events Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {corpLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : !corporateCampaigns?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No corporate event campaigns found</p>
            ) : (
              <div className="divide-y divide-border/50">
                {corporateCampaigns.map((c: any) => (
                  <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.startDate ? new Date(c.startDate).toLocaleDateString() : "No date"}</p>
                    </div>
                    <Badge variant={c.status === "active" ? "default" : "outline"} className="text-xs capitalize">{c.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
