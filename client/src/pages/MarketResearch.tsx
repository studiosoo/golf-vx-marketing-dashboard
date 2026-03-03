import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, MapPin, Users, BarChart3, Loader2,
  RefreshCw, ChevronDown, ChevronUp,
  Target, DollarSign, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MARKET_CONTEXT = {
  location: "Arlington Heights, IL",
  population: "77,676",
  medianHouseholdIncome: "$95,400",
  medianAge: "38.2",
  golfParticipationRate: "~12% of adults",
  nearbyCompetitors: [
    { name: "Golf Galaxy (Schaumburg)", distance: "6 mi", type: "Retail + Simulator", threat: "medium" },
    { name: "Five Iron Golf (Chicago)", distance: "22 mi", type: "Indoor Golf Club", threat: "low" },
    { name: "Topgolf (Naperville)", distance: "28 mi", type: "Entertainment Golf", threat: "low" },
    { name: "Arlington Lakes Golf Course", distance: "2 mi", type: "Public Course", threat: "low" },
    { name: "Rolling Green CC", distance: "4 mi", type: "Private Club", threat: "medium" },
  ],
  seasonalTrends: [
    { month: "Jan", index: 40, note: "Indoor peak — simulator demand high" },
    { month: "Feb", index: 45, note: "Winter clinics, indoor leagues" },
    { month: "Mar", index: 65, note: "Spring prep — lesson demand rises" },
    { month: "Apr", index: 80, note: "Season opener — high acquisition" },
    { month: "May", index: 90, note: "Peak season begins" },
    { month: "Jun", index: 95, note: "Peak — junior camps, leagues" },
    { month: "Jul", index: 100, note: "Peak season" },
    { month: "Aug", index: 95, note: "Late summer — back-to-school impact" },
    { month: "Sep", index: 85, note: "Fall season — strong retention" },
    { month: "Oct", index: 70, note: "Shoulder season" },
    { month: "Nov", index: 50, note: "Indoor transition" },
    { month: "Dec", index: 35, note: "Holiday slowdown — gift cards" },
  ],
  demographics: [
    { segment: "Families with children 6–17", size: "~8,200 households", opportunity: "Junior programs, family memberships", priority: "high" },
    { segment: "Adults 35–55 (mid-career)", size: "~18,400 adults", opportunity: "All-Access Aces, corporate events", priority: "high" },
    { segment: "Retirees 60+", size: "~12,100 adults", opportunity: "Weekday clinics, social leagues", priority: "medium" },
    { segment: "Young professionals 25–34", size: "~9,800 adults", opportunity: "Swing Savers, social golf", priority: "medium" },
    { segment: "Corporate accounts", size: "~340 businesses within 5 mi", opportunity: "B2B events, team outings", priority: "high" },
  ],
  keyInsights: [
    {
      title: "Junior Golf Demand Underserved",
      body: "Arlington Heights has ~8,200 families with school-age children. The nearest dedicated junior golf program is 8+ miles away. Junior Summer Camp at $550/child targets this gap — current 0/120 enrollment signals a marketing reach problem, not a demand problem.",
      urgency: "high",
      action: "Launch targeted Facebook/Instagram ads to parents within 5 miles. Offer Early Bird discount through Mar 31.",
    },
    {
      title: "Corporate Event Market Untapped",
      body: "340+ businesses within 5 miles, including several Fortune 500 offices in the Schaumburg/Arlington Heights corridor. Average corporate golf outing spend is $3,500–$8,000. Golf VX's simulator bays are ideal for team-building events with no weather dependency.",
      urgency: "medium",
      action: "Create a dedicated B2B landing page. Target LinkedIn ads to HR managers and office admins in the area.",
    },
    {
      title: "Spring Acquisition Window Opening",
      body: "March–April is the highest-intent period for new golf memberships nationally. Search volume for 'golf lessons near me' spikes 3x in March. Current ad spend ($1,786 total) is below the threshold to capture this window effectively.",
      urgency: "high",
      action: "Increase Meta Ads budget 40–60% for March–April. Focus on Trial Conversion campaign.",
    },
    {
      title: "Competitor Gap: No Premium Indoor Simulator Club",
      body: "Rolling Green CC and Arlington Lakes are outdoor-only. Golf Galaxy offers simulators but as retail, not membership. There is no premium indoor golf club within 10 miles of Arlington Heights — Golf VX owns this position.",
      urgency: "low",
      action: "Emphasize 'year-round golf' and 'no tee time required' in all marketing. This is a key differentiator.",
    },
  ],
};

