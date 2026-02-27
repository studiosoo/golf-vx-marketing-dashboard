import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, DollarSign, BarChart3, ChevronRight, TrendingDown, Search, ChevronDown, Mail, Loader2, BookOpen, ArrowUpDown, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

const CAMPAIGN_COLORS: Record<string, string> = {
  trial_conversion: "emerald",
  membership_acquisition: "pink",
  member_retention: "blue",
  corporate_events: "amber",
};

const CAMPAIGN_BG_COLORS: Record<string, string> = {
  emerald: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white font-semibold shadow-sm cursor-pointer hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-colors",
  pink: "bg-pink-600 text-white dark:bg-pink-500 dark:text-white font-semibold shadow-sm cursor-pointer hover:bg-pink-700 dark:hover:bg-pink-400 transition-colors",
  blue: "bg-blue-600 text-white dark:bg-blue-500 dark:text-white font-semibold shadow-sm cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors",
  amber: "bg-amber-500 text-white dark:bg-amber-400 dark:text-gray-900 font-semibold shadow-sm cursor-pointer hover:bg-amber-600 dark:hover:bg-amber-300 transition-colors",
};

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-600 text-white dark:bg-green-500 dark:text-white border-0 font-medium";
    case "completed":
      return "bg-slate-500 text-white dark:bg-slate-400 dark:text-white border-0 font-medium";
    case "paused":
      return "bg-yellow-500 text-white dark:bg-yellow-400 dark:text-gray-900 border-0 font-medium";
    case "planned":
      return "bg-blue-500 text-white dark:bg-blue-400 dark:text-white border-0 font-medium";
    default:
      return "bg-slate-400 text-white border-0 font-medium";
  }
}

type SortOption = "roi" | "date" | "status";

type EmailDraft = {
  subject: string;
  preheader: string;
  emails: Array<{
    emailNumber: number;
    subject: string;
    preheader: string;
    body: string;
    callToAction: string;
    sendDelay: string;
  }>;
};

