import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bot, Zap, TrendingUp, Users, DollarSign, Calendar,
  Brain, Target, BarChart3, Building2, Megaphone, HandHeart,
  MessageSquare, Loader2, ChevronDown, ChevronUp, Clock,
  Trash2, FileText, Lightbulb,
} from "lucide-react";
import { Streamdown } from "streamdown";

// ─── Chat Tab Types ──────────────────────────────────────────────────────────

const CONTEXT_OPTIONS = [
  { value: "general", label: "General", icon: Bot, description: "All topics" },
  { value: "programs", label: "Programs", icon: Calendar, description: "Events & programs" },
  { value: "members", label: "Members", icon: Users, description: "Member management" },
  { value: "meta_ads", label: "Meta Ads", icon: TrendingUp, description: "Ad performance" },
  { value: "revenue", label: "Revenue", icon: DollarSign, description: "Revenue & goals" },
] as const;

type Context = typeof CONTEXT_OPTIONS[number]["value"];

// ─── Strategy Workspace Types ─────────────────────────────────────────────────

type AnalysisType =
  | "competitive_analysis"
  | "marketing_plan"
  | "event_roi"
  | "b2b_strategy"
  | "campaign_brief"
  | "community_outreach"
  | "free_form";

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
  {
    value: "competitive_analysis",
    label: "Competitive Analysis",
    icon: <TrendingUp size={15} />,
    description: "Analyze competitor tactics and identify opportunities for Golf VX",
    placeholder: "Paste a competitor email, promotion, article, or any content about what competitors are doing...\n\nExample: Topgolf sent an email about their 'Book Early for a Chance at a New Car' promotion for corporate events. Paste the full content here.",
    color: "text-blue-400",
  },
  {
    value: "marketing_plan",
    label: "Marketing Plan",
    icon: <Target size={15} />,
    description: "Generate a detailed marketing action plan",
    placeholder: "Describe the situation, goal, or context you want a marketing plan for...\n\nExample: We want to increase trial session bookings by 30% in Q2. We have a $2,000/month budget.",
    color: "text-green-400",
  },
  {
    value: "event_roi",
    label: "Event ROI",
    icon: <BarChart3 size={15} />,
    description: "Evaluate event performance and ROI",
    placeholder: "Paste your event recap, notes, or data...\n\nExample: Paste the Chicago Golf Show recap with visitor counts, giveaways distributed, leads captured, and costs.",
    color: "text-yellow-400",
  },
  {
    value: "b2b_strategy",
    label: "B2B Strategy",
    icon: <Building2 size={15} />,
    description: "Develop corporate events and partnership strategy",
    placeholder: "Paste any B2B-related content: competitor promotions, corporate inquiry emails, partnership ideas...\n\nExample: Paste Kyu's forwarded Topgolf email about corporate event promotions.",
    color: "text-purple-400",
  },
  {
    value: "campaign_brief",
    label: "Campaign Brief",
    icon: <Megaphone size={15} />,
    description: "Write a complete campaign brief",
    placeholder: "Describe the campaign idea or paste relevant context...\n\nExample: We want to run a spring campaign targeting families for our Junior Summer Camp. Budget: $1,500.",
    color: "text-orange-400",
  },
  {
    value: "community_outreach",
    label: "Community Outreach",
    icon: <HandHeart size={15} />,
    description: "Evaluate sponsorship and donation requests",
    placeholder: "Paste the sponsorship/donation request email or describe the opportunity...\n\nExample: Paste the Windsor Elementary PTA Trivia Night email requesting a donation.",
    color: "text-pink-400",
  },
  {
    value: "free_form",
    label: "Free Form",
    icon: <MessageSquare size={15} />,
    description: "Ask anything about Golf VX marketing",
    placeholder: "Paste any document, email thread, data, or notes — or just ask a question...\n\nExamples:\n- Paste an email thread and ask 'What should our response strategy be?'\n- Ask 'What B2B corporate event packages should we offer to compete with Topgolf?'",
    color: "text-cyan-400",
  },
];

