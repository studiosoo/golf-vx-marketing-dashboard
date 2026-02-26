import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search, Plus, Trash2, ExternalLink, ChevronRight, AlertTriangle,
  TrendingUp, Lightbulb, Target, BookOpen, Building2, Users,
  BarChart3, Calendar, DollarSign, Loader2, RefreshCw, ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";

type ReportCategory =
  | "b2b_corporate_events"
  | "local_demographics"
  | "competitor_analysis"
  | "seasonal_trends"
  | "membership_pricing"
  | "custom";

const CATEGORY_META: Record<ReportCategory, { label: string; icon: React.ElementType; color: string; description: string; campaignLink: string }> = {
  b2b_corporate_events: {
    label: "B2B Corporate Events",
    icon: Building2,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    description: "Corporate team-building, company outings, group bookings",
    campaignLink: "corporate_events",
  },
  local_demographics: {
    label: "Local Demographics",
    icon: Users,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    description: "Arlington Heights market profile, income, golf participation",
    campaignLink: "membership_acquisition",
  },
  competitor_analysis: {
    label: "Competitor Analysis",
    icon: BarChart3,
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    description: "Indoor golf venues, TopGolf, entertainment alternatives",
    campaignLink: "trial_conversion",
  },
  seasonal_trends: {
    label: "Seasonal Trends",
    icon: Calendar,
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    description: "Peak/slow seasons, holiday demand, weather patterns",
    campaignLink: "member_retention",
  },
  membership_pricing: {
    label: "Membership Pricing",
    icon: DollarSign,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    description: "Pricing strategy, tiers, corporate packages, upsells",
    campaignLink: "membership_acquisition",
  },
  custom: {
    label: "Custom Research",
    icon: Search,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
    description: "Any custom research topic",
    campaignLink: "",
  },
};

const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

type Report = {
  id: number;
  title: string;
  topic: string;
  category: ReportCategory;
  status: "generating" | "ready" | "archived";
  summary: string | null;
  keyFindings: string[] | null;
  opportunities: string[] | null;
  risks: string[] | null;
  recommendedActions: Array<{ action: string; priority: "high" | "medium" | "low"; campaignType: string }> | null;
  sources: string[] | null;
  linkedCampaignIds: string[] | null;
  createdAt: Date;
};

