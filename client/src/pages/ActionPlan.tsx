import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sparkles, RefreshCw, Loader2, Target, Zap, Clock,
  TrendingUp, AlertTriangle, ChevronDown, ChevronUp,
  CheckCircle2, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Timeframe = "week" | "month";
type Focus = "all" | "membership" | "meta_ads" | "programs" | "retention";

interface Priority {
  rank: number;
  title: string;
  category: string;
  description: string;
  expectedImpact: string;
  effort: "low" | "medium" | "high";
  deadline: string;
  steps: string[];
}

interface QuickWin {
  title: string;
  action: string;
  time: string;
}

interface KpiTarget {
  metric: string;
  current: string;
  target: string;
  by: string;
}

interface ActionPlanData {
  summary: string;
  priority: "high" | "medium" | "low";
  generatedAt: string;
  timeframe: string;
  focus: string;
  topPriorities: Priority[];
  quickWins: QuickWin[];
  kpiTargets: KpiTarget[];
  risks: string[];
  insight: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  membership: { bg: "bg-[#F2DD48]/10", text: "text-[#8B6E00]", border: "border-[#F2DD48]/30" },
  meta_ads: { bg: "bg-[#6F6F6B]/10", text: "text-[#6F6F6B]", border: "border-blue-200" },
  programs: { bg: "bg-green-50", text: "text-[#72B84A]", border: "border-green-200" },
  retention: { bg: "bg-[#6F6F6B]/10", text: "text-[#6F6F6B]", border: "border-[#6F6F6B]/30" },
  content: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
};

const EFFORT_COLORS: Record<string, string> = {
  low: "text-[#72B84A] bg-green-50 border-green-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  high: "text-red-600 bg-red-50 border-red-200",
};

