import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { appRoutes, DEFAULT_VENUE_SLUG } from "@/lib/routes";
import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Flag,
  Calendar,
  DollarSign,
  Users,
  Target,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Clock,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  Sparkles,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type CampaignStatus = "planned" | "active" | "completed" | "paused";
type StrategicCampaign =
  | "trial_conversion"
  | "membership_acquisition"
  | "member_retention"
  | "corporate_events";

interface Program {
  id: number;
  name: string;
  status: CampaignStatus;
  category: StrategicCampaign;
  type: string;
  description?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  budget: string | number;
  actualSpend: string | number;
  targetRevenue?: string | number | null;
  actualRevenue: string | number;
  targetApplications?: number | null;
  actualApplications: number;
  targetConversions?: number | null;
  actualConversions: number;
  posterImageUrl?: string | null;
  goalType?: string | null;
  goalTarget?: string | number | null;
  goalActual?: string | number | null;
  goalUnit?: string | null;
  performanceScore?: number | null;
  metaAdsCampaignId?: string | null;
  primaryKpi?: string | null;
  kpiTarget?: string | number | null;
  kpiActual?: string | number | null;
  kpiUnit?: string | null;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_META: Record<CampaignStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active: { label: "Active", color: "#3DB855", bg: "#F0FAF3", icon: PlayCircle },
  planned: { label: "Planned", color: "#888888", bg: "#F5F5F5", icon: Clock },
  completed: { label: "Completed", color: "#AAAAAA", bg: "#F5F5F5", icon: CheckCircle },
  paused: { label: "Paused", color: "#AAAAAA", bg: "#F5F5F5", icon: PauseCircle },
};

const STRATEGIC_META: Record<StrategicCampaign, { label: string; color: string }> = {
  trial_conversion: { label: "Trial Conversion", color: "#3DB855" },
  membership_acquisition: { label: "Membership Acquisition", color: "#F5C72C" },
  member_retention: { label: "Member Retention", color: "#888888" },
  corporate_events: { label: "B2B Sales", color: "#111111" },
};

