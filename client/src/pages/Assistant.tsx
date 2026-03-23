import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Bot, Calendar, Users, TrendingUp, DollarSign, Image, RotateCcw } from "lucide-react";

// ─── Context Options ──────────────────────────────────────────────────────────

const CONTEXT_OPTIONS = [
  { value: "general",   label: "General",   icon: Bot,         description: "All topics" },
  { value: "programs",  label: "Programs",  icon: Calendar,    description: "Events & programs" },
  { value: "members",   label: "Members",   icon: Users,       description: "Member management" },
  { value: "meta_ads",  label: "Meta Ads",  icon: TrendingUp,  description: "Ad performance" },
  { value: "revenue",   label: "Revenue",   icon: DollarSign,  description: "Revenue & goals" },
  { value: "content",   label: "Content",   icon: Image,       description: "Instagram & social" },
] as const;

type Context = typeof CONTEXT_OPTIONS[number]["value"];

const QUICK_ACTIONS = [
  "What's my top marketing priority this week?",
  "How are our Meta Ads performing?",
  "Draft an Instagram caption for Drive Day",
  "What should we do to hit 300 members?",
  "Generate a follow-up email for trial members",
  "Analyze our Junior Summer Camp campaign",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSearchParams(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return params;
  raw.split("&").forEach((pair) => {
    const [key, value] = pair.split("=");
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value ?? "");
  });
  return params;
}

