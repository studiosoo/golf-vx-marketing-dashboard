import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, MapPin, Users, BarChart3, Loader2,
  RefreshCw, ChevronDown, ChevronUp,
  Target, DollarSign, Star, Beer, Globe,
  Plus, Pencil, Trash2, X, Check, AlertTriangle,
  Megaphone, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend, ReferenceLine, CartesianGrid,
} from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────

const YELLOW = "#F2DD48";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Promotions Data ─────────────────────────────────────────────────────────

type PromoChannel = "Meta Ads" | "Email" | "SMS" | "Organic" | "Event" | "Referral";
type PromoStatus = "completed" | "active" | "planned";

interface Promotion {
  id: string;
  name: string;
  month: string;
  channel: PromoChannel;
  budget: number;        // USD spend
  reach: number;         // estimated reach / impressions
  conversions: number;   // leads or sign-ups generated
  status: PromoStatus;
  notes: string;
}

const DEFAULT_PROMOTIONS: Promotion[] = [
  { id: "p1",  name: "Annual Membership Giveaway Launch",  month: "Jan", channel: "Meta Ads",  budget: 462,  reach: 28000, conversions: 67,  status: "completed", notes: "Giveaway funnel — 67 applicants, 4 bottom-funnel conversions" },
  { id: "p2",  name: "Super Bowl Watch Party",             month: "Feb", channel: "Event",     budget: 150,  reach: 200,   conversions: 18,  status: "completed", notes: "In-venue event, strong F&B revenue day" },
  { id: "p3",  name: "$9 Trial Session Campaign",          month: "Feb", channel: "Meta Ads",  budget: 441,  reach: 22000, conversions: 31,  status: "completed", notes: "Trial Conversion campaign — 1922% ROI" },
  { id: "p4",  name: "Spring Membership Push",             month: "Mar", channel: "Meta Ads",  budget: 600,  reach: 30000, conversions: 0,   status: "planned",   notes: "Planned — targeting spring acquisition window" },
  { id: "p5",  name: "Masters Watch Party",                month: "Apr", channel: "Event",     budget: 200,  reach: 300,   conversions: 25,  status: "planned",   notes: "Masters month — high golf intent" },
  { id: "p6",  name: "Junior Summer Camp Early Bird",      month: "Apr", channel: "Meta Ads",  budget: 350,  reach: 15000, conversions: 12,  status: "planned",   notes: "Parent targeting, 5-mile radius" },
  { id: "p7",  name: "Junior Summer Camp Reminder",        month: "May", channel: "Email",     budget: 50,   reach: 1200,  conversions: 8,   status: "planned",   notes: "Email to existing member parents" },
  { id: "p8",  name: "PBGA Winter Clinic",                 month: "Jan", channel: "Organic",   budget: 0,    reach: 500,   conversions: 22,  status: "completed", notes: "Organic + word of mouth" },
  { id: "p9",  name: "NFL Season Sports Bar Push",         month: "Sep", channel: "Meta Ads",  budget: 300,  reach: 18000, conversions: 0,   status: "planned",   notes: "Planned — Sports Bar positioning campaign" },
  { id: "p10", name: "Holiday Gift Card Campaign",         month: "Dec", channel: "Email",     budget: 100,  reach: 1500,  conversions: 0,   status: "planned",   notes: "Planned — holiday membership gifting" },
];

// ─── Market Context ───────────────────────────────────────────────────────────