const QUICK_TEMPLATES = [
  {
    label: "Topgolf B2B Analysis",
    type: "b2b_strategy" as AnalysisType,
    content: `From: Kyu Choi <kchoi@golfvx.com>
To: Sam Tio, Gina Choi
Cc: Brian Jung, Soo

Sam and Gina,
Topgolf runs promotions designed to drive corporate event bookings. I'd like to evaluate our own promotional strategy and identify opportunities we may be able to adopt.

Topgolf's current promotion:
- "Book Early for a Chance at a New Car" — WIN a 2026 Honda CR-V TrailSport Hybrid
- All 13+ player events booked by March 31 and hosted anytime in 2026 are automatically entered
- Extra entry for every $500 spent on event, up to 10 total entries
- Also running: 50% off weekday game play before 4 PM (requires $6 Lifetime Membership)

Please develop a comparable promotional strategy for Golf VX Arlington Heights corporate events.`,
  },
  {
    label: "Chicago Golf Show ROI",
    type: "event_roi" as AnalysisType,
    content: `Chicago Golf Show 2026 Recap:
- Estimated 2,000-2,500 booth visitors
- At least 50% participated in putting challenge
- Giveaways: ~50 free 1-hr promos, ~10 headcovers, ~10 towels, tees & golf balls
- Only one team signup
- Strong interest from Arlington Heights & surrounding areas
- Many visitors said they had been before but not recently
- Tent was a major visibility win
- Anniversary giveaway form received negative feedback — too many questions, people exited
- Talk track worked well: "Do you play simulator golf?" + "Are you near Arlington Heights?"
- Booth setup: 10x10 with tent, putting green, table

Issues identified:
- Giveaway form too long (should be name/email/phone only)
- No backdrop on tent
- No floor markings on putting contest
- No venue staff present`,
  },
  {
    label: "Windsor PTA Donation",
    type: "community_outreach" as AnalysisType,
    content: `From: Danielle Hunt <windsortrivianight@gmail.com>
The Windsor Elementary School PTA is hosting our annual Trivia Night Fundraising Event on February 27, 2026 (~200 attendees).

We are requesting donations of items, services, or gift certificates for our Trivia Night raffle.

As a thank you, all donors receive:
- Recognition on Windsor PTA's Facebook and Instagram pages
- Display of your business name and logo at the event

Organization: Windsor Elementary School PTA (501c3, EIN: 36-3291003)
Location: Knights of Columbus Hall, 15 N Hickory Ave, Arlington Heights, IL 60004

Our proposed donation package:
- 2 x $50 Golf VX gift cards
- 1 FREE Full-Day Summer Camp Week ($699 value) as grand raffle prize
- Include promotional flyers and QR codes
- Request PTA to mention us on social media when announcing sponsors`,
  },
];

// ─── Chat Tab ────────────────────────────────────────────────────────────────

