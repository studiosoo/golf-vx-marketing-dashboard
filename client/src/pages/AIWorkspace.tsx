import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Bot, Zap, TrendingUp, Users, DollarSign, Calendar,
  Brain, Target, BarChart3, Building2, Megaphone, HandHeart,
  MessageSquare, Loader2, ChevronDown, ChevronUp, Clock,
  Trash2, FileText, Lightbulb, Sparkles, RefreshCw,
  CheckCircle2, AlertTriangle, Paperclip, X, Upload, Image, FileIcon,
} from "lucide-react";
import { Streamdown } from "streamdown";

// ─── Supported file types ────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/csv", "text/markdown",
  "application/json",
  "video/mp4", "video/quicktime",
  "audio/mpeg", "audio/wav",
].join(",");

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB

type AttachedFile = {
  fileName: string;
  mimeType: string;
  fileType: "image" | "gemini" | "text";
  dataUrl?: string;   // images
  fileUri?: string;   // Gemini File API (PDF, video, audio)
  extractedText?: string; // plain text files
};

// ─── FileUploadZone ───────────────────────────────────────────────────────────

function FileUploadZone({
  onAttached,
  attached,
  onRemove,
  compact = false,
}: {
  onAttached: (file: AttachedFile) => void;
  attached: AttachedFile | null;
  onRemove: () => void;
  compact?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.aiWorkspace.uploadFile.useMutation({
    onSuccess: (result) => {
      onAttached(result as AttachedFile);
      toast.success(`File attached: ${result.fileName}`);
    },
    onError: (err) => toast.error(`Upload failed: ${err.message}`),
  });

  const processFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File too large (max 50MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      uploadMutation.mutate({ base64, mimeType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  }, [uploadMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  // Show attached chip
  if (attached) {
    const icon = attached.fileType === "image"
      ? <Image size={13} className="text-[#F2DD48]" />
      : <FileIcon size={13} className="text-[#F2DD48]" />;
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F2DD48]/10 border border-[#F2DD48]/30 rounded-lg text-xs text-[#222222]">
        {icon}
        <span className="truncate max-w-[200px] font-medium">{attached.fileName}</span>
        <span className="text-[#6F6F6B] capitalize ml-1">
          ({attached.fileType === "gemini" ? "PDF/File" : attached.fileType})
        </span>
        <button onClick={onRemove} className="ml-auto text-[#6F6F6B] hover:text-[#222222] shrink-0">
          <X size={13} />
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <>
        <input ref={inputRef} type="file" accept={ACCEPTED_MIME_TYPES} className="hidden" onChange={handleChange} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#DEDEDA] text-xs text-[#6F6F6B] hover:border-[#F2DD48]/50 hover:text-[#222222] transition-colors disabled:opacity-50"
        >
          {uploadMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
          {uploadMutation.isPending ? "Uploading…" : "Attach file"}
        </button>
      </>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={ACCEPTED_MIME_TYPES} className="hidden" onChange={handleChange} />
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition-colors ${
          isDragging
            ? "border-[#F2DD48] bg-[#F2DD48]/5"
            : "border-[#DEDEDA] hover:border-[#F2DD48]/50 hover:bg-[#F1F1EF]/20"
        }`}
      >
        {uploadMutation.isPending ? (
          <><Loader2 size={20} className="animate-spin text-[#F2DD48]" /><p className="text-xs text-[#6F6F6B]">Uploading file…</p></>
        ) : (
          <>
            <Upload size={20} className="text-[#6F6F6B]" />
            <div className="text-center">
              <p className="text-xs font-medium text-[#222222]">Drop file here or click to browse</p>
              <p className="text-xs text-[#6F6F6B] mt-0.5">PDF, images, text, video, audio — up to 50MB</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

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
    color: "text-[#6F6F6B]",
  },
  {
    value: "marketing_plan",
    label: "Marketing Plan",
    icon: <Target size={15} />,
    description: "Generate a detailed marketing action plan",
    placeholder: "Describe the situation, goal, or context you want a marketing plan for...\n\nExample: We want to increase trial session bookings by 30% in Q2. We have a $2,000/month budget.",
    color: "text-[#72B84A]",
  },
  {
    value: "event_roi",
    label: "Event ROI",
    icon: <BarChart3 size={15} />,
    description: "Evaluate event performance and ROI",
    placeholder: "Paste your event recap, notes, or data...\n\nExample: Paste the Chicago Golf Show recap with visitor counts, giveaways distributed, leads captured, and costs.",
    color: "text-[#F2DD48]",
  },
  {
    value: "b2b_strategy",
    label: "B2B Strategy",
    icon: <Building2 size={15} />,
    description: "Develop corporate events and partnership strategy",
    placeholder: "Paste any B2B-related content: competitor promotions, corporate inquiry emails, partnership ideas...\n\nExample: Paste Kyu's forwarded Topgolf email about corporate event promotions.",
    color: "text-[#6F6F6B]",
  },
  {
    value: "campaign_brief",
    label: "Campaign Brief",
    icon: <Megaphone size={15} />,
    description: "Write a complete campaign brief",
    placeholder: "Describe the campaign idea or paste relevant context...\n\nExample: We want to run a spring campaign targeting families for our Junior Summer Camp. Budget: $1,500.",
    color: "text-[#F2DD48]",
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
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);

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
    // For text files: prepend extracted text into message
    const messageContent = attachedFile?.extractedText
      ? `[File: ${attachedFile.fileName}]\n${attachedFile.extractedText.slice(0, 8000)}\n\n---\n\n${content}`
      : content;

    const newMessages: Message[] = [...messages, { role: "user", content: messageContent }];
    setMessages(newMessages);

    const mutationInput: Parameters<typeof chatMutation.mutate>[0] = {
      messages: newMessages,
      context,
    };

    if (attachedFile?.fileType === "image" && attachedFile.dataUrl) {
      mutationInput.fileDataUrl = attachedFile.dataUrl;
      mutationInput.fileType = "image";
      mutationInput.fileName = attachedFile.fileName;
    }

    chatMutation.mutate(mutationInput);
    setAttachedFile(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Context selector + File attach */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {CONTEXT_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const isActive = context === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setContext(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? "bg-[#F2DD48] text-[#222222] border-[#F2DD48]"
                  : "bg-transparent text-[#6F6F6B] border-[#DEDEDA] hover:border-[#F2DD48]/50 hover:text-[#222222]"
              }`}
            >
              <Icon size={11} />
              {opt.label}
            </button>
          );
        })}
        <div className="ml-auto">
          <FileUploadZone
            onAttached={setAttachedFile}
            attached={attachedFile}
            onRemove={() => setAttachedFile(null)}
            compact
          />
        </div>
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
          <p className="text-xs text-[#6F6F6B] mb-2 font-medium uppercase tracking-wide">Quick actions</p>
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
                className="text-xs h-7 rounded-full border-[#DEDEDA] text-[#6F6F6B] hover:text-[#222222] hover:border-[#F2DD48]/50"
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
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleFileAttached = (file: AttachedFile) => {
    setAttachedFile(file);
    // For text files, auto-populate the textarea
    if (file.extractedText) {
      setContent(file.extractedText.slice(0, 50000));
    }
  };

  const analyzeMutation = trpc.aiWorkspace.analyze.useMutation({
    onSuccess: (data) => {
      setCurrentResult(data);
      const title = (attachedFile?.fileName || content).slice(0, 60).replace(/\n/g, " ").trim() + "...";
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
          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-[#6F6F6B] uppercase tracking-wide">Analysis Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {ANALYSIS_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => { setSelectedType(type.value); setCurrentResult(null); }}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all ${
                      selectedType === type.value
                        ? "border-[#F2DD48]/60 bg-[#F2DD48]/10"
                        : "border-[#DEDEDA] bg-[#F1F1EF]/20 hover:bg-[#F6F6F4]"
                    }`}
                  >
                    <span className={selectedType === type.value ? type.color : "text-[#6F6F6B]"}>
                      {type.icon}
                    </span>
                    <span className={`text-xs font-medium leading-tight ${selectedType === type.value ? "text-[#222222]" : "text-[#6F6F6B]"}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#6F6F6B] mt-3">
                <span className={selectedTypeConfig.color}>{selectedTypeConfig.label}:</span>{" "}
                {selectedTypeConfig.description}
              </p>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-[#6F6F6B]">Quick start:</span>
            {QUICK_TEMPLATES.map(template => (
              <button
                key={template.label}
                onClick={() => { setSelectedType(template.type); setContent(template.content); setCurrentResult(null); }}
                className="text-xs px-3 py-1.5 rounded-full border border-[#DEDEDA] bg-[#F1F1EF]/20 hover:bg-[#F6F6F4] text-[#6F6F6B] hover:text-[#222222] transition-colors"
              >
                {template.label}
              </button>
            ))}
          </div>

          {/* Content Input */}
          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-[#6F6F6B] uppercase tracking-wide flex items-center gap-2">
                  <FileText size={13} />
                  Content to Analyze
                </CardTitle>
                <span className={`text-xs ${charCount > 45000 ? "text-[#FF3B30]" : "text-[#6F6F6B]"}`}>
                  {charCount.toLocaleString()} / 50,000
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* File upload zone */}
              <FileUploadZone
                onAttached={handleFileAttached}
                attached={attachedFile}
                onRemove={() => { setAttachedFile(null); }}
              />

              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={attachedFile ? "Add notes or context about the attached file (optional)..." : selectedTypeConfig.placeholder}
                className="min-h-[140px] text-sm font-mono bg-[#F1F1EF]/20 border-[#DEDEDA] resize-y"
                maxLength={50000}
              />
              <button
                onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                className="flex items-center gap-1 text-xs text-[#6F6F6B] hover:text-[#222222] transition-colors"
              >
                {showCustomPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Custom instructions (optional)
              </button>
              {showCustomPrompt && (
                <Textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="Add specific instructions... e.g., 'Focus on the corporate event angle and suggest 3 package tiers with pricing.'"
                  className="min-h-[70px] text-sm bg-[#F1F1EF]/20 border-[#DEDEDA]"
                />
              )}
              <Button
                onClick={() => {
                  if (!content.trim() && !attachedFile) return;
                  setCurrentResult(null);
                  analyzeMutation.mutate({
                    content: content.trim(),
                    analysisType: selectedType,
                    customPrompt: customPrompt.trim() || undefined,
                    // File attachment
                    fileType: attachedFile?.fileType,
                    fileUri: attachedFile?.fileUri,
                    fileMimeType: attachedFile?.mimeType,
                    fileDataUrl: attachedFile?.dataUrl,
                    fileName: attachedFile?.fileName,
                  });
                }}
                disabled={(!content.trim() && !attachedFile) || analyzeMutation.isPending}
                className="w-full bg-[#F2DD48] text-black hover:bg-yellow-300 font-semibold"
              >
                {analyzeMutation.isPending ? (
                  <><Loader2 size={15} className="mr-2 animate-spin" />Analyzing...</>
                ) : (
                  <><Brain size={15} className="mr-2" />Analyze with AI</>
                )}
              </Button>
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
                <Clock size={13} />
                Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-xs text-[#6F6F6B] text-center py-6">
                  Your analysis history will appear here.
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map(item => {
                    const typeConfig = ANALYSIS_TYPES.find(t => t.value === item.analysisType);
                    return (
                      <div key={item.id} className="border border-[#DEDEDA] rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)}
                          className="w-full flex items-start justify-between gap-2 p-3 text-left hover:bg-[#F1F1EF]/20 transition-colors"
                        >
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
                            <button
                              onClick={e => { e.stopPropagation(); setHistory(prev => prev.filter(h => h.id !== item.id)); }}
                              className="text-[#6F6F6B] hover:text-[#FF3B30] transition-colors p-1"
                            >
                              <Trash2 size={11} />
                            </button>
                            {expandedHistory === item.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </div>
                        </button>
                        {expandedHistory === item.id && (
                          <div className="border-t border-[#DEDEDA] p-3 bg-[#F1F1EF]/10">
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

          <Card className="bg-white border-[#DEDEDA]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-[#6F6F6B] uppercase tracking-wide flex items-center gap-2">
                <Lightbulb size={13} />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-[#6F6F6B]">
                {[
                  "Upload PDFs, images, or text files directly",
                  "Drop a competitor PDF or flyer for instant analysis",
                  "Paste full email threads for richer context",
                  "Include numbers and data when available",
                  "Use 'Custom instructions' to ask specific questions",
                  "Event ROI works great for Chicago Golf Show recap",
                ].map(tip => (
                  <li key={tip} className="flex gap-2">
                    <span className="text-[#F2DD48] shrink-0">•</span>
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
          <Card className="bg-white border-[#DEDEDA] border-[#F2DD48]/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#222222] flex items-center gap-2">
                  <Brain size={17} className="text-[#F2DD48]" />
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
                  <Loader2 size={20} className="animate-spin text-[#F2DD48]" />
                  <span className="text-[#6F6F6B] text-sm">Analyzing content with AI...</span>
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

// ─── Action Plan Tab ─────────────────────────────────────────────────────────
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
interface QuickWin { title: string; action: string; time: string; }
interface KpiTarget { metric: string; current: string; target: string; by: string; }
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
          {priority.steps && priority.steps.length > 0 && (
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

function ActionPlanTab() {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [focus, setFocus] = useState<Focus>("all");
  const [plan, setPlan] = useState<ActionPlanData | null>(null);

  const generateMutation = trpc.intelligence.generateActionPlan.useMutation({
    onSuccess: (data) => { setPlan(data as ActionPlanData); toast.success("Action plan generated"); },
    onError: (err) => toast.error(`Failed to generate plan: ${err.message}`),
  });

  const FOCUS_OPTIONS: { value: Focus; label: string }[] = [
    { value: "all", label: "All Areas" },
    { value: "membership", label: "Membership" },
    { value: "meta_ads", label: "Meta Ads" },
    { value: "programs", label: "Programs" },
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
              {(["week", "month"] as Timeframe[]).map(t => (
                <button key={t} onClick={() => setTimeframe(t)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  timeframe === t ? "bg-[#111] text-white border-[#111]" : "bg-white text-[#6F6F6B] border-[#DEDEDA] hover:border-[#111]"
                }`}>{t === "week" ? "This Week" : "This Month"}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6F6F6B] uppercase tracking-wide mb-2 block">Focus Area</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setFocus(opt.value)} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  focus === opt.value ? "bg-[#F2DD48] text-[#111] border-[#F2DD48]" : "bg-white text-[#6F6F6B] border-[#DEDEDA] hover:border-[#F2DD48]/50"
                }`}>{opt.label}</button>
              ))}
            </div>
          </div>
          <Button onClick={() => generateMutation.mutate({ timeframe, focus })} disabled={generateMutation.isPending}
            className="flex items-center gap-2 bg-[#F2DD48] hover:bg-[#E6B800] text-[#111] font-semibold px-5 py-2.5 rounded-lg border-0 ml-auto">
            {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generateMutation.isPending ? "Generating…" : "Generate Plan"}
          </Button>
        </div>
      </div>
      {!plan && !generateMutation.isPending && (
        <div className="bg-white border border-dashed border-[#DEDEDA] rounded-xl p-12 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-4 text-[#F2DD48]" />
          <h3 className="text-base font-semibold text-[#111] mb-2">Ready to Generate Your Action Plan</h3>
          <p className="text-sm text-[#6F6F6B] max-w-md mx-auto mb-6">Select a timeframe and focus area, then click "Generate Plan" to receive AI-powered strategic recommendations.</p>
          <Button onClick={() => generateMutation.mutate({ timeframe, focus })} className="flex items-center gap-2 bg-[#F2DD48] hover:bg-[#E6B800] text-[#111] font-semibold px-6 py-2.5 rounded-lg border-0 mx-auto">
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
          <div className="bg-white border border-[#DEDEDA] rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F2DD48]/10 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-[#8B6E00]" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2"><Target className="w-4 h-4 text-[#111]" /><h2 className="text-sm font-semibold text-[#111]">Top Priorities</h2><span className="text-xs bg-[#F1F1EF] border border-[#DEDEDA] text-[#6F6F6B] px-2 py-0.5 rounded-full">{plan.topPriorities?.length || 0}</span></div>
              <div className="space-y-3">{(plan.topPriorities || []).map((p, i) => <PriorityCard key={i} priority={p} index={i} />)}</div>
            </div>
            <div className="space-y-4">
              {plan.quickWins && plan.quickWins.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-[#8B6E00]" /><h2 className="text-sm font-semibold text-[#111]">Quick Wins</h2></div>
                  <div className="space-y-2">{plan.quickWins.map((qw, i) => (
                    <div key={i} className="bg-white border border-[#DEDEDA] rounded-xl p-3 hover:border-[#F2DD48]/40 transition-colors">
                      <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#F2DD48] shrink-0 mt-0.5" /><div><p className="text-xs font-semibold text-[#111]">{qw.title}</p><p className="text-xs text-[#6F6F6B] mt-0.5">{qw.action}</p><span className="text-xs text-[#999] mt-1 inline-block"><Clock size={10} className="inline mr-1" />{qw.time}</span></div></div>
                    </div>
                  ))}</div>
                </div>
              )}
              {plan.kpiTargets && plan.kpiTargets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-[#6F6F6B]" /><h2 className="text-sm font-semibold text-[#111]">KPI Targets</h2></div>
                  <div className="bg-white border border-[#DEDEDA] rounded-xl overflow-hidden">{plan.kpiTargets.map((kpi, i) => (
                    <div key={i} className={`px-4 py-3 ${i < plan.kpiTargets.length - 1 ? "border-b border-[#F1F1EF]" : ""}`}>
                      <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-[#111]">{kpi.metric}</span><span className="text-xs text-[#6F6F6B]">{kpi.by}</span></div>
                      <div className="flex items-center gap-2"><span className="text-xs text-[#6F6F6B]">{kpi.current}</span><span className="text-xs text-[#A8A8A3]">→</span><span className="text-xs font-semibold text-[#72B84A] bg-green-50 px-1.5 py-0.5 rounded">{kpi.target}</span></div>
                    </div>
                  ))}</div>
                </div>
              )}
              {plan.risks && plan.risks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-[#F2DD48]" /><h2 className="text-sm font-semibold text-[#111]">Watch Out For</h2></div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">{plan.risks.map((risk, i) => (
                    <div key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" /><p className="text-xs text-[#222222]">{risk}</p></div>
                  ))}</div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <Button onClick={() => generateMutation.mutate({ timeframe, focus })} variant="outline" className="flex items-center gap-2 text-sm font-medium text-[#6F6F6B] border-[#DEDEDA] hover:border-[#111] bg-white">
              <RefreshCw className="w-4 h-4" />Regenerate Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

type Tab = "chat" | "strategy" | "action-plan";

const FALLBACK_MODELS = {
  chat: "gemini-2.0-flash-lite",
  analysis: "gemini-2.5-pro",
  structured: "gemini-2.5-flash",
} as const;

export default function AIWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const modelConfigQuery = trpc.aiWorkspace.getModelConfig.useQuery(undefined, {
    staleTime: 60_000,
  });
  const models = modelConfigQuery.data ?? FALLBACK_MODELS;

  const activeModel =
    activeTab === "chat"
      ? models.chat
      : activeTab === "strategy"
      ? models.analysis
      : models.structured;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#DEDEDA] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F2DD48]/10 flex items-center justify-center">
              <Brain size={18} className="text-[#F2DD48]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#222222]">AI Workspace</h1>
              <p className="text-xs text-[#6F6F6B] mt-0.5">
                Chat assistant + document analysis for strategic marketing decisions
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-[#F2DD48]" />
              <span className="text-xs text-[#6F6F6B]">Live data connected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#6F6F6B]/60">model:</span>
              <span className="text-[10px] font-medium text-[#6F6F6B] bg-[#F1F1EF] px-1.5 py-0.5 rounded">
                {activeModel}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-[#F6F6F4] rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "chat"
                ? "bg-white text-[#222222] shadow-sm"
                : "text-[#6F6F6B] hover:text-[#222222]"
            }`}
          >
            <Bot size={14} />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("strategy")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "strategy"
                ? "bg-white text-[#222222] shadow-sm"
                : "text-[#6F6F6B] hover:text-[#222222]"
            }`}
          >
            <Brain size={14} />
            Strategy
          </button>
          <button
            onClick={() => setActiveTab("action-plan")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "action-plan"
                ? "bg-white text-[#222222] shadow-sm"
                : "text-[#6F6F6B] hover:text-[#222222]"
            }`}
          >
            <Target size={14} />
            Action Plan
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className={`flex-1 min-h-0 ${
        activeTab === "chat" ? "px-6 py-4 flex flex-col" : "px-6 py-5 overflow-y-auto"
      }`}>
        {activeTab === "chat" && <ChatTab />}
        {activeTab === "strategy" && <StrategyWorkspaceTab />}
        {activeTab === "action-plan" && <ActionPlanTab />}
      </div>
    </div>
  );
}
