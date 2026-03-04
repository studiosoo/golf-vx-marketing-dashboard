import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp,
  Zap, TrendingUp, Target, Clock, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIInsightsPanelProps {
  /** The campaign/program ID from the campaigns table */
  campaignId: number;
  /** Program name for display */
  programName: string;
  /** Optional static context hint shown in the empty state */
  contextHint?: string;
  /** Whether to start collapsed */
  defaultCollapsed?: boolean;
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-[#111] text-white",
  medium: "bg-[#545A60] text-white",
  low: "bg-[#F2F2F7] text-[#888888]",
};

const CHANNEL_ICON: Record<string, string> = {
  meta: "📱", facebook: "📱", instagram: "📱",
  email: "✉️", sms: "💬", text: "💬",
  venue: "🏌️", "in-person": "🏌️",
  partner: "🤝", content: "📸", social: "📸",
};
function channelIcon(ch: string) {
  const lower = ch.toLowerCase();
  for (const [key, icon] of Object.entries(CHANNEL_ICON)) {
    if (lower.includes(key)) return icon;
  }
  return "📣";
}

function Section({
  title,
  sectionKey,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  sectionKey: string;
  expanded: boolean;
  onToggle: (k: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors"
        onClick={() => onToggle(sectionKey)}
      >
        <span className="text-sm font-semibold text-[#111111]">{title}</span>
        {expanded ? <ChevronUp size={16} className="text-[#AAAAAA]" /> : <ChevronDown size={16} className="text-[#AAAAAA]" />}
      </button>
      {expanded && <div className="px-4 pb-4 border-t border-[#F5F5F5]">{children}</div>}
    </div>
  );
}

export function AIInsightsPanel({
  campaignId,
  programName,
  contextHint,
  defaultCollapsed = false,
}: AIInsightsPanelProps) {
  const [panelOpen, setPanelOpen] = useState(!defaultCollapsed);
  const [insights, setInsights] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("keyInsights");

  const generateMutation = trpc.campaignsAi.generateInsights.useMutation({
    onSuccess: (data: any) => {
      setInsights(data);
      toast.success("AI analysis complete");
    },
    onError: (err: any) => toast.error(`Analysis failed: ${err.message}`),
  });

  const toggle = (key: string) =>
    setExpandedSection((prev) => (prev === key ? null : key));

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden">
      {/* Panel Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#FAFAFA] transition-colors"
        onClick={() => setPanelOpen((o) => !o)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#F5C72C]/10 flex items-center justify-center">
            <Sparkles size={14} className="text-[#8B6E00]" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[#111111]">AI Insights</span>
            <span className="ml-2 text-xs text-[#AAAAAA]">— {programName}</span>
          </div>
          {insights && (
            <span className="text-[10px] font-semibold bg-[#F5C72C]/20 text-[#8B6E00] px-2 py-0.5 rounded-full">
              Generated
            </span>
          )}
        </div>
        {panelOpen ? <ChevronUp size={16} className="text-[#AAAAAA]" /> : <ChevronDown size={16} className="text-[#AAAAAA]" />}
      </button>

      {panelOpen && (
        <div className="border-t border-[#F5F5F5] p-5 space-y-4">
          {/* Empty state */}
          {!insights && !generateMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F2F2F7] flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-[#AAAAAA]" />
              </div>
              <div>
                <p className="font-semibold text-[#111111] text-sm">AI Marketing Intelligence</p>
                <p className="text-xs text-[#888888] mt-1 max-w-xs">
                  {contextHint || `Analyze ${programName} performance and generate targeted marketing recommendations.`}
                </p>
              </div>
              <Button
                onClick={() => generateMutation.mutate({ campaignId })}
                className="bg-[#F5C72C] hover:bg-[#E6B800] text-[#111111] font-semibold text-sm px-5 py-2 rounded-lg border-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Insights
              </Button>
            </div>
          )}

          {/* Loading */}
          {generateMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#F5C72C]" />
              <p className="text-sm font-medium text-[#111111]">Analyzing program data…</p>
              <p className="text-xs text-[#AAAAAA]">This may take 10–20 seconds</p>
            </div>
          )}

          {/* Results */}
          {insights && !generateMutation.isPending && (
            <div className="space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#AAAAAA]">
                    Generated {insights.insights?.generatedAt
                      ? new Date(insights.insights.generatedAt).toLocaleString()
                      : "just now"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateMutation.mutate({ campaignId })}
                  disabled={generateMutation.isPending}
                  className="border-[#E0E0E0] text-[#545A60] hover:bg-[#F2F2F7] text-xs h-7"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>

              {/* Executive Summary */}
              {insights.insights?.executiveSummary && (
                <div className="bg-[#F5C72C]/5 border border-[#F5C72C]/20 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-[#8B6E00] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#444] leading-relaxed">{insights.insights.executiveSummary}</p>
                  </div>
                </div>
              )}

              {/* Performance Assessment */}
              {insights.insights?.performanceAssessment && (
                <div className={`rounded-xl p-3 border ${
                  insights.insights.performanceAssessment.status === "on_track" ? "bg-green-50 border-green-200" :
                  insights.insights.performanceAssessment.status === "ahead" ? "bg-blue-50 border-blue-200" :
                  insights.insights.performanceAssessment.status === "behind" ? "bg-yellow-50 border-yellow-200" :
                  "bg-red-50 border-red-200"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {insights.insights.performanceAssessment.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{insights.insights.performanceAssessment.summary}</p>
                </div>
              )}

              {/* Key Insights */}
              {insights.insights?.keyInsights?.length > 0 && (
                <Section title="⚡ Key Insights" sectionKey="keyInsights" expanded={expandedSection === "keyInsights"} onToggle={toggle}>
                  <div className="space-y-2.5 pt-3">
                    {insights.insights.keyInsights.map((item: any, i: number) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-[#F9F9F9]">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 h-5 mt-0.5 ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low}`}>
                          {item.priority}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-[#111111]">{item.insight}</p>
                          <p className="text-xs text-[#888888] mt-0.5">{item.implication}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Meta Ads Strategy */}
              {insights.insights?.metaAdsStrategy && (
                <Section title="📱 Meta Ads Strategy" sectionKey="metaAds" expanded={expandedSection === "metaAds"} onToggle={toggle}>
                  <div className="grid gap-4 md:grid-cols-3 pt-3">
                    {[
                      { label: "Audience", items: insights.insights.metaAdsStrategy.audienceRecommendations },
                      { label: "Creative", items: insights.insights.metaAdsStrategy.creativeRecommendations },
                      { label: "Budget", items: insights.insights.metaAdsStrategy.budgetRecommendations },
                    ].map(({ label, items }) => (
                      <div key={label}>
                        <p className="text-[10px] font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">{label}</p>
                        <ul className="space-y-1.5">
                          {(items || []).map((item: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-[#545A60]">
                              <span className="text-[#F5C72C] shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Multi-Channel Strategy */}
              {insights.insights?.multiChannelStrategy?.length > 0 && (
                <Section title="📣 Multi-Channel Strategy" sectionKey="multiChannel" expanded={expandedSection === "multiChannel"} onToggle={toggle}>
                  <div className="space-y-3 pt-3">
                    {insights.insights.multiChannelStrategy.map((ch: any, i: number) => (
                      <div key={i} className="border border-[#E0E0E0] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{channelIcon(ch.channel)}</span>
                            <span className="text-xs font-semibold text-[#111111]">{ch.channel}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_STYLES[ch.priority] || PRIORITY_STYLES.low}`}>
                            {ch.priority}
                          </span>
                        </div>
                        <p className="text-xs text-[#888888] mb-2">{ch.strategy}</p>
                        <ul className="space-y-1">
                          {(ch.tactics || []).map((t: string, j: number) => (
                            <li key={j} className="flex gap-2 text-xs text-[#545A60]">
                              <span className="text-[#AAAAAA] shrink-0">→</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* 7-Day Plan */}
              {insights.insights?.sevenDayPlan?.length > 0 && (
                <Section title="📅 7-Day Action Plan" sectionKey="sevenDay" expanded={expandedSection === "sevenDay"} onToggle={toggle}>
                  <div className="space-y-2 pt-3">
                    {insights.insights.sevenDayPlan.map((day: any, i: number) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-16 shrink-0">
                          <span className="text-xs font-semibold text-[#AAAAAA]">{day.day}</span>
                        </div>
                        <ul className="space-y-1 flex-1">
                          {(day.actions || []).map((a: string, j: number) => (
                            <li key={j} className="flex gap-2 text-xs text-[#545A60]">
                              <span className="text-[#F5C72C] shrink-0">✓</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