function PriorityCard({ priority, index }: { priority: Priority; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const cat = CATEGORY_COLORS[priority.category] || CATEGORY_COLORS.membership;

  return (
    <div className="bg-white border border-[#DEDEDA] rounded-xl overflow-hidden hover:border-[#F2DD48]/40 transition-colors">
      <div
        className="flex items-start gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center text-white text-sm font-bold shrink-0">
          {priority.rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
              {priority.category.replace(/_/g, " ")}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${EFFORT_COLORS[priority.effort] || EFFORT_COLORS.medium}`}>
              {priority.effort} effort
            </span>
            <span className="text-xs text-[#6F6F6B] bg-[#F1F1EF] px-2 py-0.5 rounded border border-[#DEDEDA]">
              <Clock size={10} className="inline mr-1" />{priority.deadline}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[#111]">{priority.title}</h3>
          <p className="text-xs text-[#6F6F6B] mt-0.5 line-clamp-2">{priority.description}</p>
        </div>
        <button className="p-1 text-[#999] hover:text-[#111] shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#F1F1EF]">
          <div className="pt-3">
            <div className="text-xs font-semibold text-[#6F6F6B] mb-1.5">Expected Impact</div>
            <p className="text-xs text-[#8B6E00] bg-[#F2DD48]/5 border border-[#F2DD48]/20 px-3 py-2 rounded-lg">
              {priority.expectedImpact}
            </p>
          </div>
          {priority.steps && priority.steps.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[#6F6F6B] mb-1.5">Action Steps</div>
              <ol className="space-y-1.5">
                {priority.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#6F6F6B]">
                    <span className="w-4 h-4 rounded-full bg-[#F1F1EF] border border-[#DEDEDA] flex items-center justify-center text-[10px] font-bold text-[#6F6F6B] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActionPlan() {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [focus, setFocus] = useState<Focus>("all");
  const [plan, setPlan] = useState<ActionPlanData | null>(null);

  const generateMutation = trpc.intelligence.generateActionPlan.useMutation({
    onSuccess: (data) => {
      setPlan(data as ActionPlanData);
      toast.success("Action plan generated");
    },
    onError: (err) => toast.error(`Failed to generate plan: ${err.message}`),
  });

  const handleGenerate = () => {
    generateMutation.mutate({ timeframe, focus });
  };

  const FOCUS_OPTIONS: { value: Focus; label: string }[] = [
    { value: "all", label: "All Areas" },
    { value: "membership", label: "Membership" },
    { value: "meta_ads", label: "Meta Ads" },
    { value: "programs", label: "Programs" },
    { value: "retention", label: "Retention" },
  ];

  return (
    <div className="p-6 space-y-6 bg-[#F6F6F4] min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Action Plan</h1>
          <p className="text-sm text-[#6F6F6B] mt-1">AI-generated strategic recommendations based on live data</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-[#DEDEDA] rounded-xl p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-semibold text-[#6F6F6B] uppercase tracking-wide mb-2 block">Timeframe</label>
            <div className="flex gap-2">
              {(["week", "month"] as Timeframe[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    timeframe === t
                      ? "bg-[#111] text-white border-[#111]"
                      : "bg-white text-[#6F6F6B] border-[#DEDEDA] hover:border-[#111]"
                  }`}
                >
                  {t === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6F6F6B] uppercase tracking-wide mb-2 block">Focus Area</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFocus(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    focus === opt.value
                      ? "bg-[#F2DD48] text-[#111] border-[#F2DD48]"
                      : "bg-white text-[#6F6F6B] border-[#DEDEDA] hover:border-[#F2DD48]/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 bg-[#F2DD48] hover:bg-[#E6B800] text-[#111] font-semibold px-5 py-2.5 rounded-lg border-0 ml-auto"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generateMutation.isPending ? "Generating…" : "Generate Plan"}
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {!plan && !generateMutation.isPending && (
        <div className="bg-white border border-dashed border-[#DEDEDA] rounded-xl p-16 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-4 text-[#F2DD48]" />
          <h3 className="text-base font-semibold text-[#111] mb-2">Ready to Generate Your Action Plan</h3>
          <p className="text-sm text-[#6F6F6B] max-w-md mx-auto mb-6">
            Select a timeframe and focus area, then click "Generate Plan" to receive AI-powered strategic recommendations based on your live data.
          </p>
          <Button
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-[#F2DD48] hover:bg-[#E6B800] text-[#111] font-semibold px-6 py-2.5 rounded-lg border-0 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Generate Now
          </Button>
        </div>
      )}

      {/* Loading state */}
      {generateMutation.isPending && (
        <div className="bg-white border border-[#DEDEDA] rounded-xl p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#F2DD48] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#111]">Analyzing live data and generating your plan…</p>
          <p className="text-xs text-[#6F6F6B] mt-1">This may take 10–20 seconds</p>
        </div>
      )}

      {/* Plan output */}
      {plan && !generateMutation.isPending && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white border border-[#DEDEDA] rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F2DD48]/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#8B6E00]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-sm font-semibold text-[#111]">Executive Summary</h2>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                    plan.priority === "high" ? "bg-red-50 text-red-700 border-red-200" :
                    plan.priority === "medium" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-[#72B84A]/10 text-[#72B84A] border-[#72B84A]/30"
                  }`}>
                    {plan.priority?.toUpperCase()} PRIORITY
                  </span>
                  <span className="text-xs text-[#A8A8A3] ml-auto">
                    Generated {plan.generatedAt ? new Date(plan.generatedAt).toLocaleString() : "just now"}
                  </span>
                </div>
                <p className="text-sm text-[#444] leading-relaxed">{plan.summary}</p>
                {plan.insight && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-[#F2DD48]/5 border border-[#F2DD48]/20 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-[#8B6E00] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#6F6F6B] leading-relaxed"><span className="font-semibold text-[#8B6E00]">Key Insight: </span>{plan.insight}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Priorities */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#111]" />
                <h2 className="text-sm font-semibold text-[#111]">Top Priorities</h2>
                <span className="text-xs bg-[#F1F1EF] border border-[#DEDEDA] text-[#6F6F6B] px-2 py-0.5 rounded-full">{plan.topPriorities?.length || 0}</span>
              </div>
              <div className="space-y-3">
                {(plan.topPriorities || []).map((p, i) => (
                  <PriorityCard key={i} priority={p} index={i} />
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Quick Wins */}
              {plan.quickWins && plan.quickWins.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-[#8B6E00]" />
                    <h2 className="text-sm font-semibold text-[#111]">Quick Wins</h2>
                  </div>
                  <div className="space-y-2">
                    {plan.quickWins.map((qw, i) => (
                      <div key={i} className="bg-white border border-[#DEDEDA] rounded-xl p-3 hover:border-[#F2DD48]/40 transition-colors">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#F2DD48] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-[#111]">{qw.title}</p>
                            <p className="text-xs text-[#6F6F6B] mt-0.5">{qw.action}</p>
                            <span className="text-xs text-[#999] mt-1 inline-block">
                              <Clock size={10} className="inline mr-1" />{qw.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KPI Targets */}
              {plan.kpiTargets && plan.kpiTargets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-[#6F6F6B]" />
                    <h2 className="text-sm font-semibold text-[#111]">KPI Targets</h2>
                  </div>
                  <div className="bg-white border border-[#DEDEDA] rounded-xl overflow-hidden">
                    {plan.kpiTargets.map((kpi, i) => (
                      <div key={i} className={`px-4 py-3 ${i < plan.kpiTargets.length - 1 ? "border-b border-[#F1F1EF]" : ""}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[#111]">{kpi.metric}</span>
                          <span className="text-xs text-[#6F6F6B]">{kpi.by}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6F6F6B]">{kpi.current}</span>
                          <span className="text-xs text-[#A8A8A3]">→</span>
                          <span className="text-xs font-semibold text-[#72B84A] bg-green-50 px-1.5 py-0.5 rounded">{kpi.target}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {plan.risks && plan.risks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-[#F2DD48]" />
                    <h2 className="text-sm font-semibold text-[#111]">Watch Out For</h2>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                    {plan.risks.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <p className="text-xs text-[#222222]">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Regenerate button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleGenerate}
              variant="outline"
              className="flex items-center gap-2 text-sm font-medium text-[#6F6F6B] border-[#DEDEDA] hover:border-[#111] bg-white"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
