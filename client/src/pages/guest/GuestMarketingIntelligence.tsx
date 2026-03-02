// Guest version of MarketingIntelligence — uses autonomous.* public endpoints
// Mutations (approve, reject, sync) are shown but disabled
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Lock, CheckCircle, Clock, AlertCircle, Activity } from "lucide-react";
import { toast } from "sonner";

export default function GuestMarketingIntelligence() {
  const { data: syncStatus } = trpc.autonomous.getSyncStatus.useQuery();
  const { data: autoExecuted = [] } = trpc.autonomous.getAutoExecuted.useQuery();
  const { data: approvalCards = [] } = trpc.autonomous.getApprovalCards.useQuery();
  const { data: monitoring = [] } = trpc.autonomous.getMonitoring.useQuery();

  const handleDisabledAction = () => {
    toast.warning("Login required to perform this action");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketing Intelligence</h1>
          <p className="text-muted-foreground text-sm mt-1">AI-powered marketing analysis and recommendations</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5">
          <Lock size={11} />
          <span>Approve/Reject/Sync disabled in guest mode</span>
        </div>
      </div>

      {/* Sync Status */}
      {syncStatus && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity size={16} />
              Data Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(syncStatus as Record<string, any>).slice(0, 8).map(([key, val]) => (
                <div key={key} className="text-center">
                  <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                  <Badge className={val?.status === "ok" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"}>
                    {val?.status || "unknown"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Cards */}
      {(approvalCards as any[]).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock size={16} className="text-yellow-400" />
              Pending Approval ({(approvalCards as any[]).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(approvalCards as any[]).slice(0, 5).map((action: any) => (
                <div key={action.id} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={handleDisabledAction}
                      className="px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded opacity-50 cursor-not-allowed"
                      title="Login required"
                    >
                      Approve
                    </button>
                    <button
                      onClick={handleDisabledAction}
                      className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded opacity-50 cursor-not-allowed"
                      title="Login required"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-Executed */}
      {(autoExecuted as any[]).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              Auto-Executed ({(autoExecuted as any[]).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(autoExecuted as any[]).slice(0, 5).map((action: any) => (
                <div key={action.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.executedAt ? new Date(action.executedAt).toLocaleDateString() : "—"}</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">executed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monitoring */}
      {(monitoring as any[]).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-400" />
              Monitoring ({(monitoring as any[]).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(monitoring as any[]).slice(0, 5).map((action: any) => (
                <div key={action.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">monitoring</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(approvalCards as any[]).length === 0 && (autoExecuted as any[]).length === 0 && (monitoring as any[]).length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Brain size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No AI actions available yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