function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<Context>("general");

  const { data: suggestedPrompts } = trpc.workspace.getSuggestedPrompts.useQuery();

  const chatMutation = trpc.workspace.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: "assistant" as const, content: String(data.reply) },
      ]);
    },
    onError: (err) => {
      setMessages(prev => [
        ...prev,
        { role: "assistant" as const, content: `Sorry, I encountered an error: ${err.message}. Please try again.` },
      ]);
    },
  });

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    chatMutation.mutate({ messages: newMessages, context });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Context selector */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CONTEXT_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const isActive = context === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setContext(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? "bg-[#F5C72C] text-[#111111] border-[#F5C72C]"
                  : "bg-transparent text-muted-foreground border-border hover:border-[#F5C72C]/50 hover:text-foreground"
              }`}
            >
              <Icon size={11} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Chat area */}
      <div className="flex-1 min-h-0">
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={chatMutation.isPending}
          placeholder={`Ask about ${CONTEXT_OPTIONS.find(o => o.value === context)?.description?.toLowerCase() || "anything"}...`}
          height="100%"
          className="h-full"
          emptyStateMessage="Your Golf VX AI assistant is ready. Ask about campaign performance, member retention, program results, or get help drafting content."
          suggestedPrompts={suggestedPrompts || [
            "How are our Meta Ads performing this month?",
            "What should we focus on to hit 300 members?",
            "Draft a follow-up email for trial members who haven't converted",
            "What's the best next action for the Junior Summer Camp campaign?",
          ]}
        />
      </div>

      {messages.length === 0 && (
        <div className="mt-4 flex-shrink-0">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Quick actions</p>
          <div className="flex gap-2 flex-wrap">
            {[
              "Log Drive Day attendance",
              "Generate Junior Camp email",
              "Giveaway status update",
              "This week's top priority",
              "Draft Instagram caption",
            ].map(action => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                className="text-xs h-7 rounded-full border-border text-muted-foreground hover:text-foreground hover:border-[#F5C72C]/50"
                onClick={() => handleSendMessage(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Strategy Workspace Tab ───────────────────────────────────────────────────

function StrategyWorkspaceTab() {
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
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        title,
        content,
        analysisType: selectedType,
        result: data.analysis,
        timestamp: Date.now(),
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  const selectedTypeConfig = ANALYSIS_TYPES.find(t => t.value === selectedType)!;
  const charCount = content.length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-4">
          {/* Type Selector */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Analysis Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {ANALYSIS_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => { setSelectedType(type.value); setCurrentResult(null); }}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all ${
                      selectedType === type.value
                        ? "border-yellow-400/60 bg-yellow-400/10"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <span className={selectedType === type.value ? type.color : "text-muted-foreground"}>
                      {type.icon}
                    </span>
                    <span className={`text-xs font-medium leading-tight ${selectedType === type.value ? "text-foreground" : "text-muted-foreground"}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <span className={selectedTypeConfig.color}>{selectedTypeConfig.label}:</span>{" "}
                {selectedTypeConfig.description}
              </p>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-muted-foreground">Quick start:</span>
            {QUICK_TEMPLATES.map(template => (
              <button
                key={template.label}
                onClick={() => { setSelectedType(template.type); setContent(template.content); setCurrentResult(null); }}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
              >
                {template.label}
              </button>
            ))}
          </div>

          {/* Content Input */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <FileText size={13} />
                  Content to Analyze
                </CardTitle>
                <span className={`text-xs ${charCount > 45000 ? "text-red-400" : "text-muted-foreground"}`}>
                  {charCount.toLocaleString()} / 50,000
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={selectedTypeConfig.placeholder}
                className="min-h-[180px] text-sm font-mono bg-muted/20 border-border resize-y"
                maxLength={50000}
              />
              <button
                onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCustomPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Custom instructions (optional)
              </button>
              {showCustomPrompt && (
                <Textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="Add specific instructions... e.g., 'Focus on the corporate event angle and suggest 3 package tiers with pricing.'"
                  className="min-h-[70px] text-sm bg-muted/20 border-border"
                />
              )}
              <Button
                onClick={() => {
                  if (!content.trim()) return;
                  setCurrentResult(null);
                  analyzeMutation.mutate({
                    content: content.trim(),
                    analysisType: selectedType,
                    customPrompt: customPrompt.trim() || undefined,
                  });
                }}
                disabled={!content.trim() || analyzeMutation.isPending}
                className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
              >
                {analyzeMutation.isPending ? (
                  <><Loader2 size={15} className="mr-2 animate-spin" />Analyzing...</>
                ) : (
                  <><Brain size={15} className="mr-2" />Analyze with AI</>
                )}
              </Button>
              {analyzeMutation.isError && (
                <p className="text-xs text-red-400">Error: {analyzeMutation.error?.message || "Analysis failed."}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: History + Tips */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Clock size={13} />
                Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Your analysis history will appear here.
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map(item => {
                    const typeConfig = ANALYSIS_TYPES.find(t => t.value === item.analysisType);
                    return (
                      <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)}
                          className="w-full flex items-start justify-between gap-2 p-3 text-left hover:bg-muted/20 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={typeConfig?.color || "text-muted-foreground"}>{typeConfig?.icon}</span>
                              <span className="text-xs text-muted-foreground">{typeConfig?.label}</span>
                            </div>
                            <p className="text-xs text-foreground truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); setHistory(prev => prev.filter(h => h.id !== item.id)); }}
                              className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 size={11} />
                            </button>
                            {expandedHistory === item.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </div>
                        </button>
                        {expandedHistory === item.id && (
                          <div className="border-t border-border p-3 bg-muted/10">
                            <div className="prose prose-sm prose-invert max-w-none text-xs">
                              <Streamdown>{item.result}</Streamdown>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-xs h-7"
                              onClick={() => {
                                setSelectedType(item.analysisType);
                                setContent(item.content);
                                setCurrentResult({ analysis: item.result, analysisType: item.analysisType });
                              }}
                            >
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

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Lightbulb size={13} />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {[
                  "Paste full email threads for richer context",
                  "Include numbers and data when available",
                  "Use 'Custom instructions' to ask specific questions",
                  "Try B2B Strategy for the Topgolf email",
                  "Community Outreach helps evaluate donation requests",
                  "Event ROI works great for Chicago Golf Show recap",
                ].map(tip => (
                  <li key={tip} className="flex gap-2">
                    <span className="text-yellow-400 shrink-0">•</span>
                    {tip}
                  </li>
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
          <Card className="bg-card border-border border-yellow-400/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Brain size={17} className="text-yellow-400" />
                  AI Analysis Result
                  {currentResult && (
                    <Badge variant="outline" className={`text-xs ml-2 ${ANALYSIS_TYPES.find(t => t.value === currentResult.analysisType)?.color || ""} border-current`}>
                      {ANALYSIS_TYPES.find(t => t.value === currentResult.analysisType)?.label}
                    </Badge>
                  )}
                </CardTitle>
                {currentResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => navigator.clipboard.writeText(currentResult.analysis)}
                  >
                    Copy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {analyzeMutation.isPending ? (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <Loader2 size={20} className="animate-spin text-yellow-400" />
                  <span className="text-muted-foreground text-sm">Analyzing content with AI...</span>
                </div>
              ) : currentResult ? (
                <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
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

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "chat" | "strategy";

export default function AIWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5C72C]/10 flex items-center justify-center">
              <Brain size={18} className="text-[#F5C72C]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">AI Workspace</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chat assistant + document analysis for strategic marketing decisions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-[#F5C72C]" />
            <span className="text-xs text-muted-foreground">Live data connected</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "chat"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bot size={14} />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("strategy")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "strategy"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Brain size={14} />
            Strategy Workspace
            <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10 text-[10px] px-1.5 py-0 h-4">
              New
            </Badge>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className={`flex-1 min-h-0 ${activeTab === "chat" ? "px-6 py-4 flex flex-col" : "px-6 py-5 overflow-y-auto"}`}>
        {activeTab === "chat" ? <ChatTab /> : <StrategyWorkspaceTab />}
      </div>
    </div>
  );
}
