/**
 * ProgramAIIntelligence — Reusable AI marketing intelligence panel
 * Used by all program detail pages (Drive Day, Winter Clinics, Summer Camp, Leagues, Annual Giveaway, etc.)
 * Calls campaigns.generateInsights with the program's campaign ID.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Loader2, RefreshCw, Sparkles, ChevronDown, ChevronUp, Zap, ExternalLink
} from "lucide-react";

interface Props {
  campaignId: number;
  programName?: string;
}

function priorityColor(p: string) {
  if (p === "high") return "bg-[#2C2C2C] text-white";
  if (p === "medium") return "bg-[#6F6F6B] text-white";
  return "bg-[#F1F1EF] text-[#6F6F6B]";
}

function channelIcon(ch: string) {
  const c = ch.toLowerCase();
  if (c.includes("meta") || c.includes("facebook") || c.includes("instagram")) return "📱";
  if (c.includes("email")) return "✉️";
  if (c.includes("sms") || c.includes("text")) return "💬";
  if (c.includes("venue") || c.includes("in-person")) return "🏌️";
  if (c.includes("partner")) return "🤝";
  if (c.includes("content") || c.includes("social")) return "📸";
  return "📣";
}

export function ProgramAIIntelligence({ campaignId, programName }: Props) {
  const [insights, setInsights] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>("keyInsights");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const openInAssistant = () => {
    navigate(`/intelligence/assistant?program=${campaignId}&context=programs`);
  };

  const generateMutation = trpc.campaignsAi.generateInsights.useMutation({
    onSuccess: (data: any) => {
      setInsights(data);
      toast({ title: "Analysis Complete", description: "Marketing intelligence report generated." });
    },
    onError: (err: any) => {
      toast({ title: "Analysis Failed", description: err.message, variant: "destructive" });
    },
  });

  const toggle = (key: string) => setExpanded(prev => prev === key ? null : key);

  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#F1F1EF] flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-[#AAAAAA]" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-semibold text-[#222222]">AI Marketing Intelligence</p>
          <p className="text-sm text-[#6F6F6B] max-w-sm">
            Generate a comprehensive multi-channel marketing strategy based on {programName || "this program"}'s performance data.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={() => generateMutation.mutate({ campaignId })}
            disabled={generateMutation.isPending}
            className="bg-[#F2DD48] hover:bg-[#e6b820] text-[#222222] font-semibold"
          >
            {generateMutation.isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
              : <><Sparkles className="mr-2 h-4 w-4" />Generate Marketing Intelligence</>
            }
          </Button>
          {generateMutation.isPending && (
            <p className="text-xs text-[#AAAAAA]">This may take 15–30 seconds...</p>
          )}
          <button
            onClick={openInAssistant}
            className="flex items-center gap-1 text-xs text-[#6F6F6B] hover:text-[#222222] transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open in Assistant for deeper analysis
          </button>
        </div>
      </div>
    );
  }

  const { insights: data, campaign } = insights;

  const statusColor = data.performanceAssessment?.status === "ahead" ? "#72B84A"
    : data.performanceAssessment?.status === "on_track" ? "#1A56DB"
    : data.performanceAssessment?.status === "behind" ? "#F5A623"
    : "#6F6F6B";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#222222]">Marketing Intelligence Report</h3>
          <p className="text-xs text-[#AAAAAA] mt-0.5">
            Generated {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : "just now"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openInAssistant}
            className="border-[#E9E9E6] text-[#6F6F6B] hover:bg-[#F1F1EF]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="ml-1.5 text-xs">Open in Assistant</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate({ campaignId })}
            disabled={generateMutation.isPending}
            className="border-[#E9E9E6] text-[#6F6F6B] hover:bg-[#F1F1EF]"
          >
            {generateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span className="ml-1.5 text-xs">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="border border-[#E9E9E6] shadow-none bg-[#F1F1EF]">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
            >
              {data.performanceAssessment?.status?.replace("_", " ") || "Analyzing"}
            </span>
          </div>
          <p className="text-sm text-[#222222] leading-relaxed">{data.executiveSummary}</p>
          {campaign && (
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-[#F2DD48]">{campaign.progressPct?.toFixed(1)}%</div>
                <div className="text-xs text-[#AAAAAA]">Goal Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#222222]">{campaign.budgetUtilization?.toFixed(1)}%</div>
                <div className="text-xs text-[#AAAAAA]">Budget Used</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Assessment */}
      {data.performanceAssessment && (
        <Card className="border border-[#E9E9E6] shadow-none">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("performance")}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#222222] flex items-center gap-2">
                📊 Performance Assessment
              </CardTitle>
              {expanded === "performance" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
            </div>
          </CardHeader>
          {expanded === "performance" && (
            <CardContent className="pt-0">
              <p className="text-sm text-[#6F6F6B] mb-3">{data.performanceAssessment.summary}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-[#72B84A] uppercase tracking-wide mb-1.5">Strengths</p>
                  <ul className="space-y-1">
                    {(data.performanceAssessment.strengths || []).map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-xs text-[#6F6F6B]">
                        <span className="text-[#72B84A] shrink-0">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#F5A623] uppercase tracking-wide mb-1.5">Gaps</p>
                  <ul className="space-y-1">
                    {(data.performanceAssessment.gaps || []).map((g: string, i: number) => (
                      <li key={i} className="flex gap-2 text-xs text-[#6F6F6B]">
                        <span className="text-[#F5A623] shrink-0">!</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Key Insights */}
      <Card className="border border-[#E9E9E6] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("keyInsights")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#222222] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#F2DD48]" /> Key Insights
            </CardTitle>
            {expanded === "keyInsights" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expanded === "keyInsights" && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {(data.keyInsights || []).map((item: any, i: number) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-[#F1F1EF]">
                  <Badge className={`${priorityColor(item.priority)} text-xs shrink-0 h-5 mt-0.5`}>{item.priority}</Badge>
                  <div>
                    <p className="text-sm font-medium text-[#222222]">{item.insight}</p>
                    <p className="text-xs text-[#6F6F6B] mt-0.5">{item.implication}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Meta Ads Strategy */}
      <Card className="border border-[#E9E9E6] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("metaAds")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#222222]">📱 Meta Ads Strategy</CardTitle>
            {expanded === "metaAds" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expanded === "metaAds" && (
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
                      <li key={i} className="flex gap-2 text-xs text-[#6F6F6B]">
                        <span className="text-[#F2DD48] shrink-0">•</span>{item}
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
      <Card className="border border-[#E9E9E6] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("multiChannel")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#222222]">📣 Multi-Channel Strategy</CardTitle>
            {expanded === "multiChannel" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expanded === "multiChannel" && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {(data.multiChannelStrategy || []).map((ch: any, i: number) => (
                <div key={i} className="border border-[#E9E9E6] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{channelIcon(ch.channel)}</span>
                      <span className="font-semibold text-sm text-[#222222]">{ch.channel}</span>
                    </div>
                    <Badge className={`${priorityColor(ch.priority)} text-xs`}>{ch.priority}</Badge>
                  </div>
                  <p className="text-xs text-[#6F6F6B] mb-2">{ch.strategy}</p>
                  <ul className="space-y-1">
                    {(ch.tactics || []).map((t: string, j: number) => (
                      <li key={j} className="flex gap-2 text-xs text-[#6F6F6B]">
                        <span className="text-[#AAAAAA] shrink-0">→</span>{t}
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
      <Card className="border border-[#E9E9E6] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("content")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#222222]">📸 Content Strategy</CardTitle>
            {expanded === "content" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expanded === "content" && (
          <CardContent className="pt-0 space-y-3">
            <div>
              <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Core Messaging</p>
              <p className="text-sm text-[#6F6F6B]">{data.contentStrategy?.messaging}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {(data.contentStrategy?.themes || []).map((t: string, i: number) => (
                    <span key={i} className="text-xs bg-[#F1F1EF] text-[#6F6F6B] px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Formats</p>
                <div className="flex flex-wrap gap-1.5">
                  {(data.contentStrategy?.formats || []).map((f: string, i: number) => (
                    <span key={i} className="text-xs bg-[#F1F1EF] text-[#6F6F6B] px-2 py-0.5 rounded">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 7-Day Action Plan */}
      <Card className="border border-[#E9E9E6] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("sevenDay")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#222222]">📅 7-Day Action Plan</CardTitle>
            {expanded === "sevenDay" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expanded === "sevenDay" && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {(data.sevenDayPlan || []).map((day: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="w-16 shrink-0">
                    <span className="text-xs font-semibold text-[#AAAAAA]">{day.day}</span>
                  </div>
                  <ul className="space-y-1 flex-1">
                    {(day.actions || []).map((a: string, j: number) => (
                      <li key={j} className="flex gap-2 text-xs text-[#6F6F6B]">
                        <span className="text-[#F2DD48] shrink-0">✓</span>{a}
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
