import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Brain, Target, BarChart3, Building2, Megaphone, HandHeart,
  MessageSquare, Loader2, ChevronDown, ChevronUp, Clock,
  Trash2, FileText, Lightbulb, Sparkles, RefreshCw,
  CheckCircle2, AlertTriangle, TrendingUp, Zap,
} from "lucide-react";
import { Streamdown } from "streamdown";

// ─── Analysis Types ──────────────────────────────────────────────────────────

type AnalysisType =
  | "competitive_analysis" | "marketing_plan" | "event_roi"
  | "b2b_strategy" | "campaign_brief" | "community_outreach" | "free_form";

interface HistoryItem {
  id: string;
  title: string;
  content: string;
  analysisType: AnalysisType;
  result: string;
  timestamp: number;
}

const ANALYSIS_TYPES: {
  value: AnalysisType;
  label: string;
  icon: React.ReactNode;
  description: string;
  placeholder: string;
  color: string;
}[] = [
  { value: "competitive_analysis", label: "Competitive Analysis", icon: <TrendingUp size={15} />, color: "text-[#6F6F6B]",
    description: "Analyze competitor tactics and identify opportunities for Golf VX",
    placeholder: "Paste a competitor email, promotion, article, or any content about what competitors are doing...\n\nExample: Topgolf sent an email about their 'Book Early for a Chance at a New Car' promotion for corporate events. Paste the full content here." },
  { value: "marketing_plan", label: "Marketing Plan", icon: <Target size={15} />, color: "text-[#72B84A]",
    description: "Generate a detailed marketing action plan",
    placeholder: "Describe the situation, goal, or context you want a marketing plan for...\n\nExample: We want to increase trial session bookings by 30% in Q2. We have a $2,000/month budget." },
  { value: "event_roi", label: "Event ROI", icon: <BarChart3 size={15} />, color: "text-[#F2DD48]",
    description: "Evaluate event performance and ROI",
    placeholder: "Paste your event recap, notes, or data...\n\nExample: Paste the Chicago Golf Show recap with visitor counts, giveaways distributed, leads captured, and costs." },
  { value: "b2b_strategy", label: "B2B Strategy", icon: <Building2 size={15} />, color: "text-[#6F6F6B]",
    description: "Develop corporate events and partnership strategy",
    placeholder: "Paste any B2B-related content: competitor promotions, corporate inquiry emails, partnership ideas...\n\nExample: Paste Kyu's forwarded Topgolf email about corporate event promotions." },
  { value: "campaign_brief", label: "Campaign Brief", icon: <Megaphone size={15} />, color: "text-[#F2DD48]",
    description: "Write a complete campaign brief",
    placeholder: "Describe the campaign idea or paste relevant context...\n\nExample: We want to run a spring campaign targeting families for our Junior Summer Camp. Budget: $1,500." },
  { value: "community_outreach", label: "Community Outreach", icon: <HandHeart size={15} />, color: "text-pink-400",
    description: "Evaluate sponsorship and donation requests",
    placeholder: "Paste the sponsorship/donation request email or describe the opportunity...\n\nExample: Paste the Windsor Elementary PTA Trivia Night email requesting a donation." },
  { value: "free_form", label: "Free Form", icon: <MessageSquare size={15} />, color: "text-cyan-400",
    description: "Ask anything about Golf VX marketing",
    placeholder: "Paste any document, email thread, data, or notes — or just ask a question...\n\nExamples:\n- Paste an email thread and ask 'What should our response strategy be?'\n- Ask 'What B2B corporate event packages should we offer to compete with Topgolf?'" },
];

