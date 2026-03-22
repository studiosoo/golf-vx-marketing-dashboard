import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BarChart3,
  FileText,
  Zap,
  Mail,
  Target,
  Loader2,
  RefreshCw,
  CheckCircle,
  SkipForward,
  ChevronDown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type ActionType = "meta_ads" | "content" | "boost" | "email" | "conversion";
type ActionPriority = "urgent" | "high" | "medium" | "low";
type ActionStatus = "pending" | "in_progress" | "completed" | "skipped";

interface CampaignAction {
  id: number;
  planId: number;
  type: ActionType;
  priority: ActionPriority;
  title: string;
  description: string;
  expectedImpact: string | null;
  effortRequired: string | null;
  status: ActionStatus;
  completedAt: Date | null;
  result: string | null;
}

interface DailyPlan {
  id: number;
  campaignId: string;
  date: Date;
  generatedAt: Date;
  aiAnalysis: string;
  totalActions: number;
  completedActions: number;
  actions: CampaignAction[];
}

interface Campaign {
  id: number;
  name: string;
  status: string;
}

type FilterTab = "all" | "urgent" | "high" | "completed";

// ── Small helpers ──────────────────────────────────────────────────────────

const ACTION_ICONS: Record<ActionType, React.ElementType> = {
  meta_ads: BarChart3,
  content: FileText,
  boost: Zap,
  email: Mail,
  conversion: Target,
};

const PRIORITY_STYLES: Record<ActionPriority, { label: string; className: string }> = {
  urgent: { label: "Urgent",  className: "bg-red-50 text-red-700 border border-red-200" },
  high:   { label: "High",    className: "bg-orange-50 text-orange-700 border border-orange-200" },
  medium: { label: "Medium",  className: "bg-[#888888]/10 text-[#888888] border border-blue-200" },
  low:    { label: "Low",     className: "bg-gray-50 text-gray-500 border border-gray-200" },
};

function PriorityBadge({ priority }: { priority: ActionPriority }) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function TypeIcon({ type }: { type: ActionType }) {
  const Icon = ACTION_ICONS[type];
  return (
    <div className="w-9 h-9 rounded-lg bg-[#F1F1EF] flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-[#555]" />
    </div>
  );
}

// ── ActionCard ─────────────────────────────────────────────────────────────

interface ActionCardProps {
  action: CampaignAction;
  onComplete: (id: number) => void;
  onSkip: (id: number) => void;
  isLoading: boolean;
}

