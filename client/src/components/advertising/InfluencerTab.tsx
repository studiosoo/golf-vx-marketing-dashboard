import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DollarSign, Eye, Heart, TrendingUp, Target,
  Plus, Instagram, Globe, Edit2, Trash2,
} from "lucide-react";
import { InfluencerForm } from "./InfluencerForm";
import { PLATFORM_ICONS, INFLUENCER_STATUS_CONFIG, fmt$, fmtNum, type InfluencerStatus } from "./types";

export function InfluencerTab() {
  const { data: partnerships = [], isLoading } = trpc.influencer.list.useQuery();
  const deleteP = trpc.influencer.delete.useMutation({
    onSuccess: () => trpc.useUtils().influencer.list.invalidate(),
  });
  const utils = trpc.useUtils();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);

  const totalSpend = partnerships.reduce((s, p) => s + parseFloat(String(p.totalCost || 0)), 0);
  const totalReach = partnerships.reduce((s, p) => s + (p.actualReach || 0), 0);
  const totalEngagements = partnerships.reduce((s, p) => s + (p.actualEngagements || 0), 0);
  const totalBookings = partnerships.reduce((s, p) => s + (p.actualBookingsGenerated || 0), 0);
  const avgCPE = totalEngagements > 0 ? totalSpend / totalEngagements : 0;

  const kpis = [
    { label: "Total Spend", value: fmt$(totalSpend), icon: <DollarSign size={16} />, color: "text-[#E8453C]" },
    { label: "Total Reach", value: fmtNum(totalReach), icon: <Eye size={16} />, color: "text-blue-400" },
    { label: "Engagements", value: fmtNum(totalEngagements), icon: <Heart size={16} />, color: "text-pink-400" },
    { label: "Bookings Generated", value: fmtNum(totalBookings), icon: <Target size={16} />, color: "text-green-400" },
    { label: "Cost Per Engagement", value: avgCPE > 0 ? `$${avgCPE.toFixed(3)}` : "—", icon: <TrendingUp size={16} />, color: "text-[#F5C72C]" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Influencer Partnerships</h2>
          <p className="text-sm text-muted-foreground">
            {partnerships.length} partnership{partnerships.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus size={14} /> Add Partnership</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add Influencer Partnership</DialogTitle></DialogHeader>
            <InfluencerForm onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : partnerships.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="p-8 text-center">
            <Instagram size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">No influencer partnerships yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add your first partnership to start tracking ROI.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {partnerships.map((p) => {
            const cost = parseFloat(String(p.totalCost || 0));
            const cpe = p.actualEngagements && p.actualEngagements > 0 ? cost / p.actualEngagements : null;
            const statusCfg = INFLUENCER_STATUS_CONFIG[p.status as InfluencerStatus] || INFLUENCER_STATUS_CONFIG.contracted;
            const metrics = [
              { label: "Cost", value: fmt$(cost), highlight: true },
              { label: "Reach", value: fmtNum(p.actualReach) },
              { label: "Impressions", value: fmtNum(p.actualImpressions) },
              { label: "Engagements", value: fmtNum(p.actualEngagements) },
              { label: "Leads", value: fmtNum(p.actualLeadsGenerated) },
              { label: "CPE", value: cpe ? `$${cpe.toFixed(3)}` : "—" },
            ];
            return (
              <Card key={p.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                        {PLATFORM_ICONS[p.platform] || <Globe size={16} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{p.handle}</span>
                          <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</Badge>
                          {p.followerCount && (
                            <span className="text-xs text-muted-foreground">{fmtNum(p.followerCount)} followers</span>
                          )}
                        </div>
                        {p.deliverables && (
                          <p className="text-sm text-muted-foreground mt-0.5">{p.deliverables}</p>
                        )}
                        {p.campaignGoal && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5">Goal: {p.campaignGoal}</p>
                        )}
                        {p.dealDate && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {new Date(p.dealDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditItem(p as unknown as Record<string, unknown>)}>
                            <Edit2 size={13} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader><DialogTitle>Edit Partnership</DialogTitle></DialogHeader>
                          {editItem?.id === p.id && <InfluencerForm onSuccess={() => setEditItem(null)} initial={editItem} />}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-[#E8453C] hover:text-red-300"
                        onClick={() => {
                          if (confirm("Delete this partnership?")) {
                            deleteP.mutate({ id: p.id });
                            utils.influencer.list.invalidate();
                          }
                        }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3 pt-3 border-t border-border">
                    {metrics.map(m => (
                      <div key={m.label} className="text-center">
                        <div className={`text-sm font-semibold ${m.highlight ? "text-[#F5C72C]" : "text-foreground"}`}>
                          {m.value}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