const QUICK_TEMPLATES: { label: string; type: AnalysisType; content: string }[] = [
  {
    label: "Topgolf B2B Analysis", type: "b2b_strategy",
    content: `From: Kyu Choi <kchoi@golfvx.com>\nTo: Sam Tio, Gina Choi\nCc: Brian Jung, Soo\n\nSam and Gina,\nTopgolf runs promotions designed to drive corporate event bookings. I'd like to evaluate our own promotional strategy and identify opportunities we may be able to adopt.\n\nTopgolf's current promotion:\n- "Book Early for a Chance at a New Car" — WIN a 2026 Honda CR-V TrailSport Hybrid\n- All 13+ player events booked by March 31 and hosted anytime in 2026 are automatically entered\n- Extra entry for every $500 spent on event, up to 10 total entries\n- Also running: 50% off weekday game play before 4 PM (requires $6 Lifetime Membership)\n\nPlease develop a comparable promotional strategy for Golf VX Arlington Heights corporate events.`,
  },
  {
    label: "Chicago Golf Show ROI", type: "event_roi",
    content: `Chicago Golf Show 2026 Recap:\n- Estimated 2,000-2,500 booth visitors\n- At least 50% participated in putting challenge\n- Giveaways: ~50 free 1-hr promos, ~10 headcovers, ~10 towels, tees & golf balls\n- Only one team signup\n- Strong interest from Arlington Heights & surrounding areas\n- Many visitors said they had been before but not recently\n- Tent was a major visibility win\n- Anniversary giveaway form received negative feedback — too many questions, people exited\n- Talk track worked well: "Do you play simulator golf?" + "Are you near Arlington Heights?"\n- Booth setup: 10x10 with tent, putting green, table\n\nIssues identified:\n- Giveaway form too long (should be name/email/phone only)\n- No backdrop on tent\n- No floor markings on putting contest\n- No venue staff present`,
  },
  {
    label: "Windsor PTA Donation", type: "community_outreach",
    content: `From: Danielle Hunt <windsortrivianight@gmail.com>\nThe Windsor Elementary School PTA is hosting our annual Trivia Night Fundraising Event on February 27, 2026 (~200 attendees).\n\nWe are requesting donations of items, services, or gift certificates for our Trivia Night raffle.\n\nAs a thank you, all donors receive:\n- Recognition on Windsor PTA's Facebook and Instagram pages\n- Display of your business name and logo at the event\n\nOrganization: Windsor Elementary School PTA (501c3, EIN: 36-3291003)\nLocation: Knights of Columbus Hall, 15 N Hickory Ave, Arlington Heights, IL 60004\n\nOur proposed donation package:\n- 2 x $50 Golf VX gift cards\n- 1 FREE Full-Day Summer Camp Week ($699 value) as grand raffle prize\n- Include promotional flyers and QR codes\n- Request PTA to mention us on social media when announcing sponsors`,
  },
];

// ─── Action Plan Types ────────────────────────────────────────────────────────

type Timeframe = "week" | "month";
type Focus = "all" | "membership" | "meta_ads" | "programs" | "retention";