function ActionCard({ action, onComplete, onSkip, isLoading }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isDone = action.status === "completed" || action.status === "skipped";

  return (
    <div
      className={`bg-white border rounded-[10px] p-4 space-y-3 transition-colors ${
        isDone
          ? "border-[#DEDEDA] opacity-60"
          : "border-[#DEDEDA] hover:border-[#F2DD48]/50"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <TypeIcon type={action.type} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <PriorityBadge priority={action.priority} />
            {action.status === "completed" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-[#72B84A] border border-green-200">
                <CheckCircle className="w-3 h-3" />
                Completed
              </span>
            )}
            {action.status === "skipped" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#F1F1EF] text-[#888888] border border-[#DEDEDA]">
                Skipped
              </span>
            )}
            <span className="text-xs text-[#AAAAAA] capitalize">{action.type.replace("_", " ")}</span>
          </div>

          <p className="text-sm font-semibold text-[#222222] leading-snug">{action.title}</p>
          <p className="text-xs text-[#888888] mt-0.5 leading-relaxed line-clamp-2">{action.description}</p>

          {(action.expectedImpact || action.effortRequired) && (
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[#AAAAAA]">
              {action.expectedImpact && (
                <span>Impact: <span className="text-[#888888]">{action.expectedImpact}</span></span>
              )}
              {action.effortRequired && (
                <span>Effort: <span className="text-[#888888]">{action.effortRequired}</span></span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isDone && (
            <>
              <button
                onClick={() => onComplete(action.id)}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F2DD48] hover:bg-[#E6B800] text-[#222222] rounded text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Done
              </button>
              <button
                onClick={() => onSkip(action.id)}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F1F1EF] hover:bg-[#E8E8E8] text-[#555] border border-[#DEDEDA] rounded text-xs font-medium transition-colors disabled:opacity-50"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-[#AAAAAA] hover:text-[#222222] hover:bg-[#F1F1EF] rounded transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="pt-2 border-t border-[#F0F0F0] space-y-1.5">
          <p className="text-xs text-[#444] leading-relaxed">{action.description}</p>
          {action.result && (
            <p className="text-xs text-[#888888] italic">Result: {action.result}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── ProgressBar ────────────────────────────────────────────────────────────

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="bg-white border border-[#DEDEDA] rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#222222]">Today's Progress</span>
        <span className="text-sm font-bold text-[#222222]">
          {completed} / {total}
          <span className="text-xs font-normal text-[#888888] ml-1">completed</span>
        </span>
      </div>
      <div className="h-2 bg-[#F1F1EF] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#F2DD48] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-[#AAAAAA] mt-1.5">{pct}% complete</p>
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────────────────────

function EmptyState({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-[#F1F1EF] flex items-center justify-center mb-4">
        <Target className="w-6 h-6 text-[#AAAAAA]" />
      </div>
      <p className="text-base font-semibold text-[#222222] mb-1">No plan for today</p>
      <p className="text-sm text-[#888888] mb-6 max-w-xs">
        Generate an AI-powered action plan based on yesterday's campaign performance.
      </p>
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex items-center gap-2 px-6 py-3 bg-[#F2DD48] hover:bg-[#E6B800] text-[#222222] font-semibold rounded-[10px] transition-colors disabled:opacity-60"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        {isGenerating ? "Generating plan…" : "Generate Plan"}
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function Tasks() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Fetch campaigns for the dropdown
  const { data: campaigns, isLoading: campaignsLoading } =
    trpc.campaigns.list.useQuery();

  // Auto-select the first campaign when data loads
  useEffect(() => {
    if (campaigns && campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(String(campaigns[0].id));
    }
  }, [campaigns, selectedCampaignId]);

  // Fetch today's plan (only when a campaign is selected)
  const {
    data: plan,
    isLoading: planLoading,
    refetch: refetchPlan,
  } = trpc.dailyActions.getTodayPlan.useQuery(
    { campaignId: selectedCampaignId },
    { enabled: selectedCampaignId !== "" }
  );

  const generateMutation = trpc.dailyActions.generatePlan.useMutation({
    onSuccess: () => {
      toast.success("Action plan generated");
      refetchPlan();
    },
    onError: (err) => toast.error("Failed to generate plan: " + err.message),
  });

  const completeMutation = trpc.dailyActions.completeAction.useMutation({
    onSuccess: () => {
      toast.success("Action marked as complete");
      refetchPlan();
    },
    onError: (err) => toast.error(err.message),
  });

  const skipMutation = trpc.dailyActions.skipAction.useMutation({
    onSuccess: () => {
      refetchPlan();
    },
    onError: (err) => toast.error(err.message),
  });

  const isActionLoading =
    completeMutation.isPending || skipMutation.isPending;

  const handleGenerate = () => {
    if (!selectedCampaignId) {
      toast.error("Select a campaign first");
      return;
    }
    generateMutation.mutate({ campaignId: selectedCampaignId });
  };

  const handleComplete = (actionId: number) => {
    completeMutation.mutate({ actionId });
  };

  const handleSkip = (actionId: number) => {
    skipMutation.mutate({ actionId });
  };

  // Derive filtered actions
  const allActions = (plan as DailyPlan | null)?.actions ?? [];

  const filteredActions = allActions.filter((a) => {
    if (activeTab === "all") return a.status !== "completed" && a.status !== "skipped";
    if (activeTab === "urgent") return a.priority === "urgent" && a.status !== "completed" && a.status !== "skipped";
    if (activeTab === "high") return a.priority === "high" && a.status !== "completed" && a.status !== "skipped";
    if (activeTab === "completed") return a.status === "completed" || a.status === "skipped";
    return true;
  });

  const completedCount = allActions.filter((a) => a.status === "completed").length;
  const totalCount = allActions.length;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "urgent",    label: "Urgent" },
    { key: "high",      label: "High" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="p-6 space-y-6 bg-[#FAFAFA] min-h-full">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#222222] tracking-tight">Tasks</h1>
          <p className="text-sm text-[#888888] mt-0.5">{todayLabel}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Campaign dropdown */}
          {campaignsLoading ? (
            <div className="h-9 w-48 bg-[#F1F1EF] rounded-[10px] animate-pulse" />
          ) : (
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="h-9 bg-white border border-[#DEDEDA] rounded-[10px] px-3 text-sm text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#F2DD48]"
            >
              <option value="">Select campaign…</option>
              {(campaigns ?? []).map((c: Campaign) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Generate plan button */}
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !selectedCampaignId}
            className="flex items-center gap-2 px-4 py-2 bg-[#F2DD48] hover:bg-[#E6B800] text-[#222222] font-semibold text-sm rounded-[10px] transition-colors disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {generateMutation.isPending ? "Generating…" : "Generate Plan"}
          </button>
        </div>
      </div>

      {/* Progress bar (only when plan exists) */}
      {plan && totalCount > 0 && (
        <ProgressBar completed={completedCount} total={totalCount} />
      )}

      {/* AI analysis snippet */}
      {plan && (plan as DailyPlan).aiAnalysis && (
        <div className="bg-[#F2DD48]/8 border border-[#F2DD48]/30 rounded-[10px] p-4">
          <p className="text-xs font-semibold text-[#8B6E00] uppercase tracking-wide mb-1">
            AI Analysis
          </p>
          <p className="text-sm text-[#444444] leading-relaxed">
            {(plan as DailyPlan).aiAnalysis}
          </p>
        </div>
      )}

      {/* Tab bar */}
      {plan && totalCount > 0 && (
        <div className="h-11 flex border-b border-[#DEDEDA] bg-white rounded-t-[10px]">
          {TABS.map(({ key, label }) => {
            const count =
              key === "all"
                ? allActions.filter((a) => a.status !== "completed" && a.status !== "skipped").length
                : key === "completed"
                ? allActions.filter((a) => a.status === "completed" || a.status === "skipped").length
                : allActions.filter((a) => a.priority === key && a.status !== "completed" && a.status !== "skipped").length;

            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 text-sm transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === key
                    ? "text-[#222222] font-semibold border-b-2 border-[#F2DD48]"
                    : "text-[#888888] font-normal hover:text-[#222222]"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className="text-xs bg-[#F1F1EF] border border-[#DEDEDA] text-[#888888] px-1.5 py-0.5 rounded-full font-medium">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content area */}
      {!selectedCampaignId ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-[#888888]">Select a campaign to view today's task plan.</p>
        </div>
      ) : planLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#F2DD48]" />
          <span className="ml-2 text-[#888888] text-sm">Loading plan…</span>
        </div>
      ) : !plan || totalCount === 0 ? (
        <EmptyState onGenerate={handleGenerate} isGenerating={generateMutation.isPending} />
      ) : filteredActions.length === 0 ? (
        <div className="text-center py-12 text-[#AAAAAA]">
          <p className="text-sm">No actions in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action as CampaignAction}
              onComplete={handleComplete}
              onSkip={handleSkip}
              isLoading={isActionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
