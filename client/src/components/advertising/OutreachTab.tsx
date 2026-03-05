import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DollarSign, Eye, Star, Megaphone,
  Plus, Building2, Globe, Edit2, Trash2,
  CheckCircle2, AlertCircle, XCircle, RefreshCw,
} from "lucide-react";
import type { CommunityOutreach } from "../../../../drizzle/schema";
import { OutreachForm } from "./OutreachForm";
import {
  OUTREACH_STATUS_CONFIG, ORG_TYPE_ICONS, REQUEST_TYPE_LABELS,
  fmt$, fmtNum,
  type OutreachStatus, type OutreachRequestType,
} from "./types";

const PIPELINE_ORDER: OutreachStatus[] = ["received", "under_review", "approved", "rejected", "fulfilled", "follow_up"];

export function OutreachTab() {
  const { data: requests = [], isLoading } = trpc.outreach.list.useQuery();
  const { data: summary } = trpc.outreach.getSummary.useQuery();
  const updateStatus = trpc.outreach.updateStatus.useMutation({
    onSuccess: () => {
      trpc.useUtils().outreach.list.invalidate();
      trpc.useUtils().outreach.getSummary.invalidate();
    },
  });
  const deleteR = trpc.outreach.delete.useMutation({
    onSuccess: () => {
      trpc.useUtils().outreach.list.invalidate();
      trpc.useUtils().outreach.getSummary.invalidate();
    },
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<CommunityOutreach | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = filterStatus === "all"
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  const kpis = summary ? [
    { label: "Total Requests", value: String(summary.total), icon: <Megaphone size={16} />, color: "text-blue-400" },
    { label: "Cash Donated", value: fmt$(summary.totalCashValue), icon: <DollarSign size={16} />, color: "text-[#E8453C]" },
    { label: "Perceived Value", value: fmt$(summary.totalPerceivedValue), icon: <Star size={16} />, color: "text-[#F5C72C]" },
    { label: "Est. Total Reach", value: fmtNum(summary.totalEstimatedReach), icon: <Eye size={16} />, color: "text-green-400" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(kpi => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  <span className={kpi.color}>{kpi.icon}</span>
                </div>
                <div className="text-xl font-bold text-foreground">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pipeline status strip */}
      {summary && (
        <div className="flex gap-2 flex-wrap">
          {PIPELINE_ORDER.map(s => {
            const cfg = OUTREACH_STATUS_CONFIG[s];
            const count = (summary.byStatus as Record<string, number>)[s] || 0;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${cfg.color} ${filterStatus === s ? "ring-2 ring-offset-1 ring-offset-background ring-current" : "opacity-70 hover:opacity-100"}`}
              >
                {cfg.icon} {cfg.label} <span className="font-bold">{count}</span>
              </button>
            );
          })}
          {filterStatus !== "all" && (
            <button onClick={() => setFilterStatus("all")} className="text-xs text-muted-foreground hover:text-foreground px-2">
              Clear filter ×
            </button>
          )}
        </div>
      )}

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Community Outreach Requests</h2>
          <p className="text-sm text-muted-foreground">Sponsorships, donations, partnerships from local organizations</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus size={14} /> Add Request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add Outreach Request</DialogTitle></DialogHeader>
            <OutreachForm onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Request cards */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="p-8 text-center">
            <Building2 size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              No outreach requests {filterStatus !== "all" ? `with status "${filterStatus}"` : "yet"}.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Add requests from local schools, nonprofits, and community organizations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => {
            const statusCfg = OUTREACH_STATUS_CONFIG[r.status as OutreachStatus] || OUTREACH_STATUS_CONFIG.received;
            const cashVal = parseFloat(String(r.actualCashValue || 0));
            const percVal = parseFloat(String(r.actualPerceivedValue || 0));
            const hasRoi = r.estimatedReach || r.actualLeadsGenerated || r.actualBookingsGenerated;
            return (
              <Card key={r.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
                        {ORG_TYPE_ICONS[r.orgType] || <Globe size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{r.orgName}</span>
                          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${statusCfg.color}`}>
                            {statusCfg.icon} {statusCfg.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                            {REQUEST_TYPE_LABELS[r.requestType as OutreachRequestType] || r.requestType}
                          </Badge>
                          {r.priority === "high" && (
                            <Badge variant="outline" className="text-xs bg-[#E8453C]/10 text-[#E8453C] border-[#E8453C]/30">High Priority</Badge>
                          )}
                          {r.is501c3 && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">501(c)3</Badge>
                          )}
                        </div>
                        {r.eventName && (
                          <p className="text-sm text-muted-foreground mt-0.5">{r.eventName}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/70 flex-wrap">
                          {r.eventDate && <span>📅 {new Date(String(r.eventDate)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                          {r.estimatedAttendees && <span>👥 ~{r.estimatedAttendees.toLocaleString()} attendees</span>}
                          {r.eventLocation && <span>📍 {r.eventLocation}</span>}
                          {r.contactName && <span>👤 {r.contactName}</span>}
                        </div>
                        {r.actualDonationType && (
                          <div className="mt-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400">
                            <span className="font-medium">We gave:</span> {r.actualDonationType}
                            {(cashVal > 0 || percVal > 0) && (
                              <span className="ml-2 text-green-400/70">
                                (Cash: {fmt$(cashVal)}{percVal > 0 ? ` / Perceived: ${fmt$(percVal)}` : ""})
                              </span>
                            )}
                          </div>
                        )}
                        {r.benefitsReceived && (
                          <p className="text-xs text-muted-foreground/70 mt-1.5">
                            <span className="text-muted-foreground font-medium">Benefits:</span> {r.benefitsReceived}
                          </p>
                        )}
                        {r.decisionNotes && (
                          <p className="text-xs text-muted-foreground/60 mt-1 italic">{r.decisionNotes}</p>
                        )}
                        {r.rejectionReason && (
                          <p className="text-xs text-[#E8453C]/70 mt-1">Rejected: {r.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditItem(r)}>
                            <Edit2 size={13} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader><DialogTitle>Edit Outreach Request</DialogTitle></DialogHeader>
                          {editItem?.id === r.id && (
                            <OutreachForm
                              onSuccess={() => setEditItem(null)}
                              initial={editItem as unknown as Record<string, unknown>}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-[#E8453C] hover:text-red-300"
                        onClick={() => { if (confirm("Delete this request?")) deleteR.mutate({ id: r.id }); }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Quick status actions */}
                  {(r.status === "received" || r.status === "under_review") && (
                    <div className="mt-3 flex gap-2 pt-3 border-t border-border">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-green-400 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "approved" })}>
                        <CheckCircle2 size={11} /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-[#F5C72C] border-yellow-500/30 hover:bg-yellow-500/10"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "under_review" })}>
                        <AlertCircle size={11} /> Under Review
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-[#E8453C] border-[#E8453C]/30 hover:bg-[#E8453C]/10"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "rejected" })}>
                        <XCircle size={11} /> Reject
                      </Button>
                    </div>
                  )}
                  {r.status === "approved" && (
                    <div className="mt-3 flex gap-2 pt-3 border-t border-border">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "fulfilled" })}>
                        <Star size={11} /> Mark Fulfilled
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "follow_up" })}>
                        <RefreshCw size={11} /> Follow Up
                      </Button>
                    </div>
                  )}

                  {/* ROI metrics */}
                  {hasRoi ? (
                    <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-border">
                      {[
                        { label: "Est. Reach", value: fmtNum(r.estimatedReach) },
                        { label: "Leads", value: fmtNum(r.actualLeadsGenerated) },
                        { label: "Bookings", value: fmtNum(r.actualBookingsGenerated) },
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <div className="text-sm font-semibold text-foreground">{m.value}</div>
                          <div className="text-xs text-muted-foreground">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