type ResearchSection = "insights" | "overview" | "competitors" | "demographics" | "seasonal";

function ThreatBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    high: "bg-red-50 text-red-700 border border-red-200",
    medium: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    low: "bg-green-50 text-green-700 border border-green-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[level] || map.low}`}>
      {level} threat
    </span>
  );
}

function PriorityDot({ level }: { level: string }) {
  const map: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-gray-400",
  };
  return <span className={`w-2 h-2 rounded-full ${map[level] || map.low} inline-block flex-shrink-0 mt-1.5`} />;
}

export default function MarketResearch() {
  const [activeSection, setActiveSection] = useState<ResearchSection>("insights");
  const [expandedInsight, setExpandedInsight] = useState<number | null>(0);

  const aiResearchMutation = trpc.workspace.chat.useMutation({
    onSuccess: () => toast.success("AI research complete — check AI Workspace for results"),
    onError: (e) => toast.error("Research failed: " + e.message),
  });

  const sections: { id: ResearchSection; label: string; icon: React.ElementType }[] = [
    { id: "insights", label: "Key Insights", icon: Star },
    { id: "overview", label: "Market Overview", icon: MapPin },
    { id: "competitors", label: "Competitors", icon: Target },
    { id: "demographics", label: "Demographics", icon: Users },
    { id: "seasonal", label: "Seasonal Trends", icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6 bg-[#FAFAFA] min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Market Research</h1>
          <p className="text-sm text-[#666] mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Arlington Heights, IL — local market intelligence and competitive landscape
          </p>
        </div>
        <Button
          onClick={() => aiResearchMutation.mutate({
            messages: [{ role: "user", content: "Generate a brief market research update for Golf VX Arlington Heights. Focus on: 1) current golf industry trends in suburban Chicago, 2) any new competitors or market changes, 3) seasonal recommendations for March 2026." }],
            context: "general",
          })}
          disabled={aiResearchMutation.isPending}
          className="flex items-center gap-2 bg-[#F5C72C] hover:bg-[#E6B800] text-[#111] font-semibold text-sm px-4 py-2 rounded-lg border-0"
        >
          {aiResearchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {aiResearchMutation.isPending ? "Researching…" : "AI Update"}
        </Button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-white border border-[#E0E0E0] rounded-xl p-1 w-fit flex-wrap">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeSection === id
                ? "bg-[#F5C72C] text-[#111]"
                : "text-[#666] hover:text-[#111] hover:bg-[#F5F5F5]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Key Insights */}
      {activeSection === "insights" && (
        <div className="space-y-3">
          {MARKET_CONTEXT.keyInsights.map((insight, i) => (
            <div key={i} className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden hover:border-[#F5C72C]/50 transition-colors">
              <button
                className="w-full flex items-start gap-3 p-4 text-left"
                onClick={() => setExpandedInsight(expandedInsight === i ? null : i)}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${insight.urgency === "high" ? "bg-red-500" : insight.urgency === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#111]">{insight.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${insight.urgency === "high" ? "bg-red-50 text-red-700 border-red-200" : insight.urgency === "medium" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                      {insight.urgency} priority
                    </span>
                  </div>
                  {expandedInsight !== i && (
                    <p className="text-xs text-[#888] mt-0.5 line-clamp-1">{insight.body}</p>
                  )}
                </div>
                {expandedInsight === i ? <ChevronUp className="w-4 h-4 text-[#999] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#999] flex-shrink-0" />}
              </button>
              {expandedInsight === i && (
                <div className="px-4 pb-4 pt-0 space-y-3 border-t border-[#F0F0F0]">
                  <p className="text-sm text-[#444] leading-relaxed">{insight.body}</p>
                  <div className="flex items-start gap-2 p-3 bg-[#F5C72C]/5 border border-[#F5C72C]/20 rounded-lg">
                    <Target className="w-4 h-4 text-[#8B6E00] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#8B6E00] mb-0.5">Recommended Action</p>
                      <p className="text-xs text-[#555]">{insight.action}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Market Overview */}
      {activeSection === "overview" && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Population", value: MARKET_CONTEXT.population, icon: Users, sub: "Arlington Heights" },
            { label: "Median HH Income", value: MARKET_CONTEXT.medianHouseholdIncome, icon: DollarSign, sub: "Above national avg" },
            { label: "Median Age", value: MARKET_CONTEXT.medianAge, icon: BarChart3, sub: "Prime golf demographic" },
            { label: "Golf Participation", value: MARKET_CONTEXT.golfParticipationRate, icon: TrendingUp, sub: "~9,300 local golfers" },
          ].map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="bg-white border border-[#E0E0E0] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-[#F5C72C]" />
                <span className="text-xs font-medium text-[#888] uppercase tracking-wide">{label}</span>
              </div>
              <div className="text-2xl font-bold text-[#111]">{value}</div>
              <div className="text-xs text-[#999] mt-0.5">{sub}</div>
            </div>
          ))}
          <div className="col-span-2 bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#111] mb-3">Market Opportunity Summary</h3>
            <p className="text-sm text-[#555] leading-relaxed">
              Arlington Heights is an affluent, family-oriented suburb with a strong golf culture. The median household income of $95,400 is 35% above the national average, and the 38.2 median age aligns perfectly with Golf VX's core membership demographic. With ~9,300 local golfers and no competing premium indoor simulator club within 10 miles, Golf VX holds a strong market position. The primary growth opportunities are junior programs (underserved families with children), corporate events (340+ nearby businesses), and spring acquisition (March–April demand spike).
            </p>
          </div>
        </div>
      )}

      {/* Competitors */}
      {activeSection === "competitors" && (
        <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F0F0F0]">
            <h3 className="text-sm font-semibold text-[#111]">Competitive Landscape</h3>
            <p className="text-xs text-[#888] mt-0.5">No direct premium indoor simulator competitors within 10 miles</p>
          </div>
          <div className="divide-y divide-[#F5F5F5]">
            {MARKET_CONTEXT.nearbyCompetitors.map((comp, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#111]">{comp.name}</span>
                    <ThreatBadge level={comp.threat} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#888]">{comp.type}</span>
                    <span className="text-xs text-[#AAAAAA]">·</span>
                    <span className="text-xs text-[#888]">{comp.distance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-[#F5C72C]/5 border-t border-[#F5C72C]/20">
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-[#8B6E00] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#555]">
                <strong className="text-[#111]">Key differentiator:</strong> Golf VX is the only premium year-round indoor golf membership club within 10 miles. Competitors are either outdoor-only, retail-focused, or entertainment-oriented — not membership-based performance golf.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demographics */}
      {activeSection === "demographics" && (
        <div className="space-y-3">
          {MARKET_CONTEXT.demographics.map((seg, i) => (
            <div key={i} className="bg-white border border-[#E0E0E0] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <PriorityDot level={seg.priority} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-[#111]">{seg.segment}</span>
                    <span className="text-xs text-[#888] bg-[#F5F5F5] px-2 py-0.5 rounded">{seg.size}</span>
                  </div>
                  <p className="text-xs text-[#555]">
                    <span className="font-medium text-[#888]">Opportunity: </span>{seg.opportunity}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seasonal Trends */}
      {activeSection === "seasonal" && (
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#111]">Golf Demand Index by Month</h3>
            <p className="text-xs text-[#888] mt-0.5">Relative demand index (100 = peak). Current month highlighted in yellow.</p>
          </div>
          <div className="flex items-end gap-1.5 h-28 mb-4">
            {MARKET_CONTEXT.seasonalTrends.map(({ month, index }) => {
              const currentMonth = new Date().toLocaleString("en-US", { month: "short" });
              const isNow = month === currentMonth;
              return (
                <div key={month} className="flex flex-col items-center gap-1 group">
                  <div
                    className={`w-8 rounded-t transition-all ${isNow ? "bg-[#F5C72C]" : "bg-[#E0E0E0] group-hover:bg-[#F5C72C]/50"}`}
                    style={{ height: `${(index / 100) * 80}px` }}
                  />
                  <span className={`text-xs ${isNow ? "font-bold text-[#111]" : "text-[#999]"}`}>{month}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-[#F0F0F0] pt-4 space-y-2">
            {MARKET_CONTEXT.seasonalTrends
              .filter(t => {
                const now = new Date();
                const currentMonth = now.toLocaleString("en-US", { month: "short" });
                const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const nextMonth = nextDate.toLocaleString("en-US", { month: "short" });
                return t.month === currentMonth || t.month === nextMonth;
              })
              .map(({ month, index, note }) => (
                <div key={month} className="flex items-center gap-3 p-3 bg-[#F5C72C]/5 border border-[#F5C72C]/20 rounded-lg">
                  <span className="text-sm font-bold text-[#111] w-8">{month}</span>
                  <span className="text-xs font-medium text-[#8B6E00]">Index {index}</span>
                  <span className="text-xs text-[#555]">{note}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
