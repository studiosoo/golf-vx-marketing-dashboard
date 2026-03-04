import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, RefreshCw, Sparkles, ChevronDown, ChevronUp, MapPin, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIIntelligenceTabProps {
  programId?: number;
}

function priorityColor(p: string): string {
  if (p === "high") return "bg-[#2C2C2C] text-white";
  if (p === "medium") return "bg-[#545A60] text-white";
  return "bg-[#F2F2F7] text-[#888888]";
}

function channelIcon(ch: string): string {
  const c = ch.toLowerCase();
  if (c.includes("meta") || c.includes("facebook") || c.includes("instagram")) return "📱";
  if (c.includes("email")) return "✉️";
  if (c.includes("sms") || c.includes("text")) return "💬";
  if (c.includes("venue") || c.includes("in-person")) return "🏌️";
  if (c.includes("partner")) return "🤝";
  if (c.includes("content") || c.includes("social")) return "📸";
  return "📣";
}

export function AIIntelligenceTab({ programId }: AIIntelligenceTabProps) {
  const [insights, setInsights] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("keyInsights");
  const { toast } = useToast();

  const generateMutation = trpc.giveaway.generateProgramInsights.useMutation({
    onSuccess: (data) => {
      setInsights(data);
      toast({ title: "AI Analysis Complete", description: "Marketing intelligence report generated." });
    },
    onError: (err) => {
      toast({ title: "Analysis Failed", description: err.message, variant: "destructive" });
    },
  });

  const toggle = (key: string) => setExpandedSection(prev => prev === key ? null : key);

  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#F2F2F7] flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-[#AAAAAA]" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-semibold text-[#111111]">AI Marketing Intelligence</p>
          <p className="text-sm text-[#888888] max-w-sm">
            Analyze your applicant demographics and generate a comprehensive multi-channel marketing strategy.
          </p>
        </div>
        <Button
          onClick={() => generateMutation.mutate({ programId })}
          disabled={generateMutation.isPending}
          className="bg-[#F5C72C] hover:bg-[#e6b820] text-[#111111] font-semibold"
        >
          {generateMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />Generate Marketing Intelligence</>
          )}
        </Button>
        {generateMutation.isPending && (
          <p className="text-xs text-[#AAAAAA]">This may take 15–30 seconds...</p>
        )}
      </div>
    );
  }

  const { insights: data, stats } = insights;

  return (
    <div className="space-y-4">
      {/* Header + Regenerate */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#111111]">Marketing Intelligence Report</h3>
          <p className="text-xs text-[#AAAAAA] mt-0.5">
            Generated {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : "just now"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateMutation.mutate({ programId })}
          disabled={generateMutation.isPending}
          className="border-[#E0E0E0] text-[#545A60] hover:bg-[#F2F2F7]"
        >
          {generateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1.5 text-xs">Refresh</span>
        </Button>
      </div>

      {/* Executive Summary */}
      <Card className="border border-[#E0E0E0] shadow-none bg-[#F2F2F7]">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-[#111111] leading-relaxed">{data.executiveSummary}</p>
          {stats && (
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-[#111111]">{stats.total}</div>
                <div className="text-xs text-[#AAAAAA]">Entries</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#F5C72C]">{stats.progressPct}%</div>
                <div className="text-xs text-[#AAAAAA]">of Goal</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#111111]">{stats.entryGoal}</div>
                <div className="text-xs text-[#AAAAAA]">Target</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chicago Opportunity */}
      {data.chicagoOpportunity && (
        <Card className="border-2 border-[#F5C72C] shadow-none bg-[#FFFDF0]">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("chicago")}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#F5C72C]" /> Chicago City Opportunity
                <span className="text-[10px] font-semibold bg-[#F5C72C] text-[#111111] px-2 py-0.5 rounded-full">Untapped Market</span>
              </CardTitle>
              {expandedSection === "chicago" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
            </div>
          </CardHeader>
          {expandedSection === "chicago" && (
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-[#545A60] leading-relaxed">{data.chicagoOpportunity.summary}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Target Neighborhoods</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(data.chicagoOpportunity.targetNeighborhoods || []).map((n: string, i: number) => (
                      <span key={i} className="text-xs bg-[#F5C72C]/20 text-[#8B6E00] px-2 py-0.5 rounded font-medium">{n}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Target Demographic</p>
                  <p className="text-xs text-[#545A60]">{data.chicagoOpportunity.targetDemographic}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 rounded-lg bg-white border border-[#F5C72C]/30">
                  <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-1">Ad Strategy</p>
                  <p className="text-xs text-[#545A60]">{data.chicagoOpportunity.adStrategy}</p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#F5C72C]/30">
                  <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-1">Messaging Angle</p>
                  <p className="text-xs text-[#545A60]">{data.chicagoOpportunity.messagingAngle}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Key Insights */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("keyInsights")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#F5C72C]" /> Key Insights
            </CardTitle>
            {expandedSection === "keyInsights" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expandedSection === "keyInsights" && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {(data.keyInsights || []).map((item: any, i: number) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-[#F2F2F7]">
                  <Badge className={`${priorityColor(item.priority)} text-xs shrink-0 h-5 mt-0.5`}>{item.priority}</Badge>
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{item.insight}</p>
                    <p className="text-xs text-[#888888] mt-0.5">{item.implication}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Meta Ads Strategy */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("metaAds")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              📱 Meta Ads Strategy
            </CardTitle>
            {expandedSection === "metaAds" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expandedSection === "metaAds" && (
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Audience", items: data.metaAdsStrategy?.audienceRecommendations },
                { label: "Creative", items: data.metaAdsStrategy?.creativeRecommendations },
                { label: "Budget", items: data.metaAdsStrategy?.budgetRecommendations },
              ].map(({ label, items }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">{label}</p>
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
          </CardContent>
        )}
      </Card>

      {/* Multi-Channel Strategy */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("multiChannel")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              📣 Multi-Channel Strategy
            </CardTitle>
            {expandedSection === "multiChannel" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expandedSection === "multiChannel" && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {(data.multiChannelStrategy || []).map((ch: any, i: number) => (
                <div key={i} className="border border-[#E0E0E0] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{channelIcon(ch.channel)}</span>
                      <span className="font-semibold text-sm text-[#111111]">{ch.channel}</span>
                    </div>
                    <Badge className={`${priorityColor(ch.priority)} text-xs`}>{ch.priority}</Badge>
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
          </CardContent>
        )}
      </Card>

      {/* Content Strategy */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("content")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              📸 Content Strategy
            </CardTitle>
            {expandedSection === "content" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expandedSection === "content" && (
          <CardContent className="pt-0 space-y-3">
            <div>
              <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Core Messaging</p>
              <p className="text-sm text-[#545A60]">{data.contentStrategy?.messaging}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {(data.contentStrategy?.themes || []).map((t: string, i: number) => (
                    <span key={i} className="text-xs bg-[#F2F2F7] text-[#545A60] px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Formats</p>
                <div className="flex flex-wrap gap-1.5">
                  {(data.contentStrategy?.formats || []).map((f: string, i: number) => (
                    <span key={i} className="text-xs bg-[#F2F2F7] text-[#545A60] px-2 py-0.5 rounded">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 7-Day Action Plan */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("sevenDay")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              📅 7-Day Action Plan
            </CardTitle>
            {expandedSection === "sevenDay" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expandedSection === "sevenDay" && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {(data.sevenDayPlan || []).map((day: any, i: number) => (
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
          </CardContent>
        )}
      </Card>
    </div>
  );
}