function EmailDraftModal({
  open,
  onClose,
  draft,
  title,
}: {
  open: boolean;
  onClose: () => void;
  draft: EmailDraft;
  title: string;
}) {
  const [expandedEmail, setExpandedEmail] = useState<number>(1);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            AI-generated email sequence. Review, edit, and copy into Encharge or your email tool.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 space-y-3 mt-2">
          {draft.emails.map((email) => (
            <div key={email.emailNumber} className="border border-border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                onClick={() => setExpandedEmail(expandedEmail === email.emailNumber ? -1 : email.emailNumber)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{email.emailNumber}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{email.subject}</p>
                    <p className="text-xs text-muted-foreground">{email.sendDelay} · {email.callToAction}</p>
                  </div>
                </div>
                {expandedEmail === email.emailNumber ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
              {expandedEmail === email.emailNumber && (
                <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/10">
                  <div className="pt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</p>
                    <p className="text-sm font-medium">{email.subject}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preheader</p>
                    <p className="text-sm text-muted-foreground">{email.preheader}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Body</p>
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleCopy(`Subject: ${email.subject}\nPreheader: ${email.preheader}\n\n${email.body}\n\nCTA: ${email.callToAction}`, email.emailNumber)}
                  >
                    {copiedIdx === email.emailNumber ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedIdx === email.emailNumber ? "Copied!" : "Copy Email"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StrategicCampaigns() {
  const [, setLocation] = useLocation();
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});
  const [programSort, setProgramSort] = useState<Record<string, SortOption>>({});
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [draftModalOpen, setDraftModalOpen] = useState(false);

  const { data: campaigns, isLoading } = trpc.strategicCampaigns.getOverview.useQuery();
  const { data: kpiData } = trpc.intelligence.getStrategicKPIs.useQuery();
  const { data: latestB2BResearch } = trpc.research.getLatestByCategory.useQuery({ category: "b2b_corporate_events" });
  const { data: funnelData } = trpc.campaigns.getDriveDayFunnel.useQuery({});

  const generateOutreachMutation = trpc.research.generateB2BOutreachEmail.useMutation({
    onSuccess: (result) => {
      if (result.success && result.draft) {
        setEmailDraft(result.draft as EmailDraft);
        setDraftModalOpen(true);
      } else {
        toast.error("Failed to generate outreach email");
      }
    },
    onError: (err) => toast.error(`Generation failed: ${err.message}`),
  });

  function togglePrograms(campaignId: string) {
    setExpandedPrograms(prev => ({ ...prev, [campaignId]: !prev[campaignId] }));
  }

  type Program = { id: number; name: string; status: string; spend: number; revenue: number; startDate?: string | null; [key: string]: unknown };
  function getSortedPrograms(programs: Program[], sort: SortOption) {
    const sorted = [...programs];
    switch (sort) {
      case "roi":
        return sorted.sort((a, b) => {
          const roiA = a.spend > 0 ? ((a.revenue - a.spend) / a.spend) * 100 : 0;
          const roiB = b.spend > 0 ? ((b.revenue - b.spend) / b.spend) * 100 : 0;
          return roiB - roiA;
        });
      case "date":
        return sorted.sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        });
      case "status": {
        const statusOrder: Record<string, number> = { active: 0, planned: 1, paused: 2, completed: 3 };
        return sorted.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
      }
      default:
        return sorted;
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground mt-1">Strategic campaign overview with program performance and ROI tracking</p>
      </div>

      {/* Summary KPI Bar */}
      {kpiData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">Membership Growth</span>
            </div>
            <p className="text-2xl font-bold">{kpiData.membershipAcquisition.current}</p>
            <p className="text-xs text-muted-foreground">Goal: {kpiData.membershipAcquisition.target}</p>
            <Progress value={(kpiData.membershipAcquisition.current / kpiData.membershipAcquisition.target) * 100} className="mt-2 h-1.5" />
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-pink-500" />
              <span className="text-xs text-muted-foreground font-medium">Trial Conversion</span>
            </div>
            <p className="text-2xl font-bold">{kpiData.trialConversion.current.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Goal: {kpiData.trialConversion.target}%</p>
            <Progress value={(kpiData.trialConversion.current / kpiData.trialConversion.target) * 100} className="mt-2 h-1.5" />
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground font-medium">Member Retention</span>
            </div>
            <p className="text-2xl font-bold">{kpiData.memberRetention.current} <span className="text-sm font-normal text-muted-foreground">/ 300</span></p>
            <p className="text-xs text-muted-foreground">All Access: {kpiData.memberRetention.breakdown?.allAccess ?? 0} · Swing Saver: {kpiData.memberRetention.breakdown?.swingSaver ?? 0}</p>
            <Progress value={(kpiData.memberRetention.current / 300) * 100} className="mt-2 h-1.5" />
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground font-medium">B2B Events</span>
            </div>
            <p className="text-2xl font-bold">{kpiData.corporateEvents.current} booked</p>
            <p className="text-xs text-muted-foreground">Goal: {kpiData.corporateEvents.target}/month</p>
            <Progress value={(kpiData.corporateEvents.current / kpiData.corporateEvents.target) * 100} className="mt-2 h-1.5" />
          </Card>
        </div>
      )}

      {/* Campaign Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {campaigns?.map(campaign => {
          const colorClass = CAMPAIGN_BG_COLORS[campaign.color] || CAMPAIGN_BG_COLORS.blue;
          const isExpanded = expandedPrograms[campaign.id] ?? true;
          const sort = programSort[campaign.id] ?? "roi";
          const sortedPrograms = getSortedPrograms(campaign.programs, sort);

          return (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                  </div>
                  <Badge
                    className={colorClass}
                    onClick={() => togglePrograms(campaign.id)}
                    title={isExpanded ? "Hide programs" : "Show programs"}
                  >
                    {campaign.totalPrograms} {campaign.totalPrograms === 1 ? "program" : "programs"}
                    <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Goal/KPI Progress Section */}
                {campaign.id === 'membership_acquisition' && kpiData && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Membership Goal</span>
                      <span className="text-sm font-bold">{kpiData.membershipAcquisition.current} / 300 members</span>
                    </div>
                    <Progress value={(kpiData.membershipAcquisition.current / 300) * 100} className="h-2" />
                    <div className="flex gap-4 mt-2">
                      <p className="text-xs text-muted-foreground">All Access: <span className="font-semibold text-foreground">{kpiData.membershipAcquisition.breakdown?.allAccess ?? 0}</span></p>
                      <p className="text-xs text-muted-foreground">Swing Saver: <span className="font-semibold text-foreground">{kpiData.membershipAcquisition.breakdown?.swingSaver ?? 0}</span></p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Acquisition goal: <span className="font-semibold text-foreground">{Math.max(0, 300 - kpiData.membershipAcquisition.current)} more members</span> to reach 300 • 2-year target
                    </p>
                  </div>
                )}

                {campaign.id === 'trial_conversion' && kpiData && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Trial Conversion Rate</span>
                        <span className="text-sm font-bold">{kpiData.trialConversion.current.toFixed(1)}%</span>
                      </div>
                      <Progress value={(kpiData.trialConversion.current / kpiData.trialConversion.target) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Target: {kpiData.trialConversion.target}% •{' '}
                        {kpiData.trialConversion.current >= kpiData.trialConversion.target
                          ? 'Goal met!'
                          : `${(kpiData.trialConversion.target - kpiData.trialConversion.current).toFixed(1)}% below target`}
                      </p>
                    </div>
                    {funnelData && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-semibold">Drive Day → Member Funnel</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {funnelData.conversionRate}% converted
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {funnelData.steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium truncate">{step.label}</span>
                                  <span className="text-xs font-bold text-foreground ml-2 flex-shrink-0">{step.count}</span>
                                </div>
                                {i < funnelData.steps.length - 1 && (
                                  <div className="h-1 bg-muted rounded-full mt-1">
                                    <div
                                      className="h-1 bg-emerald-500 rounded-full transition-all"
                                      style={{ width: funnelData.steps[i + 1].count > 0 && step.count > 0 ? `${Math.min(100, (funnelData.steps[i + 1].count / step.count) * 100)}%` : '0%' }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          Target: {funnelData.targetConversionRate ?? 20}% conversion •{' '}
                          {funnelData.conversionRate >= (funnelData.targetConversionRate ?? 20)
                            ? '✓ Goal met!'
                            : `${((funnelData.targetConversionRate ?? 20) - funnelData.conversionRate).toFixed(1)}% below target`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {campaign.id === 'member_retention' && kpiData && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Active Customer Members</span>
                      <span className="text-sm font-bold">{kpiData.memberRetention.current} / 300</span>
                    </div>
                    <Progress value={(kpiData.memberRetention.current / 300) * 100} className="h-2" />
                    <div className="flex gap-4 mt-2">
                      <p className="text-xs text-muted-foreground">All Access: <span className="font-semibold text-foreground">{kpiData.memberRetention.breakdown?.allAccess ?? 0}</span></p>
                      <p className="text-xs text-muted-foreground">Swing Saver: <span className="font-semibold text-foreground">{kpiData.memberRetention.breakdown?.swingSaver ?? 0}</span></p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Goal: retain 300 customer members •{' '}
                      {kpiData.memberRetention.current >= 300 ? 'Goal met! ✓' : `${300 - kpiData.memberRetention.current} more to retain`}
                    </p>
                  </div>
                )}

                {campaign.id === 'corporate_events' && kpiData && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">B2B Events (This Month)</span>
                      <span className="text-sm font-bold">{kpiData.corporateEvents.current} / {kpiData.corporateEvents.target}</span>
                    </div>
                    <Progress value={(kpiData.corporateEvents.current / kpiData.corporateEvents.target) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Goal: 1 B2B event/month •{' '}
                      {kpiData.corporateEvents.current >= kpiData.corporateEvents.target
                        ? 'Goal met this month'
                        : `Need ${kpiData.corporateEvents.target - kpiData.corporateEvents.current} more event this month`}
                    </p>
                  </div>
                )}

                {/* B2B Research Summary — inline if available */}
                {campaign.id === 'corporate_events' && latestB2BResearch && (
                  <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Latest B2B Research</span>
                        <Badge className="bg-green-600 text-white text-xs border-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />ready
                        </Badge>
                      </div>
                      <button
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                        onClick={() => setLocation("/intelligence/research")}
                      >
                        View full report →
                      </button>
                    </div>
                    <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">{latestB2BResearch.summary}</p>
                    {latestB2BResearch.recommendedActions && (latestB2BResearch.recommendedActions as Array<{ action: string; priority: string; campaignType: string }>).slice(0, 2).map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Badge className={`text-xs border-0 shrink-0 ${rec.priority === "high" ? "bg-red-500 text-white" : rec.priority === "medium" ? "bg-amber-500 text-white" : "bg-slate-400 text-white"}`}>
                          {rec.priority}
                        </Badge>
                        <span className="text-xs text-amber-800 dark:text-amber-200">{rec.action}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* B2B — no research yet prompt */}
                {campaign.id === 'corporate_events' && !latestB2BResearch && (
                  <div className="p-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10 flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">No B2B market research yet. Generate a report to inform your outreach strategy.</p>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="text-lg font-semibold">${campaign.totalBudget.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Spend</p>
                    <p className="text-lg font-semibold">${campaign.totalSpend.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-lg font-semibold">${campaign.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>

                {/* ROI */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {campaign.roi >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium">Financial ROI</span>
                    </div>
                    <span className={`text-lg font-bold ${campaign.roi >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {campaign.roi >= 0 ? "+" : ""}{campaign.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* B2B Action Buttons */}
                {campaign.id === 'corporate_events' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      onClick={() => setLocation("/intelligence/research")}
                    >
                      <Search className="h-4 w-4" />
                      Market Research
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      disabled={generateOutreachMutation.isPending}
                      onClick={() => {
                        generateOutreachMutation.mutate({
                          researchSummary: latestB2BResearch?.summary ?? undefined,
                          targetIndustry: "healthcare, tech, finance, manufacturing",
                          groupSize: "10-30 people",
                        });
                      }}
                    >
                      {generateOutreachMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      {generateOutreachMutation.isPending ? "Generating..." : "Outreach Email"}
                    </Button>
                  </div>
                )}

                {/* View Landing Page Button */}
                {campaign.landingPageUrl && (
                  <div className="pt-4">
                    <a
                      href={campaign.landingPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                    >
                      View Landing Page
                    </a>
                  </div>
                )}

                {/* Programs List */}
                {campaign.programs.length > 0 && isExpanded && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-muted-foreground">Supporting Programs</p>
                      <div className="flex items-center gap-1.5">
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        <Select
                          value={sort}
                          onValueChange={(v) => setProgramSort(prev => ({ ...prev, [campaign.id]: v as SortOption }))}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs border-0 bg-muted/50 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="roi">By ROI</SelectItem>
                            <SelectItem value="date">By Date</SelectItem>
                            <SelectItem value="status">By Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {sortedPrograms.map(program => {
                      const programRoi = program.spend > 0
                        ? ((program.revenue - program.spend) / program.spend) * 100
                        : 0;

                      return (
                        <button
                          key={program.id}
                          onClick={() => setLocation("/programs")}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{program.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                ${program.spend.toFixed(2)} spend
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ${program.revenue.toFixed(2)} revenue
                              </span>
                              <Badge className={`text-xs ${getStatusBadgeClass(program.status)}`}>
                                {program.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`text-sm font-semibold ${programRoi >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                              {programRoi >= 0 ? "+" : ""}{programRoi.toFixed(0)}%
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* B2B Outreach Email Draft Modal */}
      {emailDraft && (
        <EmailDraftModal
          open={draftModalOpen}
          onClose={() => setDraftModalOpen(false)}
          draft={emailDraft}
          title="B2B Corporate Outreach Email Sequence"
        />
      )}
    </div>
  );
}