interface Priority {
  rank: number; title: string; category: string; description: string;
  expectedImpact: string; effort: "low" | "medium" | "high"; deadline: string; steps: string[];
}
interface QuickWin { title: string; action: string; time: string; }
interface KpiTarget { metric: string; current: string; target: string; by: string; }
interface ActionPlanData {
  summary: string; priority: "high" | "medium" | "low"; generatedAt: string;
  timeframe: string; focus: string; topPriorities: Priority[];
  quickWins: QuickWin[]; kpiTargets: KpiTarget[]; risks: string[]; insight: string;
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

// ─── Priority Card ────────────────────────────────────────────────────────────

function PriorityCard({ priority, index }: { priority: Priority; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const cat = CATEGORY_COLORS[priority.category] || CATEGORY_COLORS.membership;
  return (
    <div className="bg-white border border-[#DEDEDA] rounded-xl overflow-hidden hover:border-[#F2DD48]/40 transition-colors">
      <div className="flex items-start gap-4 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center text-white text-sm font-bold shrink-0">{priority.rank}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>{priority.category.replace(/_/g, " ")}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${EFFORT_COLORS[priority.effort] || EFFORT_COLORS.medium}`}>{priority.effort} effort</span>
            <span className="text-xs text-[#6F6F6B] bg-[#F1F1EF] px-2 py-0.5 rounded border border-[#DEDEDA]"><Clock size={10} className="inline mr-1" />{priority.deadline}</span>
          </div>
          <h3 className="text-sm font-semibold text-[#111]">{priority.title}</h3>
          <p className="text-xs text-[#6F6F6B] mt-0.5 line-clamp-2">{priority.description}</p>
        </div>
        <button className="p-1 text-[#999] hover:text-[#111] shrink-0">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#F1F1EF]">
          <div className="pt-3">
            <div className="text-xs font-semibold text-[#6F6F6B] mb-1.5">Expected Impact</div>
            <p className="text-xs text-[#8B6E00] bg-[#F2DD48]/5 border border-[#F2DD48]/20 px-3 py-2 rounded-lg">{priority.expectedImpact}</p>
          </div>
          {priority.steps?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[#6F6F6B] mb-1.5">Action Steps</div>
              <ol className="space-y-1.5">
                {priority.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#6F6F6B]">
                    <span className="w-4 h-4 rounded-full bg-[#F1F1EF] border border-[#DEDEDA] flex items-center justify-center text-[10px] font-bold text-[#6F6F6B] shrink-0 mt-0.5">{i + 1}</span>
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

// ─── Tab 1: Analysis ──────────────────────────────────────────────────────────

function AnalysisTab() {
  const [selectedType, setSelectedType] = useState<AnalysisType>("free_form");
  const [content, setContent] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [currentResult, setCurrentResult] = useState<{ analysis: string; analysisType: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const analyzeMutation = trpc.aiWorkspace.analyze.useMutation({
    onSuccess: (data) => {
      setCurrentResult(data);
      const title = content.slice(0, 60).replace(/\n/g, " ").trim() + (content.length > 60 ? "..." : "");
      setHistory((prev) => [
        { id: Date.now().toString(), title, content, analysisType: selectedType, result: data.analysis, timestamp: Date.now() },
        ...prev.slice(0, 9),
      ]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  const selectedTypeConfig = ANALYSIS_TYPES.find((t) => t.value === selectedType)!;
  const charCount = content.length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-4">
          {/* Type Selector */}
          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-[#6F6F6B] uppercase tracking-wide">Analysis Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {ANALYSIS_TYPES.map((type) => (
                  <button key={type.value} onClick={() => { setSelectedType(type.value); setCurrentResult(null); }}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all ${
                      selectedType === type.value ? "border-[#F2DD48]/60 bg-[#F2DD48]/10" : "border-[#DEDEDA] bg-[#F1F1EF]/20 hover:bg-[#F6F6F4]"
                    }`}>
                    <span className={selectedType === type.value ? type.color : "text-[#6F6F6B]"}>{type.icon}</span>
                    <span className={`text-xs font-medium leading-tight ${selectedType === type.value ? "text-[#222222]" : "text-[#6F6F6B]"}`}>{type.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#6F6F6B] mt-3">
                <span className={selectedTypeConfig.color}>{selectedTypeConfig.label}:</span>{" "}{selectedTypeConfig.description}
              </p>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-[#6F6F6B]">Quick start:</span>
            {QUICK_TEMPLATES.map((template) => (
              <button key={template.label}
                onClick={() => { setSelectedType(template.type); setContent(template.content); setCurrentResult(null); }}
                className="text-xs px-3 py-1.5 rounded-full border border-[#DEDEDA] bg-[#F1F1EF]/20 hover:bg-[#F6F6F4] text-[#6F6F6B] hover:text-[#222222] transition-colors">
                {template.label}
              </button>
            ))}
          </div>

          {/* Content Input */}
          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-[#6F6F6B] uppercase tracking-wide flex items-center gap-2">
                  <FileText size={13} />Content to Analyze
                </CardTitle>
                <span className={`text-xs ${charCount > 45000 ? "text-[#FF3B30]" : "text-[#6F6F6B]"}`}>
                  {charCount.toLocaleString()} / 50,000
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={content} onChange={(e) => setContent(e.target.value)}
                placeholder={selectedTypeConfig.placeholder}
                className="min-h-[180px] text-sm font-mono bg-[#F1F1EF]/20 border-[#DEDEDA] resize-y" maxLength={50000} />
              <button onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                className="flex items-center gap-1 text-xs text-[#6F6F6B] hover:text-[#222222] transition-colors">
                {showCustomPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Custom instructions (optional)
              </button>
              {showCustomPrompt && (
                <Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific instructions... e.g., 'Focus on the corporate event angle and suggest 3 package tiers with pricing.'"
                  className="min-h-[70px] text-sm bg-[#F1F1EF]/20 border-[#DEDEDA]" />
              )}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => { if (!content.trim()) return; setCurrentResult(null); analyzeMutation.mutate({ content: content.trim(), analysisType: selectedType, customPrompt: customPrompt.trim() || undefined }); }}
                  disabled={!content.trim() || analyzeMutation.isPending}
                  className="flex-1 bg-[#F2DD48] text-black hover:bg-yellow-300 font-semibold">
                  {analyzeMutation.isPending ? (
                    <><Loader2 size={15} className="mr-2 animate-spin" /><span>Analyzing with Gemini 2.5 Pro<span className="animate-pulse">...</span></span></>
                  ) : (
                    <><Brain size={15} className="mr-2" />Run Analysis</>
                  )}
                </Button>
                <span className="text-[10px] font-medium text-[#6F6F6B] bg-[#F1F1EF] px-2 py-1 rounded border border-[#DEDEDA] whitespace-nowrap">
                  gemini-2.5-pro
                </span>
              </div>
              {analyzeMutation.isError && (
                <p className="text-xs text-[#FF3B30]">Error: {analyzeMutation.error?.message || "Analysis failed."}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: History + Tips */}
        <div className="space-y-4">
          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-[#6F6F6B] uppercase tracking-wide flex items-center gap-2">
                <Clock size={13} />Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-xs text-[#6F6F6B] text-center py-6">Your analysis history will appear here.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => {
                    const typeConfig = ANALYSIS_TYPES.find((t) => t.value === item.analysisType);
                    return (
                      <div key={item.id} className="border border-[#DEDEDA] rounded-lg overflow-hidden">
                        <button onClick={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)}
                          className="w-full flex items-start justify-between gap-2 p-3 text-left hover:bg-[#F1F1EF]/20 transition-colors">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={typeConfig?.color || "text-[#6F6F6B]"}>{typeConfig?.icon}</span>
                              <span className="text-xs text-[#6F6F6B]">{typeConfig?.label}</span>
                            </div>
                            <p className="text-xs text-[#222222] truncate">{item.title}</p>
                            <p className="text-xs text-[#6F6F6B] mt-0.5">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); setHistory((prev) => prev.filter((h) => h.id !== item.id)); }}
                              className="text-[#6F6F6B] hover:text-[#FF3B30] transition-colors p-1">
                              <Trash2 size={11} />
                            </button>
                            {expandedHistory === item.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </div>
                        </button>
                        {expandedHistory === item.id && (
                          <div className="border-t border-[#DEDEDA] p-3 bg-[#F1F1EF]/10">
                            <div className="prose prose-sm max-w-none text-xs">
                              <Streamdown>{item.result}</Streamdown>
                            </div>
                            <Button variant="outline" size="sm" className="mt-2 text-xs h-7"
                              onClick={() => { setSelectedType(item.analysisType); setContent(item.content); setCurrentResult({ analysis: item.result, analysisType: item.analysisType }); }}>
                              Reload
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-[#6F6F6B] uppercase tracking-wide flex items-center gap-2">
                <Lightbulb size={13} />Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-[#6F6F6B]">
                {[
                  "Paste full email threads for richer context",
                  "Include numbers and data when available",
                  "Use 'Custom instructions' to ask specific questions",
                  "Try B2B Strategy for the Topgolf email",
                  "Community Outreach helps evaluate donation requests",
                  "Event ROI works great for Chicago Golf Show recap",
                ].map((tip) => (
                  <li key={tip} className="flex gap-2"><span className="text-[#F2DD48] shrink-0">•</span>{tip}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Result */}
      {(analyzeMutation.isPending || currentResult) && (
        <div ref={resultRef}>
          <Separator className="my-2" />
          <Card className="bg-white border-[#DEDEDA] border-[#F2DD48]/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#222222] flex items-center gap-2">
                  <Brain size={17} className="text-[#F2DD48]" />
                  Analysis Result
                  {currentResult && (
                    <Badge variant="outline" className={`text-xs ml-2 ${ANALYSIS_TYPES.find((t) => t.value === currentResult.analysisType)?.color || ""} border-current`}>
                      {ANALYSIS_TYPES.find((t) => t.value === currentResult.analysisType)?.label}
                    </Badge>
                  )}
                </CardTitle>
                {currentResult && (
                  <Button variant="outline" size="sm" className="text-xs h-7"
                    onClick={() => navigator.clipboard.writeText(currentResult.analysis)}>Copy</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {analyzeMutation.isPending ? (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <Loader2 size={20} className="animate-spin text-[#F2DD48]" />
                  <span className="text-[#6F6F6B] text-sm">Analyzing with Gemini 2.5 Pro<span className="animate-pulse">...</span></span>
                </div>
              ) : currentResult ? (
                <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                  <Streamdown>{currentResult.analysis}</Streamdown>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Action Plan ───────────────────────────────────────────────────────

function ActionPlanTab() {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [focus, setFocus] = useState<Focus>("all");
  const [plan, setPlan] = useState<ActionPlanData | null>(null);

  const generateMutation = trpc.intelligence.generateActionPlan.useMutation({
    onSuccess: (data) => { setPlan(data as ActionPlanData); toast.success("Action plan generated"); },
    onError: (err) => toast.error(`Failed to generate plan: ${err.message}`),
  });

  const FOCUS_OPTIONS: { value: Focus; label: string }[] = [
    { value: "all", label: "All Areas" }, { value: "membership", label: "Membership" },
    { value: "meta_ads", label: "Meta Ads" }, { value: "programs", label: "Programs" },
    { value: "retention", label: "Retention" },
  ];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white border border-[#DEDEDA] rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-semibold text-[#6F6F6B] uppercase tracking-wide mb-2 block">Timeframe</label>
            <div className="flex gap-2">
              {(["week", "month"] as Timeframe[]).map((t) => (
                <button key={t} onClick={() => setTimeframe(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${timeframe === t ? "bg-[#111] text-white border-[#111]" : "bg-white text-[#6F6F6B] border-[#DEDEDA] hover:border-[#111]"}`}>
                  {t === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6F6F6B] uppercase tracking-wide mb-2 block">Focus Area</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setFocus(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${focus === opt.value ? "bg-[#F2DD48] text-[#111] border-[#F2DD48]" : "bg-white text-[#6F6F6B] border-[#DEDEDA] hover:border-[#F2DD48]/50"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] font-medium text-[#6F6F6B] bg-[#F1F1EF] px-2 py-1 rounded border border-[#DEDEDA] whitespace-nowrap">
              gemini-2.5-flash
            </span>
            <Button onClick={() => generateMutation.mutate({ timeframe, focus })} disabled={generateMutation.isPending}
              className="flex items-center gap-2 bg-[#F2DD48] hover:bg-[#E6B800] text-[#111] font-semibold px-5 py-2.5 rounded-lg border-0">
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generateMutation.isPending ? "Generating…" : "Generate Plan"}
            </Button>
          </div>
        </div>
      </div>

      {!plan && !generateMutation.isPending && (
        <div className="bg-white border border-dashed border-[#DEDEDA] rounded-xl p-12 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-4 text-[#F2DD48]" />
          <h3 className="text-base font-semibold text-[#111] mb-2">Ready to Generate Your Action Plan</h3>
          <p className="text-sm text-[#6F6F6B] max-w-md mx-auto mb-6">Select a timeframe and focus area, then click "Generate Plan" to receive AI-powered strategic recommendations.</p>
          <Button onClick={() => generateMutation.mutate({ timeframe, focus })}
            className="flex items-center gap-2 bg-[#F2DD48] hover:bg-[#E6B800] text-[#111] font-semibold px-6 py-2.5 rounded-lg border-0 mx-auto">
            <Sparkles className="w-4 h-4" />Generate Now
          </Button>
        </div>
      )}

      {generateMutation.isPending && (
        <div className="bg-white border border-[#DEDEDA] rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#F2DD48] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#111]">Analyzing live data and generating your plan…</p>
          <p className="text-xs text-[#6F6F6B] mt-1">This may take 10–20 seconds</p>
        </div>
      )}

      {plan && !generateMutation.isPending && (
        <div className="space-y-5">
          {/* Executive Summary */}
          <div className="bg-white border border-[#DEDEDA] rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F2DD48]/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#8B6E00]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-[#111]">Executive Summary</h2>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                    plan.priority === "high" ? "bg-red-50 text-red-700 border-red-200" :
                    plan.priority === "medium" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-[#72B84A]/10 text-[#72B84A] border-[#72B84A]/30"
                  }`}>{plan.priority?.toUpperCase()} PRIORITY</span>
                  <span className="text-xs text-[#A8A8A3] ml-auto">Generated {plan.generatedAt ? new Date(plan.generatedAt).toLocaleString() : "just now"}</span>
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

          {/* Priorities + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#111]" />
                <h2 className="text-sm font-semibold text-[#111]">Top Priorities</h2>
                <span className="text-xs bg-[#F1F1EF] border border-[#DEDEDA] text-[#6F6F6B] px-2 py-0.5 rounded-full">{plan.topPriorities?.length || 0}</span>
              </div>
              <div className="space-y-3">
                {(plan.topPriorities || []).map((p, i) => <PriorityCard key={i} priority={p} index={i} />)}
              </div>
            </div>

            <div className="space-y-4">
              {plan.quickWins?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-[#8B6E00]" /><h2 className="text-sm font-semibold text-[#111]">Quick Wins</h2></div>
                  <div className="space-y-2">
                    {plan.quickWins.map((qw, i) => (
                      <div key={i} className="bg-white border border-[#DEDEDA] rounded-xl p-3 hover:border-[#F2DD48]/40 transition-colors">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#F2DD48] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-[#111]">{qw.title}</p>
                            <p className="text-xs text-[#6F6F6B] mt-0.5">{qw.action}</p>
                            <span className="text-xs text-[#999] mt-1 inline-block"><Clock size={10} className="inline mr-1" />{qw.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.kpiTargets?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-[#6F6F6B]" /><h2 className="text-sm font-semibold text-[#111]">KPI Targets</h2></div>
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

              {plan.risks?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-[#F2DD48]" /><h2 className="text-sm font-semibold text-[#111]">Watch Out For</h2></div>
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

          <div className="flex justify-center pt-2">
            <Button onClick={() => generateMutation.mutate({ timeframe, focus })} variant="outline"
              className="flex items-center gap-2 text-sm font-medium text-[#6F6F6B] border-[#DEDEDA] hover:border-[#111] bg-white">
              <RefreshCw className="w-4 h-4" />Regenerate Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type StrategyTab = "analysis" | "action-plan";

export default function Strategy() {
  const [activeTab, setActiveTab] = useState<StrategyTab>("analysis");

  const tabs: { value: StrategyTab; label: string }[] = [
    { value: "analysis", label: "Analysis" },
    { value: "action-plan", label: "Action Plan" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-0 border-b border-[#DEDEDA] flex-shrink-0">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-[#222222]">Strategy</h1>
          <p className="text-xs text-[#6F6F6B] mt-0.5">
            Deep analysis and planning for Golf VX Arlington Heights
          </p>
        </div>
        {/* Tab bar */}
        <div className="flex h-11">
          {tabs.map((tab) => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={`px-5 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab.value
                  ? "border-[#F2DD48] text-[#222222]"
                  : "border-transparent text-[#6F6F6B] hover:text-[#222222]"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === "analysis" && <AnalysisTab />}
        {activeTab === "action-plan" && <ActionPlanTab />}
      </div>
    </div>
  );
}
