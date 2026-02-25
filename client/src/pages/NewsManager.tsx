import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, Sparkles, RefreshCw, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewsManager() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [generating, setGenerating] = useState(false);

  const { data: reports, isLoading: reportsLoading } = trpc.reports.list.useQuery();
  const { data: alerts, isLoading: alertsLoading } = trpc.intelligence.getAlerts.useQuery();

  const generateReport = trpc.reports.generate.useMutation({
    onSuccess: () => {
      utils.reports.list.invalidate();
      toast({ title: "Report generated", description: "Monthly summary report created successfully" });
      setGenerating(false);
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setGenerating(false);
    },
  });

  const handleGenerateReport = () => {
    setGenerating(true);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    generateReport.mutate({ name: `Monthly Summary - ${start.toLocaleString("default", { month: "long", year: "numeric" })}`, type: "monthly_summary", startDate: start, endDate: end });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">News & Reports</h1>
            <p className="text-muted-foreground mt-1 text-sm">Marketing intelligence alerts and generated reports</p>
          </div>
          <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={handleGenerateReport} disabled={generating}>
            {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Generate Report
          </Button>
        </div>

        {/* Intelligence Alerts */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" /> AI Intelligence Alerts
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => utils.intelligence.getAlerts.invalidate()}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {alertsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : !(alerts as any[])?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No active alerts</p>
            ) : (
              <div className="divide-y divide-border/50">
                {(alerts as any[]).slice(0, 8).map((alert: any) => (
                  <div key={alert.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${
                        alert.severity === "critical" ? "text-red-400" :
                        alert.severity === "warning" ? "text-amber-400" : "text-blue-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{alert.title}</p>
                          <Badge variant="outline" className="text-xs capitalize">{alert.severity ?? "info"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : ""}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" /> Generated Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {reportsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : !(reports as any[])?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No reports yet. Click "Generate Report" to create one.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {(reports as any[]).map((r: any) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs capitalize">{r.type?.replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
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
