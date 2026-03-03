import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, MapPin, Users, BarChart3, Loader2,
  RefreshCw, ChevronDown, ChevronUp,
  Target, DollarSign, Star, Beer, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";

const YELLOW = "#F5C72C";

const MARKET_CONTEXT = {
  location: "Arlington Heights, IL",
  population: "77,676",
  medianHouseholdIncome: "$95,400",
  medianAge: "38.2",
  golfParticipationRate: "~12% of adults",
  nearbyCompetitors: [
    {
      name: "WJ Golf (Buffalo Grove)",
      distance: "8 mi",
      type: "Indoor Simulator + Sports Bar",
      threat: "high",
      details: "Korean-owned chain with 6 locations. Buffalo Grove location at Arboretum Golf Club. Peak pricing $55–60/hr. Membership: Eagle Plan $75/mo (4hr sim time). Full restaurant (VIN 90) + bar. PGA instructor Todd Sones on staff. Private Club $2,000/yr. 175+ courses. Key threat: same demographic, same Sports Bar + golf model.",
      website: "wj.golf",
    },
    {
      name: "Golf Galaxy (Schaumburg)",
      distance: "6 mi",
      type: "Retail + Simulator",
      threat: "medium",
      details: "Retail-focused with simulators for club fitting, not membership. No community or coaching programs. Threat is primarily for equipment sales, not memberships.",
      website: "golfgalaxy.com",
    },
    {
      name: "Five Iron Golf (Chicago)",
      distance: "22 mi",
      type: "Indoor Golf Club",
      threat: "low",
      details: "Premium urban indoor golf brand. Strong brand recognition but 22 miles away in downtown Chicago. Different demographic (young urban professionals). Membership ~$150–200/mo.",
      website: "fiveirongolf.com",
    },
    {
      name: "Topgolf (Naperville)",
      distance: "28 mi",
      type: "Entertainment Golf",
      threat: "low",
      details: "Entertainment-first, not performance golf. High per-visit spend ($50–100+) but no membership model. Appeals to casual golfers and corporate events. 28 miles away.",
      website: "topgolf.com",
    },
    {
      name: "Arlington Lakes Golf Course",
      distance: "2 mi",
      type: "Public Course",
      threat: "low",
      details: "Outdoor public course. Weather-dependent. Complementary rather than competitive — many Golf VX members also play outdoor. No simulator or year-round offering.",
      website: "arlingtonlakesgolf.com",
    },
    {
      name: "Rolling Green CC",
      distance: "4 mi",
      type: "Private Club",
      threat: "medium",
      details: "Private country club with full outdoor course. High initiation fee ($10,000+). Different price point and demographic. Some overlap with affluent golfers who might choose Golf VX for year-round access.",
      website: "rollinggreengolf.com",
    },
  ],
  seasonalTrends: {
    general: [
      { month: "Jan", outdoor: 15, indoor: 85, sportsBar: 70, note: "Peak indoor — simulator demand highest, sports bar busy with NFL playoffs" },
      { month: "Feb", outdoor: 20, indoor: 80, sportsBar: 65, note: "Winter clinics, indoor leagues, Valentine's Day events" },
      { month: "Mar", outdoor: 45, indoor: 75, sportsBar: 60, note: "Spring prep — lesson demand rises, Masters anticipation" },
      { month: "Apr", outdoor: 70, indoor: 65, sportsBar: 55, note: "Season opener — high acquisition, Masters month" },
      { month: "May", outdoor: 85, indoor: 55, sportsBar: 50, note: "Peak outdoor begins — junior camp signups" },
      { month: "Jun", outdoor: 95, indoor: 50, sportsBar: 55, note: "Peak outdoor — junior camps, leagues, US Open" },
      { month: "Jul", outdoor: 100, indoor: 45, sportsBar: 60, note: "Peak outdoor — heat drives some indoors, bar busy" },
      { month: "Aug", outdoor: 95, indoor: 50, sportsBar: 55, note: "Late summer — back-to-school, fall prep begins" },
      { month: "Sep", outdoor: 85, indoor: 60, sportsBar: 60, note: "Fall season — strong retention, Ryder Cup" },
      { month: "Oct", outdoor: 65, indoor: 70, sportsBar: 65, note: "Shoulder — indoor transition, World Series" },
      { month: "Nov", outdoor: 30, indoor: 80, sportsBar: 70, note: "Indoor peak begins — holiday memberships, NFL season" },
      { month: "Dec", outdoor: 10, indoor: 75, sportsBar: 75, note: "Holiday gift cards, corporate parties, NFL playoffs" },
    ],
  },
  demographics: [
    { segment: "Families with children 6–17", size: "~8,200 households", opportunity: "Junior programs, family memberships", priority: "high" },
    { segment: "Adults 35–55 (mid-career)", size: "~18,400 adults", opportunity: "All-Access Aces, corporate events", priority: "high" },
    { segment: "Retirees 60+", size: "~12,100 adults", opportunity: "Weekday clinics, social leagues", priority: "medium" },
    { segment: "Young professionals 25–34", size: "~9,800 adults", opportunity: "Swing Savers, social golf", priority: "medium" },
    { segment: "Corporate accounts", size: "~340 businesses within 5 mi", opportunity: "B2B events, team outings", priority: "high" },
    { segment: "Sports Bar patrons (non-golfers)", size: "~25,000 adults 21–55", opportunity: "F&B revenue, golf-curious conversion", priority: "medium" },
  ],
  keyInsights: [
    {
      title: "WJ Golf is the Primary Threat — and Blueprint",
      body: "WJ Golf's Buffalo Grove location (8 miles away) operates the exact same model Golf VX AH is pursuing: indoor simulator + sports bar. Their Post Time Sportsbar partnership proves the model works. Key differentiator: Golf VX has franchise brand backing, dedicated coaching programs, and a stronger community focus. WJ Golf's peak pricing ($55–60/hr) is higher than Golf VX's membership value, creating a clear price-value advantage.",
      urgency: "high",
      action: "Monitor WJ Golf promotions monthly. Emphasize Golf VX's coaching programs and community in marketing. Consider a direct comparison campaign: 'Membership vs. Pay-per-hour.'",
    },
    {
      title: "Sports Bar Opportunity: $8,387 Acuity + Untapped F&B",
      body: "Golf VX AH's F&B revenue from Toast POS shows consistent daily sales ($2,200–$9,100/day). The Sports Bar positioning can double F&B revenue by attracting non-golfer patrons during NFL/NBA/MLB seasons. WJ Golf's partnership with Post Time Sportsbar is a proven model. Arlington Heights has no dedicated golf sports bar within 5 miles.",
      urgency: "high",
      action: "Create a 'Golf VX Sports Bar' marketing campaign for fall/winter. Add sports viewing events (NFL Sunday, Masters watch party). Partner with local sports leagues for post-game gatherings.",
    },
    {
      title: "Indoor Golf Market Growing 15% YoY — Seasonal Advantage",
      body: "The US indoor golf simulator market is projected to grow from $1.2B (2024) to $2.8B (2030) at 15.4% CAGR. Chicago suburbs are a top-5 market for indoor golf adoption. Jan–Mar is peak indoor demand (85 index vs 15 for outdoor) — Golf VX's Annual Membership Giveaway is perfectly timed for this acquisition window.",
      urgency: "high",
      action: "Increase ad spend 40–60% in Jan–Mar. Emphasize 'year-round golf' and 'no weather dependency' in all creative. Target golfers frustrated by Chicago winters.",
    },
    {
      title: "Junior Golf Demand Underserved",
      body: "Arlington Heights has ~8,200 families with school-age children. The nearest dedicated junior golf program is 8+ miles away. Junior Summer Camp at $550/child targets this gap — current enrollment signals a marketing reach problem, not a demand problem.",
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
      title: "Spring Acquisition Window: March–April Peak",
      body: "March–April is the highest-intent period for new golf memberships nationally. Search volume for 'golf lessons near me' spikes 3x in March. The Annual Membership Giveaway is running exactly during this window — maximize ad spend to capture this demand.",
      urgency: "high",
      action: "Increase Meta Ads budget 40–60% for March–April. Focus on Trial Conversion campaign. Leverage giveaway urgency in ad copy.",
    },
  ],
  marketComparison: {
    generalGolf: {
      marketSize: "$84B (US, 2024)",
      growth: "+2.1% YoY",
      seasonality: "Apr–Oct peak (outdoor)",
      avgSpend: "$1,200/yr per golfer",
      barriers: "Weather, tee time availability, course fees",
      arlingtonHeights: "~9,300 local golfers, 2 public courses, 1 private club",
    },
    indoorGolf: {
      marketSize: "$1.2B (US, 2024)",
      growth: "+15.4% YoY (CAGR to 2030)",
      seasonality: "Nov–Mar peak (indoor), year-round stable",
      avgSpend: "$2,400/yr per member",
      barriers: "Awareness, price perception",
      arlingtonHeights: "No premium indoor club within 10 miles — Golf VX owns this position",
    },
    sportsBar: {
      marketSize: "$26B (US, 2024)",
      growth: "+4.2% YoY",
      seasonality: "Sep–Jan peak (NFL), year-round with events",
      avgSpend: "$45/visit",
      barriers: "Competition from traditional sports bars",
      arlingtonHeights: "No golf-themed sports bar within 5 miles — clear opportunity",
    },
  },
};