export default function MarketResearch() {
  const [, setLocation] = useLocation();
  const [newReportOpen, setNewReportOpen] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    topic: "",
    category: "b2b_corporate_events" as ReportCategory,
    customContext: "",
  });

  const { data: reportsRaw = [], isLoading, refetch } = trpc.research.list.useQuery(undefined, {
    refetchInterval: (query) => {
      // Poll every 3s if any report is still generating
      const hasGenerating = query.state.data?.some((r) => r.status === "generating");
      return hasGenerating ? 3000 : false;
    },
  });
  const reports = reportsRaw as unknown as Report[];

  const generateMutation = trpc.research.generate.useMutation({
    onSuccess: () => {
      toast.success("Research report is being generated…");
      setNewReportOpen(false);
      setForm({ title: "", topic: "", category: "b2b_corporate_events", customContext: "" });
      setGenerating(false);
      refetch();
    },
    onError: (err) => {
      toast.error(`Generation failed: ${err.message}`);
      setGenerating(false);
    },
  });

  const deleteMutation = trpc.research.delete.useMutation({
    onSuccess: () => {
      toast.success("Report deleted");
      refetch();
      if (viewReport) setViewReport(null);
    },
  });

  const handleGenerate = () => {
    if (!form.title.trim() || !form.topic.trim()) {
      toast.error("Please enter a title and topic");
      return;
    }
    setGenerating(true);
    generateMutation.mutate(form);
  };

  const handleCategoryPreset = (category: ReportCategory) => {
    const meta = CATEGORY_META[category];
    setForm(prev => ({
      ...prev,
      category,
      title: category !== "custom" ? `${meta.label} — Arlington Heights` : prev.title,
      topic: category !== "custom" ? meta.description : prev.topic,
    }));
  };

  const readyReports = (reports as Report[]).filter((r: Report) => r.status === "ready");
  const generatingReports = (reports as Report[]).filter((r: Report) => r.status === "generating");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Research</h1>
          <p className="text-muted-foreground mt-1">
            AI-generated research reports to inform campaign strategy and B2B outreach
          </p>
        </div>
        <Button onClick={() => setNewReportOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Quick-start category cards */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Quick-start research topics</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.entries(CATEGORY_META) as [ReportCategory, typeof CATEGORY_META[ReportCategory]][]).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <button
                key={key}
                onClick={() => {
                  handleCategoryPreset(key);
                  setNewReportOpen(true);
                }}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left group"
              >
                <div className="p-1.5 rounded-md bg-muted mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{meta.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{meta.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Generating reports */}
      {generatingReports.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Generating…</p>
          {generatingReports.map((r: Report) => (
            <Card key={r.id} className="border-amber-200 dark:border-amber-800/50">
              <CardContent className="flex items-center gap-3 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">AI is researching and writing your report…</p>
                </div>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 shrink-0">Generating</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ready reports */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : readyReports.length === 0 && generatingReports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-lg">No research reports yet</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
              Generate your first report to inform your B2B corporate events campaign or membership strategy.
            </p>
            <Button className="mt-4 gap-2" onClick={() => setNewReportOpen(true)}>
              <Plus className="h-4 w-4" />
              Generate First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {readyReports.map((report: Report) => {
            const meta = CATEGORY_META[report.category];
            const Icon = meta.icon;
            const actions = report.recommendedActions || [];
            const highPriority = actions.filter(a => a.priority === "high").length;
            return (
              <Card
                key={report.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setViewReport(report)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-md bg-muted shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base leading-tight truncate">{report.title}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${meta.color} shrink-0 text-xs`}>{meta.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{report.summary}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" />
                      {(report.keyFindings || []).length} findings
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {(report.opportunities || []).length} opportunities
                    </span>
                    {highPriority > 0 && (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                        <Target className="h-3.5 w-3.5" />
                        {highPriority} high-priority actions
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 px-2">
                      View Report <ArrowRight className="h-3 w-3" />
                    </Button>
                    {meta.campaignLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation("/campaigns");
                        }}
                      >
                        Use in Campaign <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Report Dialog */}
      <Dialog open={newReportOpen} onOpenChange={setNewReportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Market Research Report</DialogTitle>
            <DialogDescription>
              The AI will research and write a structured report with key findings, opportunities, risks, and recommended campaign actions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Research Category</label>
              <Select value={form.category} onValueChange={(v) => handleCategoryPreset(v as ReportCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_META) as [ReportCategory, typeof CATEGORY_META[ReportCategory]][]).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Report Title</label>
              <Input
                placeholder="e.g. B2B Corporate Events — Arlington Heights Q1 2026"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Research Focus</label>
              <Input
                placeholder="What specific aspect should the report focus on?"
                value={form.topic}
                onChange={e => setForm(prev => ({ ...prev, topic: e.target.value }))}
              />
            </div>
            {form.category === "custom" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Additional Context (optional)</label>
                <Textarea
                  placeholder="Any specific context, constraints, or questions to address…"
                  value={form.customContext}
                  onChange={e => setForm(prev => ({ ...prev, customContext: e.target.value }))}
                  rows={3}
                />
              </div>
            )}
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Report generation typically takes 15–30 seconds. The report will appear in your list automatically when ready.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewReportOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {generating ? "Generating…" : "Generate Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      {viewReport && (
        <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between gap-2 pr-6">
                <div>
                  <DialogTitle className="text-xl leading-tight">{viewReport.title}</DialogTitle>
                  <DialogDescription className="mt-1">
                    {CATEGORY_META[viewReport.category].label} •{" "}
                    {new Date(viewReport.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </DialogDescription>
                </div>
                <Badge className={CATEGORY_META[viewReport.category].color}>
                  {CATEGORY_META[viewReport.category].label}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Summary */}
              {viewReport.summary && (
                <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
                  <p className="text-sm font-medium mb-1">Executive Summary</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{viewReport.summary}</p>
                </div>
              )}

              {/* Key Findings */}
              {viewReport.keyFindings && viewReport.keyFindings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <p className="font-medium">Key Findings</p>
                  </div>
                  <ul className="space-y-2">
                    {viewReport.keyFindings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground shrink-0 mt-0.5">{i + 1}.</span>
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunities */}
              {viewReport.opportunities && viewReport.opportunities.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <p className="font-medium">Opportunities</p>
                  </div>
                  <ul className="space-y-2">
                    {viewReport.opportunities.map((o, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                        <span className="text-muted-foreground">{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {viewReport.risks && viewReport.risks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <p className="font-medium">Risks & Challenges</p>
                  </div>
                  <ul className="space-y-2">
                    {viewReport.risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
                        <span className="text-muted-foreground">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {viewReport.recommendedActions && viewReport.recommendedActions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-blue-500" />
                    <p className="font-medium">Recommended Campaign Actions</p>
                  </div>
                  <div className="space-y-2">
                    {viewReport.recommendedActions.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                        <Badge className={`${PRIORITY_COLORS[a.priority]} text-xs shrink-0 mt-0.5`}>
                          {a.priority}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{a.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Campaign: {a.campaignType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {viewReport.sources && viewReport.sources.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Data Sources & References</p>
                  <ul className="space-y-1">
                    {viewReport.sources.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => deleteMutation.mutate({ id: viewReport.id })}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setViewReport(null);
                  setLocation("/campaigns");
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Apply to Campaign
              </Button>
              <Button size="sm" onClick={() => setViewReport(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
