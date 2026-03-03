import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Zap, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";

const CONTEXT_OPTIONS = [
  { value: "general", label: "General", icon: Bot, description: "All topics" },
  { value: "programs", label: "Programs", icon: Calendar, description: "Events & programs" },
  { value: "members", label: "Members", icon: Users, description: "Member management" },
  { value: "meta_ads", label: "Meta Ads", icon: TrendingUp, description: "Ad performance" },
  { value: "revenue", label: "Revenue", icon: DollarSign, description: "Revenue & goals" },
] as const;

type Context = typeof CONTEXT_OPTIONS[number]["value"];

export default function AIWorkspace() {
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
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(newMessages);
    chatMutation.mutate({
      messages: newMessages,
      context,
    });
  };

  const handleSuggestedPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5C72C]/10 flex items-center justify-center">
              <Bot size={18} className="text-[#F5C72C]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">AI Workspace</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your strategic marketing assistant — ask questions, log data, get recommendations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-[#F5C72C]" />
            <span className="text-xs text-muted-foreground">Live data connected</span>
          </div>
        </div>

        {/* Context selector */}
        <div className="mt-4 flex gap-2 flex-wrap">
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
      </div>

      {/* Chat area */}
      <div className="flex-1 min-h-0 px-6 py-4">
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
            "Analyze our member retention rate and suggest improvements",
          ]}
        />
      </div>

      {/* Quick action chips */}
      {messages.length === 0 && (
        <div className="px-6 pb-6 flex-shrink-0">
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
                onClick={() => handleSuggestedPrompt(action)}
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