type ResearchSection = "insights" | "overview" | "competitors" | "demographics" | "seasonal" | "market-compare";

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
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);

  const aiResearchMutation = trpc.workspace.chat.useMutation({
    onSuccess: () => toast.success("AI research complete — check AI Workspace for results"),
    onError: (e) => toast.error("Research failed: " + e.message),
  });

  const sections: { id: ResearchSection; label: string; icon: React.ElementType }[] = [
    { id: "insights", label: "Key Insights", icon: Star },
    { id: "overview", label: "Market Overview", icon: MapPin },
    { id: "market-compare", label: "Market Comparison", icon: BarChart3 },
    { id: "competitors", label: "Competitors", icon: Target },
    { id: "demographics", label: "Demographics", icon: Users },
    { id: "seasonal", label: "Seasonal Trends", icon: TrendingUp },
  ];

  const currentMonth = new Date().toLocaleString("en-US", { month: "short" });

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
            messages: [{ role: "user", content: "Generate a brief market research update for Golf VX Arlington Heights. Focus on: 1) indoor golf vs outdoor golf trends in suburban Chicago, 2) Sports Bar market opportunity, 3) WJ Golf competitive analysis, 4) seasonal recommendations for March 2026." }],
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
            { label: "Median HH Income", value: MARKET_CONTEXT.medianHouseholdIncome, icon: DollarSign, sub: "35% above national avg" },
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
              Arlington Heights is an affluent, family-oriented suburb with a strong golf culture. The median household income of $95,400 is 35% above the national average, and the 38.2 median age aligns perfectly with Golf VX's core membership demographic. With ~9,300 local golfers and no competing premium indoor simulator club within 10 miles, Golf VX holds a strong market position. Beyond golf, the Sports Bar opportunity is significant — no golf-themed sports bar exists within 5 miles, and WJ Golf's model proves the concept works. The primary growth opportunities are: (1) Sports Bar F&B expansion, (2) junior programs, (3) corporate events, and (4) spring acquisition window (March–April).
            </p>
          </div>
        </div>
      )}

      {/* Market Comparison: General Golf vs Indoor Golf vs Sports Bar */}
      {activeSection === "market-compare" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "General Golf Market", icon: Globe, color: "#4CAF50", data: MARKET_CONTEXT.marketComparison.generalGolf },
              { title: "Indoor Golf Market", icon: Target, color: YELLOW, data: MARKET_CONTEXT.marketComparison.indoorGolf },
              { title: "Sports Bar Market", icon: Beer, color: "#E57373", data: MARKET_CONTEXT.marketComparison.sportsBar },
            ].map(({ title, icon: Icon, color, data }) => (
              <div key={title} className="bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#111]">{title}</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Market Size", value: data.marketSize },
                    { label: "Growth Rate", value: data.growth },
                    { label: "Peak Season", value: data.seasonality },
                    { label: "Avg Annual Spend", value: data.avgSpend },
                    { label: "Key Barriers", value: data.barriers },
                    { label: "Arlington Heights", value: data.arlingtonHeights },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-[#888]">{label}</span>
                      <span className="text-xs text-[#444]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#111] mb-1">Golf VX AH Positioning</h3>
            <p className="text-xs text-[#888] mb-4">Golf VX sits at the intersection of all three markets — a unique competitive advantage</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-[#4CAF50]/5 border border-[#4CAF50]/20 rounded-lg">
                <div className="text-xs font-semibold text-[#2E7D32] mb-1">General Golf</div>
                <div className="text-xs text-[#555]">Captures outdoor golfers seeking year-round practice. Complements, not competes with outdoor courses.</div>
              </div>
              <div className="p-3 bg-[#F5C72C]/5 border border-[#F5C72C]/20 rounded-lg">
                <div className="text-xs font-semibold text-[#8B6E00] mb-1">Indoor Golf</div>
                <div className="text-xs text-[#555]">Only premium indoor simulator membership club within 10 miles. 15% YoY market growth tailwind.</div>
              </div>
              <div className="p-3 bg-[#E57373]/5 border border-[#E57373]/20 rounded-lg">
                <div className="text-xs font-semibold text-[#C62828] mb-1">Sports Bar</div>
                <div className="text-xs text-[#555]">No golf sports bar within 5 miles. F&B revenue already $2,200–$9,100/day. High growth potential.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competitors */}
      {activeSection === "competitors" && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Star className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Key differentiator:</strong> Golf VX is the only premium year-round indoor golf membership club within 10 miles. WJ Golf (Buffalo Grove, 8 mi) is the primary competitive threat — same model, but Golf VX has franchise backing, coaching programs, and a stronger community focus.
            </p>
          </div>
          <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F0F0F0]">
              <h3 className="text-sm font-semibold text-[#111]">Competitive Landscape</h3>
              <p className="text-xs text-[#888] mt-0.5">Click any competitor to see details</p>
            </div>
            <div className="divide-y divide-[#F5F5F5]">
              {MARKET_CONTEXT.nearbyCompetitors.map((comp, i) => (
                <div key={i}>
                  <button
                    className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors"
                    onClick={() => setExpandedCompetitor(expandedCompetitor === i ? null : i)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#111]">{comp.name}</span>
                        <ThreatBadge level={comp.threat} />
                        {comp.name.includes("WJ Golf") && (
                          <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-medium">⚠ Primary Threat</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-[#888]">{comp.type}</span>
                        <span className="text-xs text-[#AAAAAA]">·</span>
                        <span className="text-xs text-[#888]">{comp.distance}</span>
                        {comp.website && <a href={`https://${comp.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline" onClick={e => e.stopPropagation()}>{comp.website}</a>}
                      </div>
                    </div>
                    {expandedCompetitor === i ? <ChevronUp className="w-4 h-4 text-[#999] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#999] flex-shrink-0" />}
                  </button>
                  {expandedCompetitor === i && (
                    <div className="px-4 pb-4 pt-0 border-t border-[#F5F5F5] bg-[#FAFAFA]">
                      <p className="text-xs text-[#555] leading-relaxed pt-3">{comp.details}</p>
                    </div>
                  )}
                </div>
              ))}
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
        <div className="space-y-4">
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#111]">Demand Index by Month — Golf VX AH (3 Revenue Streams)</h3>
              <p className="text-xs text-[#888] mt-0.5">Relative demand index (100 = peak). Indoor golf peaks in winter; Sports Bar peaks in fall/winter with NFL season.</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MARKET_CONTEXT.seasonalTrends.general} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} domain={[0, 110]} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any, name: string) => [`${value}`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="outdoor" name="Outdoor Golf" fill="#4CAF50" opacity={0.7} radius={[2, 2, 0, 0]} />
                <Bar dataKey="indoor" name="Indoor Golf" fill={YELLOW} opacity={0.9} radius={[2, 2, 0, 0]}>
                  {MARKET_CONTEXT.seasonalTrends.general.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.month === currentMonth ? "#E6B800" : YELLOW} opacity={entry.month === currentMonth ? 1 : 0.75} />
                  ))}
                </Bar>
                <Bar dataKey="sportsBar" name="Sports Bar" fill="#E57373" opacity={0.7} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#111] mb-3">Current & Upcoming Month Highlights</h3>
            <div className="space-y-2">
              {MARKET_CONTEXT.seasonalTrends.general
                .filter(t => {
                  const now = new Date();
                  const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                  const nextMonth = nextDate.toLocaleString("en-US", { month: "short" });
                  return t.month === currentMonth || t.month === nextMonth;
                })
                .map(({ month, indoor, outdoor, sportsBar, note }) => (
                  <div key={month} className="flex items-start gap-3 p-3 bg-[#F5C72C]/5 border border-[#F5C72C]/20 rounded-lg">
                    <span className="text-sm font-bold text-[#111] w-8 flex-shrink-0">{month}</span>
                    <div className="flex-1">
                      <div className="flex gap-3 mb-1 flex-wrap">
                        <span className="text-xs text-[#4CAF50] font-medium">Outdoor: {outdoor}</span>
                        <span className="text-xs text-[#8B6E00] font-medium">Indoor: {indoor}</span>
                        <span className="text-xs text-[#C62828] font-medium">Sports Bar: {sportsBar}</span>
                      </div>
                      <span className="text-xs text-[#555]">{note}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#111] mb-3">Seasonal Strategy Recommendations</h3>
            <div className="space-y-2">
              {[
                { period: "Jan–Mar (Now)", strategy: "Peak indoor acquisition window. Maximize Annual Membership Giveaway reach. Sports Bar: Super Bowl, March Madness events. Target golfers frustrated by Chicago winters.", color: YELLOW },
                { period: "Apr–Jun", strategy: "Spring outdoor transition. Emphasize year-round access. Launch Junior Summer Camp marketing. Corporate event season begins.", color: "#4CAF50" },
                { period: "Jul–Sep", strategy: "Peak outdoor season. Retain members with leagues and clinics. Sports Bar: MLB season, golf majors watch parties.", color: "#66BB6A" },
                { period: "Oct–Dec", strategy: "Indoor transition. Holiday gift card campaigns. NFL season Sports Bar push. Year-end membership renewals.", color: "#E57373" },
              ].map(({ period, strategy, color }) => (
                <div key={period} className="flex items-start gap-3 p-3 rounded-lg border border-[#E8E8E8]">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                  <div>
                    <span className="text-xs font-semibold text-[#111]">{period}: </span>
                    <span className="text-xs text-[#555]">{strategy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