const MARKET_CONTEXT = {
  location: "Arlington Heights, IL",
  population: "77,676",
  medianHouseholdIncome: "$95,400",
  medianAge: "38.2",
  golfParticipationRate: "~12% of adults",
  nearbyCompetitors: [
    { name: "WJ Golf (Buffalo Grove)", distance: "8 mi", type: "Indoor Simulator + Sports Bar", threat: "high", details: "Korean-owned chain with 6 locations. Buffalo Grove location at Arboretum Golf Club. Peak pricing $55–60/hr. Membership: Eagle Plan $75/mo (4hr sim time). Full restaurant (VIN 90) + bar. PGA instructor Todd Sones on staff. Private Club $2,000/yr. 175+ courses. Key threat: same demographic, same Sports Bar + golf model.", website: "wj.golf" },
    { name: "Golf Galaxy (Schaumburg)", distance: "6 mi", type: "Retail + Simulator", threat: "medium", details: "Retail-focused with simulators for club fitting, not membership. No community or coaching programs. Threat is primarily for equipment sales, not memberships.", website: "golfgalaxy.com" },
    { name: "Five Iron Golf (Chicago)", distance: "22 mi", type: "Indoor Golf Club", threat: "low", details: "Premium urban indoor golf brand. Strong brand recognition but 22 miles away in downtown Chicago. Different demographic (young urban professionals). Membership ~$150–200/mo.", website: "fiveirongolf.com" },
    { name: "Topgolf (Naperville)", distance: "28 mi", type: "Entertainment Golf", threat: "low", details: "Entertainment-first, not performance golf. High per-visit spend ($50–100+) but no membership model. Appeals to casual golfers and corporate events. 28 miles away.", website: "topgolf.com" },
    { name: "Arlington Lakes Golf Course", distance: "2 mi", type: "Public Course", threat: "low", details: "Outdoor public course. Weather-dependent. Complementary rather than competitive — many Golf VX members also play outdoor. No simulator or year-round offering.", website: "arlingtonlakesgolf.com" },
    { name: "Rolling Green CC", distance: "4 mi", type: "Private Club", threat: "medium", details: "Private country club with full outdoor course. High initiation fee ($10,000+). Different price point and demographic. Some overlap with affluent golfers who might choose Golf VX for year-round access.", website: "rollinggreengolf.com" },
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
    { title: "WJ Golf is the Primary Threat — and Blueprint", body: "WJ Golf's Buffalo Grove location (8 miles away) operates the exact same model Golf VX AH is pursuing: indoor simulator + sports bar. Their Post Time Sportsbar partnership proves the model works. Key differentiator: Golf VX has franchise brand backing, dedicated coaching programs, and a stronger community focus. WJ Golf's peak pricing ($55–60/hr) is higher than Golf VX's membership value, creating a clear price-value advantage.", urgency: "high", action: "Monitor WJ Golf promotions monthly. Emphasize Golf VX's coaching programs and community in marketing. Consider a direct comparison campaign: 'Membership vs. Pay-per-hour.'" },
    { title: "Sports Bar Opportunity: $8,387 Acuity + Untapped F&B", body: "Golf VX AH's F&B revenue from Toast POS shows consistent daily sales ($2,200–$9,100/day). The Sports Bar positioning can double F&B revenue by attracting non-golfer patrons during NFL/NBA/MLB seasons. WJ Golf's partnership with Post Time Sportsbar is a proven model. Arlington Heights has no dedicated golf sports bar within 5 miles.", urgency: "high", action: "Create a 'Golf VX Sports Bar' marketing campaign for fall/winter. Add sports viewing events (NFL Sunday, Masters watch party). Partner with local sports leagues for post-game gatherings." },
    { title: "Indoor Golf Market Growing 15% YoY — Seasonal Advantage", body: "The US indoor golf simulator market is projected to grow from $1.2B (2024) to $2.8B (2030) at 15.4% CAGR. Chicago suburbs are a top-5 market for indoor golf adoption. Jan–Mar is peak indoor demand (85 index vs 15 for outdoor) — Golf VX's Annual Membership Giveaway is perfectly timed for this acquisition window.", urgency: "high", action: "Increase ad spend 40–60% in Jan–Mar. Emphasize 'year-round golf' and 'no weather dependency' in all creative. Target golfers frustrated by Chicago winters." },
    { title: "Junior Golf Demand Underserved", body: "Arlington Heights has ~8,200 families with school-age children. The nearest dedicated junior golf program is 8+ miles away. Junior Summer Camp at $550/child targets this gap — current enrollment signals a marketing reach problem, not a demand problem.", urgency: "high", action: "Launch targeted Facebook/Instagram ads to parents within 5 miles. Offer Early Bird discount through Mar 31." },
    { title: "Corporate Event Market Untapped", body: "340+ businesses within 5 miles, including several Fortune 500 offices in the Schaumburg/Arlington Heights corridor. Average corporate golf outing spend is $3,500–$8,000. Golf VX's simulator bays are ideal for team-building events with no weather dependency.", urgency: "medium", action: "Create a dedicated B2B landing page. Target LinkedIn ads to HR managers and office admins in the area." },
    { title: "Spring Acquisition Window: March–April Peak", body: "March–April is the highest-intent period for new golf memberships nationally. Search volume for 'golf lessons near me' spikes 3x in March. The Annual Membership Giveaway is running exactly during this window — maximize ad spend to capture this demand.", urgency: "high", action: "Increase Meta Ads budget 40–60% for March–April. Focus on Trial Conversion campaign. Leverage giveaway urgency in ad copy." },
  ],
  marketComparison: {
    generalGolf: { marketSize: "$84B (US, 2024)", growth: "+2.1% YoY", seasonality: "Apr–Oct peak (outdoor)", avgSpend: "$1,200/yr per golfer", barriers: "Weather, tee time availability, course fees", arlingtonHeights: "~9,300 local golfers, 2 public courses, 1 private club" },
    indoorGolf: { marketSize: "$1.2B (US, 2024)", growth: "+15.4% YoY (CAGR to 2030)", seasonality: "Nov–Mar peak (indoor), year-round stable", avgSpend: "$2,400/yr per member", barriers: "Awareness, price perception", arlingtonHeights: "No premium indoor club within 10 miles — Golf VX owns this position" },
    sportsBar: { marketSize: "$26B (US, 2024)", growth: "+4.2% YoY", seasonality: "Sep–Jan peak (NFL), year-round with events", avgSpend: "$45/visit", barriers: "Competition from traditional sports bars", arlingtonHeights: "No golf-themed sports bar within 5 miles — clear opportunity" },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ResearchSection = "insights" | "overview" | "competitors" | "demographics" | "seasonal" | "market-compare";
type SeasonalView = "demand" | "promotions";

// ─── Helper Components ────────────────────────────────────────────────────────

function ThreatBadge({ level }: { level: string }) {
  const map: Record<string, string> = { high: "bg-red-50 text-red-700 border border-red-200", medium: "bg-yellow-50 text-yellow-700 border border-yellow-200", low: "bg-green-50 text-[#72B84A] border border-green-200" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[level] || map.low}`}>{level} threat</span>;
}

function PriorityDot({ level }: { level: string }) {
  const map: Record<string, string> = { high: "bg-[#FF3B30]", medium: "bg-yellow-500", low: "bg-[#A8A8A3]" };
  return <span className={`w-2 h-2 rounded-full ${map[level] || map.low} inline-block flex-shrink-0 mt-1.5`} />;
}

const CHANNEL_COLORS: Record<PromoChannel, string> = {
  "Meta Ads": "#1877F2",
  "Email": "#9C27B0",
  "SMS": "#FF9800",
  "Organic": "#4CAF50",
  "Event": "#E91E63",
  "Referral": "#00BCD4",
};

const STATUS_STYLES: Record<PromoStatus, string> = {
  completed: "bg-green-50 text-[#72B84A] border border-green-200",
  active: "bg-[#6F6F6B]/10 text-[#6F6F6B] border border-blue-200",
  planned: "bg-gray-50 text-gray-600 border border-gray-200",
};

// ─── Promotion Form ───────────────────────────────────────────────────────────

interface PromoFormState {
  name: string; month: string; channel: PromoChannel;
  budget: string; reach: string; conversions: string;
  status: PromoStatus; notes: string;
}

const EMPTY_FORM: PromoFormState = {
  name: "", month: "Jan", channel: "Meta Ads",
  budget: "", reach: "", conversions: "",
  status: "planned", notes: "",
};

function PromoForm({ initial, onSave, onCancel }: {
  initial?: PromoFormState;
  onSave: (f: PromoFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PromoFormState>(initial ?? EMPTY_FORM);
  const set = (k: keyof PromoFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="bg-[#F6F6F4] border border-[#DEDEDA] rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-[#6F6F6B] block mb-1">Promotion Name</label>
          <input value={form.name} onChange={set("name")} placeholder="e.g. Spring Membership Push" className="w-full text-sm border border-[#D0D0D0] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#F2DD48]" />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6F6F6B] block mb-1">Month</label>
          <select value={form.month} onChange={set("month")} className="w-full text-sm border border-[#D0D0D0] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#F2DD48]">
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[#6F6F6B] block mb-1">Channel</label>
          <select value={form.channel} onChange={set("channel")} className="w-full text-sm border border-[#D0D0D0] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#F2DD48]">
            {(["Meta Ads","Email","SMS","Organic","Event","Referral"] as PromoChannel[]).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[#6F6F6B] block mb-1">Budget ($)</label>
          <input type="number" value={form.budget} onChange={set("budget")} placeholder="0" className="w-full text-sm border border-[#D0D0D0] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#F2DD48]" />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6F6F6B] block mb-1">Reach / Impressions</label>
          <input type="number" value={form.reach} onChange={set("reach")} placeholder="0" className="w-full text-sm border border-[#D0D0D0] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#F2DD48]" />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6F6F6B] block mb-1">Conversions / Leads</label>
          <input type="number" value={form.conversions} onChange={set("conversions")} placeholder="0" className="w-full text-sm border border-[#D0D0D0] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#F2DD48]" />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6F6F6B] block mb-1">Status</label>
          <select value={form.status} onChange={set("status")} className="w-full text-sm border border-[#D0D0D0] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#F2DD48]">
            <option value="completed">Completed</option>
            <option value="active">Active</option>
            <option value="planned">Planned</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-[#6F6F6B] block mb-1">Notes</label>
          <textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Campaign context, results, learnings…" className="w-full text-sm border border-[#D0D0D0] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#F2DD48] resize-none" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onCancel} className="text-xs h-8">
          <X className="w-3 h-3 mr-1" /> Cancel
        </Button>
        <Button size="sm" onClick={() => { if (!form.name.trim()) { toast.error("Promotion name is required"); return; } onSave(form); }} className="text-xs h-8 bg-[#F2DD48] hover:bg-[#E6B800] text-[#111] border-0">
          <Check className="w-3 h-3 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function PromoTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#DEDEDA] rounded-xl shadow-lg p-3 text-xs max-w-xs">
      <p className="font-semibold text-[#111] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[#6F6F6B]">{p.name}:</span>
          <span className="font-medium text-[#111]">
            {p.name === "Budget ($)" ? `$${p.value.toLocaleString()}` : p.name === "Conversions" ? p.value : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Gap Analysis ─────────────────────────────────────────────────────────────

function GapAnalysis({ promotions }: { promotions: Promotion[] }) {
  const budgetByMonth = useMemo(() => {
    const m: Record<string, number> = {};
    promotions.forEach(p => { m[p.month] = (m[p.month] || 0) + p.budget; });
    return m;
  }, [promotions]);

  const gaps = MARKET_CONTEXT.seasonalTrends.general.map(row => {
    const demandScore = Math.round((row.indoor + row.sportsBar) / 2);
    const spend = budgetByMonth[row.month] || 0;
    const gap = demandScore - Math.min(spend / 10, 100); // normalise spend to 0–100
    return { ...row, demandScore, spend, gap: Math.round(gap) };
  }).sort((a, b) => b.gap - a.gap);

  return (
    <div className="bg-white border border-[#DEDEDA] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-[#111]">Gap Analysis — Demand vs. Promotion Coverage</h3>
      </div>
      <div className="divide-y divide-[#F1F1EF]">
        {gaps.map(({ month, demandScore, spend, gap, note }) => {
          const severity = gap > 50 ? "high" : gap > 20 ? "medium" : "low";
          const barColor = severity === "high" ? "#EF4444" : severity === "medium" ? "#F59E0B" : "#22C55E";
          return (
            <div key={month} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-xs font-bold text-[#111] w-8 flex-shrink-0">{month}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-[#F0F0F0] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(demandScore, 100)}%`, background: "#F2DD48" }} />
                  </div>
                  <span className="text-xs text-[#6F6F6B] w-14 text-right">Demand {demandScore}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#F0F0F0] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(spend / 10, 100)}%`, background: "#1877F2" }} />
                  </div>
                  <span className="text-xs text-[#6F6F6B] w-14 text-right">${spend.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${severity === "high" ? "bg-red-50 text-red-700" : severity === "medium" ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-[#72B84A]"}`}>
                  {severity === "high" ? "⚠ Gap" : severity === "medium" ? "~ Partial" : "✓ Covered"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 bg-[#F6F6F4] border-t border-[#F0F0F0]">
        <p className="text-xs text-[#6F6F6B]">
          <span className="inline-block w-3 h-1.5 rounded bg-[#F2DD48] mr-1 align-middle" /> Demand index (avg indoor + sports bar)
          <span className="inline-block w-3 h-1.5 rounded bg-[#1877F2] ml-3 mr-1 align-middle" /> Promotion spend (normalised)
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MarketResearch() {
  const [activeSection, setActiveSection] = useState<ResearchSection>("insights");
  const [expandedInsight, setExpandedInsight] = useState<number | null>(0);
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);

  // Seasonal sub-view
  const [seasonalView, setSeasonalView] = useState<SeasonalView>("demand");

  // Promotions state (local, editable)
  const [promotions, setPromotions] = useState<Promotion[]>(DEFAULT_PROMOTIONS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

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

  // ── Derived chart data ──────────────────────────────────────────────────────

  const promoChartData = useMemo(() => {
    const budgetByMonth: Record<string, number> = {};
    const convByMonth: Record<string, number> = {};
    const countByMonth: Record<string, number> = {};
    promotions.forEach(p => {
      budgetByMonth[p.month] = (budgetByMonth[p.month] || 0) + p.budget;
      convByMonth[p.month] = (convByMonth[p.month] || 0) + p.conversions;
      countByMonth[p.month] = (countByMonth[p.month] || 0) + 1;
    });
    return MARKET_CONTEXT.seasonalTrends.general.map(row => ({
      ...row,
      budget: budgetByMonth[row.month] || 0,
      conversions: convByMonth[row.month] || 0,
      promoCount: countByMonth[row.month] || 0,
    }));
  }, [promotions]);

  // ── Filtered promotions list ────────────────────────────────────────────────

  const filteredPromos = useMemo(() => promotions.filter(p =>
    (filterChannel === "All" || p.channel === filterChannel) &&
    (filterStatus === "All" || p.status === filterStatus)
  ), [promotions, filterChannel, filterStatus]);

  // ── CRUD helpers ────────────────────────────────────────────────────────────

  function addPromo(form: PromoFormState) {
    const newP: Promotion = {
      id: `p${Date.now()}`,
      name: form.name, month: form.month,
      channel: form.channel as PromoChannel,
      budget: Number(form.budget) || 0,
      reach: Number(form.reach) || 0,
      conversions: Number(form.conversions) || 0,
      status: form.status as PromoStatus,
      notes: form.notes,
    };
    setPromotions(ps => [...ps, newP]);
    setShowAddForm(false);
    toast.success("Promotion added");
  }

  function updatePromo(id: string, form: PromoFormState) {
    setPromotions(ps => ps.map(p => p.id !== id ? p : {
      ...p, name: form.name, month: form.month,
      channel: form.channel as PromoChannel,
      budget: Number(form.budget) || 0,
      reach: Number(form.reach) || 0,
      conversions: Number(form.conversions) || 0,
      status: form.status as PromoStatus,
      notes: form.notes,
    }));
    setEditingId(null);
    toast.success("Promotion updated");
  }

  function deletePromo(id: string) {
    setPromotions(ps => ps.filter(p => p.id !== id));
    toast.success("Promotion removed");
  }

  // ── Summary stats ────────────────────────────────────────────────────────────

  const totalBudget = promotions.reduce((s, p) => s + p.budget, 0);
  const totalConversions = promotions.reduce((s, p) => s + p.conversions, 0);
  const completedCount = promotions.filter(p => p.status === "completed").length;
  const plannedCount = promotions.filter(p => p.status === "planned").length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 bg-[#F6F6F4] min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Market Research</h1>
          <p className="text-sm text-[#6F6F6B] mt-1 flex items-center gap-1.5">
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
          className="flex items-center gap-2 bg-[#F2DD48] hover:bg-[#E6B800] text-[#111] font-semibold text-sm px-4 py-2 rounded-lg border-0"
        >
          {aiResearchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {aiResearchMutation.isPending ? "Researching…" : "AI Update"}
        </Button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-white border border-[#DEDEDA] rounded-xl p-1 w-fit flex-wrap">
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeSection === id ? "bg-[#F2DD48] text-[#111]" : "text-[#6F6F6B] hover:text-[#111] hover:bg-[#F1F1EF]"}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── Key Insights ── */}
      {activeSection === "insights" && (
        <div className="space-y-3">
          {MARKET_CONTEXT.keyInsights.map((insight, i) => (
            <div
              key={i}
              className="rounded overflow-hidden"
              style={{
                background: "rgba(245,199,44,0.12)",
                borderLeft: "2px solid rgba(245,199,44,0.6)",
                borderRadius: "4px",
              }}
            >
              <button className="w-full flex items-start gap-3 px-4 py-3 text-left" onClick={() => setExpandedInsight(expandedInsight === i ? null : i)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#222222]">{insight.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${insight.urgency === "high" ? "bg-red-50 text-red-700 border-red-200" : insight.urgency === "medium" ? "bg-[#F1F1EF] text-[#6F6F6B] border-[#DEDEDA]" : "bg-[#72B84A]/10 text-[#72B84A] border-[#72B84A]/30"}`}>{insight.urgency} priority</span>
                  </div>
                  {expandedInsight !== i && <p className="text-xs text-[#6F6F6B] mt-0.5 line-clamp-1">{insight.body}</p>}
                </div>
                {expandedInsight === i ? <ChevronUp className="w-4 h-4 text-[#999] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#999] flex-shrink-0" />}
              </button>
              {expandedInsight === i && (
                <div className="px-4 pb-3 pt-0 space-y-3 border-t border-[rgba(245,199,44,0.2)]">
                  <p className="text-sm text-[#444] leading-relaxed pt-3">{insight.body}</p>
                  <div className="flex items-start gap-2 p-3 bg-white/60 border border-[#DEDEDA] rounded">
                    <Target className="w-4 h-4 text-[#8B6E00] mt-0.5 flex-shrink-0" />
                    <div><p className="text-xs font-semibold text-[#8B6E00] mb-0.5">Recommended Action</p><p className="text-xs text-[#6F6F6B]">{insight.action}</p></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Market Overview ── */}
      {activeSection === "overview" && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Population", value: MARKET_CONTEXT.population, icon: Users, sub: "Arlington Heights" },
            { label: "Median HH Income", value: MARKET_CONTEXT.medianHouseholdIncome, icon: DollarSign, sub: "35% above national avg" },
            { label: "Median Age", value: MARKET_CONTEXT.medianAge, icon: BarChart3, sub: "Prime golf demographic" },
            { label: "Golf Participation", value: MARKET_CONTEXT.golfParticipationRate, icon: TrendingUp, sub: "~9,300 local golfers" },
          ].map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="bg-white border border-[#DEDEDA] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4 text-[#F2DD48]" /><span className="text-xs font-medium text-[#6F6F6B] uppercase tracking-wide">{label}</span></div>
              <div className="text-2xl font-bold text-[#111]">{value}</div>
              <div className="text-xs text-[#999] mt-0.5">{sub}</div>
            </div>
          ))}
          <div className="col-span-2 bg-white border border-[#DEDEDA] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#111] mb-3">Market Opportunity Summary</h3>
            <p className="text-sm text-[#6F6F6B] leading-relaxed">Arlington Heights is an affluent, family-oriented suburb with a strong golf culture. The median household income of $95,400 is 35% above the national average, and the 38.2 median age aligns perfectly with Golf VX's core membership demographic. With ~9,300 local golfers and no competing premium indoor simulator club within 10 miles, Golf VX holds a strong market position. Beyond golf, the Sports Bar opportunity is significant — no golf-themed sports bar exists within 5 miles, and WJ Golf's model proves the concept works. The primary growth opportunities are: (1) Sports Bar F&B expansion, (2) junior programs, (3) corporate events, and (4) spring acquisition window (March–April).</p>
          </div>
        </div>
      )}

      {/* ── Market Comparison ── */}
      {activeSection === "market-compare" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "General Golf Market", icon: Globe, color: "#4CAF50", data: MARKET_CONTEXT.marketComparison.generalGolf },
              { title: "Indoor Golf Market", icon: Target, color: YELLOW, data: MARKET_CONTEXT.marketComparison.indoorGolf },
              { title: "Sports Bar Market", icon: Beer, color: "#E57373", data: MARKET_CONTEXT.marketComparison.sportsBar },
            ].map(({ title, icon: Icon, color, data }) => (
              <div key={title} className="bg-white border border-[#DEDEDA] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}><Icon className="w-4 h-4" style={{ color }} /></div>
                  <h3 className="text-sm font-semibold text-[#111]">{title}</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Market Size", value: data.marketSize }, { label: "Growth Rate", value: data.growth },
                    { label: "Peak Season", value: data.seasonality }, { label: "Avg Annual Spend", value: data.avgSpend },
                    { label: "Key Barriers", value: data.barriers }, { label: "Arlington Heights", value: data.arlingtonHeights },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-[#6F6F6B]">{label}</span>
                      <span className="text-xs text-[#444]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-[#DEDEDA] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#111] mb-1">Golf VX AH Positioning</h3>
            <p className="text-xs text-[#6F6F6B] mb-4">Golf VX sits at the intersection of all three markets — a unique competitive advantage</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              {[
                { label: "General Golf", color: "#4CAF50", textColor: "#2E7D32", bg: "#4CAF50", body: "Captures outdoor golfers seeking year-round practice. Complements, not competes with outdoor courses." },
                { label: "Indoor Golf", color: YELLOW, textColor: "#8B6E00", bg: YELLOW, body: "Only premium indoor simulator membership club within 10 miles. 15% YoY market growth tailwind." },
                { label: "Sports Bar", color: "#E57373", textColor: "#C62828", bg: "#E57373", body: "No golf sports bar within 5 miles. F&B revenue already $2,200–$9,100/day. High growth potential." },
              ].map(({ label, textColor, bg, body }) => (
                <div key={label} className="p-3 rounded-lg border" style={{ background: `${bg}0D`, borderColor: `${bg}33` }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: textColor }}>{label}</div>
                  <div className="text-xs text-[#6F6F6B]">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Competitors ── */}
      {activeSection === "competitors" && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Star className="w-4 h-4 text-[#F2DD48] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#222222]"><strong>Key differentiator:</strong> Golf VX is the only premium year-round indoor golf membership club within 10 miles. WJ Golf (Buffalo Grove, 8 mi) is the primary competitive threat — same model, but Golf VX has franchise backing, coaching programs, and a stronger community focus.</p>
          </div>
          <div className="bg-white border border-[#DEDEDA] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F0F0F0]"><h3 className="text-sm font-semibold text-[#111]">Competitive Landscape</h3><p className="text-xs text-[#6F6F6B] mt-0.5">Click any competitor to see details</p></div>
            <div className="divide-y divide-[#F1F1EF]">
              {MARKET_CONTEXT.nearbyCompetitors.map((comp, i) => (
                <div key={i}>
                  <button className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-[#F6F6F4] transition-colors" onClick={() => setExpandedCompetitor(expandedCompetitor === i ? null : i)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#111]">{comp.name}</span>
                        <ThreatBadge level={comp.threat} />
                        {comp.name.includes("WJ Golf") && <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-medium">⚠ Primary Threat</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-[#6F6F6B]">{comp.type}</span>
                        <span className="text-xs text-[#A8A8A3]">·</span>
                        <span className="text-xs text-[#6F6F6B]">{comp.distance}</span>
                        {comp.website && <a href={`https://${comp.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline" onClick={e => e.stopPropagation()}>{comp.website}</a>}
                      </div>
                    </div>
                    {expandedCompetitor === i ? <ChevronUp className="w-4 h-4 text-[#999] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#999] flex-shrink-0" />}
                  </button>
                  {expandedCompetitor === i && <div className="px-4 pb-4 pt-0 border-t border-[#F1F1EF] bg-[#F6F6F4]"><p className="text-xs text-[#6F6F6B] leading-relaxed pt-3">{comp.details}</p></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Demographics ── */}
      {activeSection === "demographics" && (
        <div className="space-y-3">
          {MARKET_CONTEXT.demographics.map((seg, i) => (
            <div key={i} className="bg-white border border-[#DEDEDA] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <PriorityDot level={seg.priority} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-[#111]">{seg.segment}</span>
                    <span className="text-xs text-[#6F6F6B] bg-[#F1F1EF] px-2 py-0.5 rounded">{seg.size}</span>
                  </div>
                  <p className="text-xs text-[#6F6F6B]"><span className="font-medium text-[#6F6F6B]">Opportunity: </span>{seg.opportunity}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Seasonal Trends ── */}
      {activeSection === "seasonal" && (
        <div className="space-y-4">

          {/* Sub-view toggle */}
          <div className="flex gap-1 bg-white border border-[#DEDEDA] rounded-xl p-1 w-fit">
            <button onClick={() => setSeasonalView("demand")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${seasonalView === "demand" ? "bg-[#F2DD48] text-[#111]" : "text-[#6F6F6B] hover:text-[#111] hover:bg-[#F1F1EF]"}`}>
              <TrendingUp className="w-3.5 h-3.5" /> Demand Index
            </button>
            <button onClick={() => setSeasonalView("promotions")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${seasonalView === "promotions" ? "bg-[#F2DD48] text-[#111]" : "text-[#6F6F6B] hover:text-[#111] hover:bg-[#F1F1EF]"}`}>
              <Megaphone className="w-3.5 h-3.5" /> Promotions vs. Demand
            </button>
          </div>

          {/* ── Demand Index view ── */}
          {seasonalView === "demand" && (
            <>
              <div className="bg-white border border-[#DEDEDA] rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#111]">Demand Index by Month — Golf VX AH (3 Revenue Streams)</h3>
                  <p className="text-xs text-[#6F6F6B] mt-0.5">Relative demand index (100 = peak). Indoor golf peaks in winter; Sports Bar peaks in fall/winter with NFL season.</p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={MARKET_CONTEXT.seasonalTrends.general} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} domain={[0, 110]} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #DEDEDA", borderRadius: 8, fontSize: 12 }} formatter={(value: any, name: string) => [`${value}`, name]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="outdoor" name="Outdoor Golf" fill="#60A5FA" opacity={0.85} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="indoor" name="Indoor Golf" fill="#4ADE80" opacity={0.85} radius={[2, 2, 0, 0]}>
                      {MARKET_CONTEXT.seasonalTrends.general.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.month === currentMonth ? "#22C55E" : "#4ADE80"} opacity={entry.month === currentMonth ? 1 : 0.85} />
                      ))}
                    </Bar>
                    <Bar dataKey="sportsBar" name="Sports Bar" fill="#A78BFA" opacity={0.85} radius={[2, 2, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-[#DEDEDA] rounded-xl p-5">
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
                      <div key={month} className="flex items-start gap-3 p-3 bg-[#F2DD48]/5 border border-[#F2DD48]/20 rounded-lg">
                        <span className="text-sm font-bold text-[#111] w-8 flex-shrink-0">{month}</span>
                        <div className="flex-1">
                          <div className="flex gap-3 mb-1 flex-wrap">
                            <span className="text-xs text-[#60A5FA] font-medium">Outdoor: {outdoor}</span>
                            <span className="text-xs text-[#4ADE80] font-medium">Indoor: {indoor}</span>
                            <span className="text-xs text-[#A78BFA] font-medium">Sports Bar: {sportsBar}</span>
                          </div>
                          <span className="text-xs text-[#6F6F6B]">{note}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white border border-[#DEDEDA] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#111] mb-3">Seasonal Strategy Recommendations</h3>
                <div className="space-y-2">
                  {[
                    { period: "Jan–Mar (Now)", strategy: "Peak indoor acquisition window. Maximize Annual Membership Giveaway reach. Sports Bar: Super Bowl, March Madness events. Target golfers frustrated by Chicago winters.", color: "#4ADE80" },
                    { period: "Apr–Jun", strategy: "Spring outdoor transition. Emphasize year-round access. Launch Junior Summer Camp marketing. Corporate event season begins.", color: "#60A5FA" },
                    { period: "Jul–Sep", strategy: "Peak outdoor season. Retain members with leagues and clinics. Sports Bar: MLB season, golf majors watch parties.", color: "#60A5FA" },
                    { period: "Oct–Dec", strategy: "Indoor transition. Holiday gift card campaigns. NFL season Sports Bar push. Year-end membership renewals.", color: "#A78BFA" },
                  ].map(({ period, strategy, color }) => (
                    <div key={period} className="flex items-start gap-3 p-3 rounded-lg border border-[#E8E8E8]">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                      <div><span className="text-xs font-semibold text-[#111]">{period}: </span><span className="text-xs text-[#6F6F6B]">{strategy}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Promotions vs. Demand view ── */}
          {seasonalView === "promotions" && (
            <>
              {/* Summary KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Promotions", value: promotions.length, icon: Megaphone, color: "#1877F2" },
                  { label: "Total Budget", value: `$${totalBudget.toLocaleString()}`, icon: DollarSign, color: YELLOW },
                  { label: "Total Conversions", value: totalConversions, icon: Target, color: "#4CAF50" },
                  { label: "Planned", value: plannedCount, icon: Calendar, color: "#9C27B0" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white border border-[#DEDEDA] rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#111]">{value}</div>
                      <div className="text-xs text-[#6F6F6B]">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Combo chart: demand bars + promotion spend line */}
              <div className="bg-white border border-[#DEDEDA] rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#111]">Promotions vs. Market Demand — Monthly Overlay</h3>
                  <p className="text-xs text-[#6F6F6B] mt-0.5">
                    Bars = indoor golf demand index. Line = promotion budget spend. Gaps between high demand and low spend reveal missed acquisition windows.
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={promoChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="4 4" strokeWidth={0.5} stroke="#F0F0F0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="demand" orientation="left" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} domain={[0, 110]} label={{ value: "Demand", angle: -90, position: "insideLeft", offset: 15, style: { fontSize: 10, fill: "#AAA" } }} />
                    <YAxis yAxisId="budget" orientation="right" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} label={{ value: "Budget ($)", angle: 90, position: "insideRight", offset: 15, style: { fontSize: 10, fill: "#AAA" } }} />
                    <Tooltip content={<PromoTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine yAxisId="demand" x={currentMonth} stroke="#F2DD48" strokeWidth={2} strokeDasharray="4 2" label={{ value: "Now", position: "top", fontSize: 10, fill: "#8B6E00" }} />
                    <Bar yAxisId="demand" dataKey="indoor" name="Indoor Demand" fill={YELLOW} opacity={0.55} radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="demand" dataKey="sportsBar" name="Sports Bar Demand" fill="#E57373" opacity={0.45} radius={[3, 3, 0, 0]} />
                    <Line yAxisId="budget" type="monotone" dataKey="budget" name="Budget ($)" stroke="#1877F2" strokeWidth={2.5} dot={{ r: 4, fill: "#1877F2", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="demand" type="monotone" dataKey="conversions" name="Conversions" stroke="#4CAF50" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: "#4CAF50", stroke: "#fff", strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Gap Analysis */}
              <GapAnalysis promotions={promotions} />

              {/* Promotions list with filters + CRUD */}
              <div className="bg-white border border-[#DEDEDA] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#6F6F6B]" />
                    <h3 className="text-sm font-semibold text-[#111]">Promotion History & Plan</h3>
                    <span className="text-xs text-[#6F6F6B] bg-[#F1F1EF] px-2 py-0.5 rounded">{filteredPromos.length} shown</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} className="text-xs border border-[#D0D0D0] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#F2DD48]">
                      <option value="All">All Channels</option>
                      {(["Meta Ads","Email","SMS","Organic","Event","Referral"] as PromoChannel[]).map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs border border-[#D0D0D0] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#F2DD48]">
                      <option value="All">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="active">Active</option>
                      <option value="planned">Planned</option>
                    </select>
                    <Button size="sm" onClick={() => { setShowAddForm(true); setEditingId(null); }} className="text-xs h-8 bg-[#F2DD48] hover:bg-[#E6B800] text-[#111] border-0">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                {showAddForm && (
                  <div className="p-4 border-b border-[#F0F0F0]">
                    <p className="text-xs font-semibold text-[#111] mb-3">New Promotion</p>
                    <PromoForm onSave={addPromo} onCancel={() => setShowAddForm(false)} />
                  </div>
                )}

                <div className="divide-y divide-[#F1F1EF]">
                  {filteredPromos.length === 0 && (
                    <div className="px-4 py-8 text-center text-xs text-[#999]">No promotions match the current filters.</div>
                  )}
                  {filteredPromos.map(promo => (
                    <div key={promo.id}>
                      {editingId === promo.id ? (
                        <div className="p-4">
                          <PromoForm
                            initial={{ name: promo.name, month: promo.month, channel: promo.channel, budget: String(promo.budget), reach: String(promo.reach), conversions: String(promo.conversions), status: promo.status, notes: promo.notes }}
                            onSave={form => updatePromo(promo.id, form)}
                            onCancel={() => setEditingId(null)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 px-4 py-3 hover:bg-[#F6F6F4] transition-colors group">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${CHANNEL_COLORS[promo.channel]}15` }}>
                            <Megaphone className="w-3.5 h-3.5" style={{ color: CHANNEL_COLORS[promo.channel] }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="text-sm font-medium text-[#111]">{promo.name}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_STYLES[promo.status]}`}>{promo.status}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-[#F1F1EF] text-[#6F6F6B]">{promo.month}</span>
                              <span className="text-xs font-medium" style={{ color: CHANNEL_COLORS[promo.channel] }}>{promo.channel}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[#6F6F6B] flex-wrap">
                              {promo.budget > 0 && <span><span className="font-medium text-[#6F6F6B]">${promo.budget.toLocaleString()}</span> budget</span>}
                              {promo.reach > 0 && <span><span className="font-medium text-[#6F6F6B]">{promo.reach.toLocaleString()}</span> reach</span>}
                              {promo.conversions > 0 && <span><span className="font-medium text-[#4CAF50]">{promo.conversions}</span> conversions</span>}
                              {promo.budget > 0 && promo.conversions > 0 && <span className="text-[#6F6F6B]">CPL: <span className="font-medium text-[#6F6F6B]">${Math.round(promo.budget / promo.conversions)}</span></span>}
                            </div>
                            {promo.notes && <p className="text-xs text-[#AAA] mt-0.5 line-clamp-1">{promo.notes}</p>}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => { setEditingId(promo.id); setShowAddForm(false); }} className="p-1.5 rounded-lg hover:bg-[#F0F0F0] text-[#6F6F6B] hover:text-[#111] transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deletePromo(promo.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#6F6F6B] hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
