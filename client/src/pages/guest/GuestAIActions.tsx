// Guest version of AIActions — uses autonomous.getAllActions (public) endpoint
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Lock } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  auto_executed: "bg-green-500/20 text-green-300 border-green-500/30",
  pending_approval: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  monitoring: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  approved: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

export default function GuestAIActions() {
  const { data: actions = [], isLoading } = trpc.autonomous.getAllActions.useQuery();

  const handleDisabledAction = () => {
    toast.warning("Login required to perform this action");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Actions</h1>
          <p className="text-muted-foreground text-sm mt-1">Autonomous AI-generated marketing actions</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-1.5">
          <Lock size={11} />
          <span>Approve/Run disabled in guest mode</span>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot size={16} />
            All Actions ({(actions as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : (actions as any[]).length === 0 ? (
            <div className="text-center py-12">
              <Bot size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No AI actions generated yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(actions as any[]).map((action: any) => (
                <div key={action.id} className="flex items-start justify-between py-3 border-b border-border last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">{action.title}</p>
                      <Badge className={`text-xs border ${statusColors[action.status] || "bg-gray-500/20 text-gray-300"}`}>
                        {action.status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    {action.riskLevel && (
                      <p className="text-xs text-muted-foreground mt-0.5">Risk: {action.riskLevel}</p>
                    )}
                  </div>
                  {action.status === "pending_approval" && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={handleDisabledAction}
                        className="px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded opacity-50 cursor-not-allowed"
                      >
                        Approve
                      </button>
                      <button
                        onClick={handleDisabledAction}
                        className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded opacity-50 cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