function isValidContext(value: string): value is Context {
  return CONTEXT_OPTIONS.some((opt) => opt.value === value);
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

interface LeftPanelProps {
  context: Context;
  onContextChange: (ctx: Context) => void;
  onQuickAction: (action: string) => void;
  onNewChat: () => void;
  suggestedPrompts: string[];
  onSuggestedPrompt: (prompt: string) => void;
  hasMessages: boolean;
}

function LeftPanel({
  context,
  onContextChange,
  onQuickAction,
  onNewChat,
  suggestedPrompts,
  onSuggestedPrompt,
  hasMessages,
}: LeftPanelProps) {
  return (
    <aside className="w-[280px] shrink-0 flex flex-col bg-[#F9F9F9] border-r border-[#DEDEDA] overflow-y-auto">
      {/* Header with New Chat */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wider">Context</p>
        {hasMessages && (
          <button
            onClick={onNewChat}
            className="flex items-center gap-1 text-[11px] text-[#888888] hover:text-[#222222] transition-colors"
          >
            <RotateCcw size={11} />
            New Chat
          </button>
        )}
      </div>
      {/* Context */}
      <div className="px-4 pb-2">
        <div className="flex flex-col gap-1.5">
          {CONTEXT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = context === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onContextChange(opt.value)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-[10px] text-sm font-medium transition-all border ${
                  isActive
                    ? "bg-[#F2DD48] text-[#222222] border-[#F2DD48]"
                    : "bg-transparent text-[#888888] border-[#DEDEDA] hover:text-[#222222] hover:border-[#CCCCCC]"
                }`}
              >
                <Icon size={14} />
                <span>{opt.label}</span>
                <span
                  className={`ml-auto text-[11px] ${
                    isActive ? "text-[#222222]/60" : "text-[#AAAAAA]"
                  }`}
                >
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-4 my-4 border-t border-[#DEDEDA]" />

      {/* Context-specific quick actions */}
      <div className="px-4 pb-2">
        <p className="text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wider mb-3">
          {context === "content" ? "Content Ideas" : "Quick Actions"}
        </p>
        <div className="flex flex-col gap-1.5">
          {(context === "content" ? [
            "Draft 3 Instagram captions for Drive Day",
            "Create a Reel script for simulator highlights",
            "Write a caption for a member milestone post",
            "Suggest this week's content calendar",
            "What hashtags should we use for Junior Camp?",
            "Write a caption for a behind-the-scenes video",
          ] : QUICK_ACTIONS).map((action) => (
            <button
              key={action}
              onClick={() => onQuickAction(action)}
              disabled={hasMessages}
              className="w-full text-left px-3 py-2 rounded-[10px] text-sm text-[#222222] border border-[#DEDEDA] bg-white hover:bg-gray-50 hover:border-[#CCCCCC] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {suggestedPrompts.length > 0 && (
        <>
          <div className="mx-4 my-4 border-t border-[#DEDEDA]" />

          {/* Suggested Prompts */}
          <div className="px-4 pb-4">
            <p className="text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wider mb-3">
              Suggested Prompts
            </p>
            <div className="flex flex-col gap-1.5">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestedPrompt(prompt)}
                  className="w-full text-left px-3 py-2 rounded-[10px] text-sm text-[#888888] border border-[#DEDEDA] bg-white hover:text-[#222222] hover:bg-gray-50 hover:border-[#CCCCCC] transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-auto px-4 py-4">
        <p className="text-[11px] text-[#AAAAAA] text-center">
          Powered by Claude Sonnet · Golf VX AI
        </p>
      </div>
    </aside>
  );
}

// ─── Assistant Page ───────────────────────────────────────────────────────────

export default function Assistant() {
  const search = useSearch();
  const params = parseSearchParams(search);

  const initialContext: Context =
    params.context && isValidContext(params.context) ? params.context : "general";

  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<Context>(initialContext);
  const [deepLinkFired, setDeepLinkFired] = useState(false);

  const { data: suggestedPromptsData } = trpc.workspace.getSuggestedPrompts.useQuery();

  const suggestedPrompts: string[] = suggestedPromptsData ?? [
    "How are our Meta Ads performing this month?",
    "What should we focus on to hit 300 members?",
    "Draft a follow-up email for trial members who haven't converted",
    "What's the best next action for the Junior Summer Camp campaign?",
  ];

  const chatMutation = trpc.workspace.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: String(data.reply) },
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        },
      ]);
    },
  });

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    chatMutation.mutate({ messages: newMessages, context });
  };

  // Deep-link: auto-send initial message if ?program=<id>&context=programs
  useEffect(() => {
    if (deepLinkFired) return;
    const programId = params.program;
    if (!programId || params.context !== "programs") return;

    setDeepLinkFired(true);
    const initMessage = `Give me an AI analysis for the ${programId} campaign. Include performance insights, key metrics, and recommended next actions.`;
    const newMessages: Message[] = [{ role: "user", content: initMessage }];
    setMessages(newMessages);
    chatMutation.mutate({ messages: newMessages, context: "programs" });
  }, [params.program, params.context, deepLinkFired]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeContextDesc =
    CONTEXT_OPTIONS.find((o) => o.value === context)?.description?.toLowerCase() ?? "anything";

  return (
    <div className="flex h-full bg-white">
      {/* Left panel — hidden on mobile, visible from md up */}
      <div className="hidden md:flex">
        <LeftPanel
          context={context}
          onContextChange={setContext}
          onQuickAction={handleSendMessage}
          onNewChat={() => setMessages([])}
          suggestedPrompts={suggestedPrompts}
          onSuggestedPrompt={handleSendMessage}
          hasMessages={messages.length > 0}
        />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0 p-4 md:p-6 gap-3">
        {/* Mobile context selector */}
        <div className="flex gap-2 flex-wrap md:hidden">
          {CONTEXT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = context === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setContext(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isActive
                    ? "bg-[#F2DD48] text-[#222222] border-[#F2DD48]"
                    : "bg-transparent text-[#888888] border-[#DEDEDA] hover:text-[#222222] hover:border-[#CCCCCC]"
                }`}
              >
                <Icon size={11} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder={`Ask about ${activeContextDesc}...`}
            height="100%"
            className="h-full"
            emptyStateMessage="Your Golf VX marketing assistant is ready. Select a context and ask anything — campaign analysis, content drafting, member insights, or quick strategy questions."
            suggestedPrompts={messages.length === 0 ? suggestedPrompts : undefined}
          />
        </div>
      </div>
    </div>
  );
}
