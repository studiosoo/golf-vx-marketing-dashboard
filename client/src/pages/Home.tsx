import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Brain,
  Zap,
  Clock,
  Eye,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const syncStatus = trpc.autonomous.getSyncStatus.useQuery();
  const autoExecuted = trpc.autonomous.getAutoExecutedActions.useQuery();
  const approvalCards = trpc.autonomous.getApprovalCards.useQuery();
  const monitoringItems = trpc.autonomous.getMonitoringItems.useQuery();

  const latest = syncStatus.data?.latest;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Marketing Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back{user?.name ? `, ${user.name}` : ""}. Here is your
              autonomous marketing overview.
            </p>
          </div>
          <Button
            onClick={() => setLocation("/intelligence")}
            className="bg-yellow-500 text-black hover:bg-yellow-400"
          >
            <Brain className="mr-2 h-4 w-4" />
            Intelligence Center
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Sync Status Banner */}
        {latest && (
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3 text-sm">
                <Activity className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Last Sync:</span>
                <span className="text-muted-foreground">
                  {latest.status === "completed"
                    ? `Completed at ${new Date(latest.completedAt!).toLocaleString()}`
                    : latest.status === "running"
                      ? "Currently running..."
                      : `Failed: ${latest.errorMessage || "Unknown error"}`}
                </span>
                <span className="text-muted-foreground">
                  — {latest.campaignsProcessed} campaigns processed,{" "}
                  {latest.actionsGenerated} actions generated
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-emerald-500"
            onClick={() => setLocation("/intelligence")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Auto-Executed
              </CardTitle>
              <Zap className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {autoExecuted.data?.count ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Low-risk actions applied automatically
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>No intervention needed</span>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
            onClick={() => setLocation("/intelligence")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Awaiting Approval
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {approvalCards.data?.count ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Medium/high-risk actions need your review
              </p>
              {(approvalCards.data?.count ?? 0) > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Action required</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
            onClick={() => setLocation("/intelligence")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monitoring
              </CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {monitoringItems.data?.count ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Campaigns being tracked for data
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                <Eye className="h-3 w-3" />
                <span>Gathering intelligence</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Auto-Execute</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Low-risk optimizations like budget decreases and pausing
                    underperformers are applied automatically.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Approval Required</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Budget increases, targeting changes, and email campaigns
                    require your explicit approval.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Smart Monitoring</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    New campaigns and healthy performers are monitored until
                    enough data is available for decisions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