function getProgramRoute(program: Program): string {
  const name = program.name.toLowerCase();
  const pd = appRoutes.venue(DEFAULT_VENUE_SLUG).operations.programDetail;
  // Only route to slugs that have a dedicated detail page in ProgramDetailRouter
  if (name.includes("drive day") || name.includes("sunday clinic")) return pd("drive-day");
  if (name.includes("winter clinic")) return pd("winter-clinics");
  if (name.includes("league") || name.includes("tournament")) return pd("leagues");
  // Everything else uses numeric ID so GenericProgramDetail can load real campaign data
  return pd(program.id);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function fmtCurrency(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "number" ? v : parseFloat(v) || 0;
}
function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─────────────────────────────────────────────
// Program Card
// ─────────────────────────────────────────────
function ProgramCard({ program, onClick }: { program: Program; onClick: () => void }) {
  const status = STATUS_META[program.status] || STATUS_META.planned;
  const strategic = STRATEGIC_META[program.category] || { label: program.category, color: "#888888" };
  const StatusIcon = status.icon;

  const budget = toNum(program.budget);
  const spend = toNum(program.actualSpend);
  const revenue = toNum(program.actualRevenue);
  const budgetPct = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
  const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
  const hasMetaAds = !!program.metaAdsCampaignId;
  const score = program.performanceScore;
  // "Ad ended but program still running" — date-based check
  const isDateActive = program.endDate ? new Date(program.endDate) >= new Date() : false;
  const adEndedButRunning = isDateActive && (program.status === "paused" || program.status === "completed");
  // KPI display mode for non-revenue campaigns (giveaway, follower growth, trial bookings, etc.)
  const useKpiDisplay = program.goalType === 'leads' || program.goalType === 'followers' ||
    (program.primaryKpi === 'Trial Bookings');
  const goalActual = toNum(program.goalActual);
  const goalTarget = toNum(program.goalTarget);
  const goalPct = goalTarget > 0 ? Math.min((goalActual / goalTarget) * 100, 100) : 0;
  const kpiActual = toNum(program.kpiActual);
  const kpiTarget = toNum(program.kpiTarget);
  const kpiPct = kpiTarget > 0 ? Math.min((kpiActual / kpiTarget) * 100, 100) : 0;
  // Determine KPI label and value display based on program type
  const isTrialBookings = program.primaryKpi === 'Trial Bookings';
  const isEngagements = program.kpiUnit === 'engagements';
  const isFollowers = program.goalType === 'followers';
  const isLeads = program.goalType === 'leads' && !isTrialBookings;

  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-white rounded-xl border border-[#E0E0E0] p-4 hover:shadow-[0_2px_16px_rgba(245,199,44,0.18)] hover:border-[#F5C72C] transition-all duration-200 group flex flex-col gap-3 border-l-4 border-l-[#F5C72C]"
    >
      {/* Top row: status + strategic tag */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="h-5 px-2 rounded-full flex items-center gap-1" style={{ background: status.bg }}>
            <StatusIcon className="h-3 w-3" style={{ color: status.color }} />
            <span className="text-[10px] font-semibold" style={{ color: status.color }}>{status.label}</span>
          </div>
          {hasMetaAds && (
            <div className="h-5 px-2 rounded-full bg-[#F5F5F5] border border-[#E0E0E0] flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-[#888888]" />
              <span className="text-[10px] font-semibold text-[#888888]">Meta</span>
            </div>
          )}
          {adEndedButRunning && (
            <div className="h-5 px-2 rounded-full bg-[#F0FAF3] flex items-center gap-1">
              <PlayCircle className="h-3 w-3 text-[#3DB855]" />
              <span className="text-[10px] font-semibold text-[#3DB855]">Still Running</span>
            </div>
          )}
          {/* Metric type indicator */}
          {!useKpiDisplay && spend > 0 && revenue > 0 ? (
            <div className="h-5 px-2 rounded-full bg-green-50 border border-green-200 flex items-center">
              <span className="text-[10px] font-semibold text-green-700">ROAS</span>
            </div>
          ) : !useKpiDisplay && spend > 0 ? (
            <div className="h-5 px-2 rounded-full bg-blue-50 border border-blue-200 flex items-center">
              <span className="text-[10px] font-semibold text-blue-700">ROI</span>
            </div>
          ) : useKpiDisplay ? (
            <div className="h-5 px-2 rounded-full bg-amber-50 border border-amber-200 flex items-center">
              <span className="text-[10px] font-semibold text-amber-700">KPI</span>
            </div>
          ) : null}
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-[#CCCCCC] group-hover:text-[#888888] transition-colors shrink-0 mt-0.5" />
      </div>

      {/* Program name */}
      <div>
        <h3 className="text-[14px] font-bold text-[#111111] leading-tight line-clamp-2">{program.name}</h3>
        {program.description && (
          <p className="text-[12px] text-[#888888] mt-1 line-clamp-2">{program.description}</p>
        )}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#AAAAAA]">
        <Calendar className="h-3 w-3" />
        <span>{fmtDate(program.startDate)} – {fmtDate(program.endDate)}</span>
      </div>

      {/* Metrics row — KPI mode for non-revenue campaigns */}
      {useKpiDisplay ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <p className="text-[14px] font-bold text-[#111111] leading-none">{fmtCurrency(spend)}</p>
              <p className="text-[10px] text-[#AAAAAA] mt-0.5">Spend</p>
            </div>
            {isTrialBookings ? (
              <>
                <div>
                  <p className="text-[14px] font-bold text-[#111111] leading-none">{kpiActual > 0 ? kpiActual.toFixed(0) : '—'}</p>
                  <p className="text-[10px] text-[#AAAAAA] mt-0.5">Bookings</p>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#111111] leading-none">{fmtCurrency(revenue)}</p>
                  <p className="text-[10px] text-[#AAAAAA] mt-0.5">Revenue</p>
                </div>
              </>
            ) : isEngagements ? (
              <>
                <div>
                  <p className="text-[14px] font-bold text-[#111111] leading-none">{kpiActual > 0 ? kpiActual.toLocaleString() : '—'}</p>
                  <p className="text-[10px] text-[#AAAAAA] mt-0.5">Engagements</p>
                </div>
                <div>
                  <p className={cn("text-[14px] font-bold leading-none", "text-[#3DB855]")}>  
                    {toNum(program.kpiActual) > 0 ? `$${(spend / kpiActual).toFixed(4)}` : '—'}
                  </p>
                  <p className="text-[10px] text-[#AAAAAA] mt-0.5">Cost/Engage</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[14px] font-bold text-[#111111] leading-none">{goalActual > 0 ? goalActual.toLocaleString() : '—'}</p>
                  <p className="text-[10px] text-[#AAAAAA] mt-0.5 capitalize">{program.goalUnit || 'Progress'}</p>
                </div>
                <div>
                  <p className={cn("text-[14px] font-bold leading-none",
                    toNum(program.kpiActual) > 0 && toNum(program.kpiTarget) > 0 && toNum(program.kpiActual) <= toNum(program.kpiTarget) ? "text-[#3DB855]"
                    : toNum(program.kpiActual) > 0 ? "text-[#F5A623]" : "text-[#AAAAAA]")}>  
                    {toNum(program.kpiActual) > 0 ? `$${toNum(program.kpiActual).toFixed(2)}` : '—'}
                  </p>
                  <p className="text-[10px] text-[#AAAAAA] mt-0.5 truncate" title={program.primaryKpi || 'KPI'}>
                    {program.primaryKpi || 'KPI'}
                  </p>
                </div>
              </>
            )}
          </div>
          {/* Progress bar — bookings for trial, engagements for IG, goal progress for leads */}
          <div>
            {isTrialBookings ? (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-[#AAAAAA]">{kpiActual.toFixed(0)} / {kpiTarget.toFixed(0)} bookings</span>
                  <span className="text-[10px] font-semibold text-[#111111]">{kpiPct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#F5C72C]" style={{ width: `${kpiPct}%` }} />
                </div>
              </>
            ) : isEngagements ? (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-[#AAAAAA]">{kpiActual.toLocaleString()} engagements · Jan–Mar 2026</span>
                  <span className="text-[10px] font-semibold text-[#3DB855]">Live</span>
                </div>
                <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#3DB855]" style={{ width: '100%' }} />
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-[#AAAAAA]">
                    {goalActual.toLocaleString()} / {goalTarget.toLocaleString()} {program.goalUnit}
                  </span>
                  <span className="text-[10px] font-semibold text-[#111111]">{goalPct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#F5C72C]" style={{ width: `${goalPct}%` }} />
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <p className="text-[14px] font-bold text-[#111111] leading-none">{fmtCurrency(spend)}</p>
            <p className="text-[10px] text-[#AAAAAA] mt-0.5">Ad Spend</p>
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#111111] leading-none">{fmtCurrency(revenue)}</p>
            <p className="text-[10px] text-[#AAAAAA] mt-0.5">Revenue</p>
          </div>
          {spend > 0 && revenue > 0 ? (
            <div>
              <p className={cn("text-[14px] font-bold leading-none", (revenue / spend) >= 1 ? "text-[#3DB855]" : "text-[#E8453C]")}>
                {(revenue / spend).toFixed(1)}x
              </p>
              <p className="text-[10px] text-[#AAAAAA] mt-0.5">ROAS</p>
            </div>
          ) : (
            <div>
              <p className={cn("text-[14px] font-bold leading-none", roi >= 0 ? "text-[#3DB855]" : "text-[#E8453C]")}>
                {spend > 0 ? (roi >= 0 ? "+" : "") + roi.toFixed(0) + "%" : "—"}
              </p>
              <p className="text-[10px] text-[#AAAAAA] mt-0.5">ROI</p>
            </div>
          )}
        </div>
      )}

      {/* Budget bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-[#AAAAAA]">Budget: {fmtCurrency(budget)}</span>
          {score !== null && score !== undefined && (
            <span className="text-[10px] font-semibold" style={{ color: score >= 70 ? "#3DB855" : score >= 40 ? "#F5C72C" : "#AAAAAA" }}>
              Score: {score}/100
            </span>
          )}
        </div>
        <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#F5C72C]"
            style={{ width: `${budgetPct}%` }}
          />
        </div>
      </div>

      {/* Strategic tag */}
      <div className="flex items-center gap-1">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: strategic.color }} />
        <span className="text-[10px] text-[#888888]">{strategic.label}</span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// Add Program Dialog
// ─────────────────────────────────────────────
function AddProgramDialog({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "member_retention" as StrategicCampaign,
    type: "event_specific" as const,
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    budget: "",
  });

  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      toast({ title: "Program created", description: `"${form.name}" has been added.` });
      utils.campaigns.list.invalidate();
      setOpen(false);
      onSuccess();
      setForm({ name: "", category: "member_retention", type: "event_specific", description: "", startDate: new Date().toISOString().split("T")[0], endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], budget: "" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.budget) return;
    createMutation.mutate({
      name: form.name,
      category: form.category,
      type: form.type,
      description: form.description || undefined,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      budget: form.budget,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-add-program className="bg-[#F5C72C] text-[#111111] font-semibold hover:brightness-95 active:scale-95 transition-all h-9 px-4 text-[13px]">
          <Plus className="h-4 w-4 mr-1.5" />
          New Program
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white border border-[#E0E0E0]">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold text-[#111111]">Add New Program</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-[12px] font-semibold text-[#888888]">Program Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Spring Drive Day 2026" className="mt-1 text-[13px]" required />
          </div>
          <div>
            <Label className="text-[12px] font-semibold text-[#888888]">Strategic Campaign</Label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as StrategicCampaign }))} className="mt-1 w-full border border-[#E0E0E0] rounded-md px-3 py-2 text-[13px] text-[#111111] bg-white">
              <option value="trial_conversion">Trial Conversion</option>
              <option value="membership_acquisition">Membership Acquisition</option>
              <option value="member_retention">Member Retention</option>
              <option value="corporate_events">B2B Sales</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px] font-semibold text-[#888888]">Start Date *</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="mt-1 text-[13px]" required />
            </div>
            <div>
              <Label className="text-[12px] font-semibold text-[#888888]">End Date *</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="mt-1 text-[13px]" required />
            </div>
          </div>
          <div>
            <Label className="text-[12px] font-semibold text-[#888888]">Budget ($) *</Label>
            <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="500" className="mt-1 text-[13px]" required />
          </div>
          <div>
            <Label className="text-[12px] font-semibold text-[#888888]">Description</Label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the program..." className="mt-1 w-full border border-[#E0E0E0] rounded-md px-3 py-2 text-[13px] text-[#111111] resize-none h-20" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 text-[13px] h-9">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-[#F5C72C] text-[#111111] font-semibold hover:brightness-95 text-[13px] h-9">
              {createMutation.isPending ? "Creating..." : "Create Program"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function Programs() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "running" | CampaignStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | StrategicCampaign>("all");

  const { data: programs, isLoading, refetch } = trpc.campaigns.list.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
  });

  const STATUS_ORDER: Record<CampaignStatus, number> = { active: 0, planned: 1, completed: 2, paused: 3 };

  const today = new Date();

  const filtered = useMemo(() => {
    if (!programs) return [];
    return programs
      .filter((p: Program) => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase());
        const endDate = p.endDate ? new Date(p.endDate) : null;
        const startDate = p.startDate ? new Date(p.startDate) : null;
        const isDateRunning = startDate && endDate && startDate <= today && endDate >= today;
        const matchStatus = statusFilter === "all"
          ? true
          : statusFilter === "running"
            ? isDateRunning
            : p.status === statusFilter;
        const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
        return matchSearch && matchStatus && matchCategory;
      })
      .sort((a: Program, b: Program) => {
        const orderA = STATUS_ORDER[a.status] ?? 4;
        const orderB = STATUS_ORDER[b.status] ?? 4;
        return orderA - orderB;
      });
  }, [programs, search, statusFilter, categoryFilter]);

  const counts = useMemo(() => {
    if (!programs) return { active: 0, planned: 0, completed: 0, paused: 0 };
    return {
      active: programs.filter((p: Program) => p.status === "active").length,
      planned: programs.filter((p: Program) => p.status === "planned").length,
      completed: programs.filter((p: Program) => p.status === "completed").length,
      paused: programs.filter((p: Program) => p.status === "paused").length,
    };
  }, [programs]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#111111] leading-tight">Programs & Events</h1>
          <p className="text-[13px] text-[#888888] mt-0.5">
            {programs?.length ?? 0} programs · {counts.active} active · {counts.planned} planned
          </p>
        </div>
        <AddProgramDialog onSuccess={refetch} />
      </div>

      {/* Status summary pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "running", "active", "planned", "completed", "paused"] as const).map((s) => {
          const meta = s === "all" || s === "running" ? null : STATUS_META[s];
          const count = s === "all"
            ? (programs?.length ?? 0)
            : s === "running"
              ? (programs?.filter((p: Program) => { const e = p.endDate ? new Date(p.endDate) : null; const st = p.startDate ? new Date(p.startDate) : null; return st && e && st <= today && e >= today; }).length ?? 0)
              : counts[s as CampaignStatus];
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-semibold transition-all border",
                isActive
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-white text-[#888888] border-[#E0E0E0] hover:border-[#CCCCCC]"
              )}
            >
              {s === "running" && <PlayCircle className="h-3 w-3" style={{ color: isActive ? "white" : "#3DB855" }} />}
              {meta && <meta.icon className="h-3 w-3" style={{ color: isActive ? "white" : meta.color }} />}
              {s === "all" ? "All" : s === "running" ? "Running" : meta!.label}
              <span className={cn("text-[10px]", isActive ? "text-white/70" : "text-[#AAAAAA]")}>{count}</span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            className="h-7 border border-[#E0E0E0] rounded-full px-3 text-[12px] text-[#888888] bg-white"
          >
            <option value="all">All Campaigns</option>
            <option value="trial_conversion">Trial Conversion</option>
            <option value="membership_acquisition">Membership Acquisition</option>
            <option value="member_retention">Member Retention</option>
            <option value="corporate_events">B2B Sales</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AAAAAA]" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search programs..."
          className="pl-9 h-9 text-[13px] border-[#E0E0E0] bg-white"
        />
      </div>

      {/* Card grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="h-52 bg-[#F5F5F5] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Flag className="h-10 w-10 text-[#DDDDDD] mb-3" />
          <p className="text-[14px] font-semibold text-[#888888]">
            {search || statusFilter !== "all" || categoryFilter !== "all" ? "No programs match your filters" : "No programs yet"}
          </p>
          <p className="text-[12px] text-[#AAAAAA] mt-1">
            {search || statusFilter !== "all" || categoryFilter !== "all" ? "Try adjusting your search or filters" : "Click 'New Program' to add your first program"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((program: Program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onClick={() => setLocation(getProgramRoute(program))}
            />
          ))}
          {/* Add new card */}
          <button
            onClick={() => document.querySelector<HTMLButtonElement>("[data-add-program]")?.click()}
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#E0E0E0] rounded-xl p-6 text-[#AAAAAA] hover:border-[#F5C72C] hover:text-[#888888] transition-colors min-h-[200px]"
          >
            <Plus className="h-8 w-8" />
            <span className="text-[13px] font-medium">Add Program</span>
          </button>
        </div>
      )}
    </div>
  );
}
