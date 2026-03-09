/**
 * LocalMarketing — Operations > Local Marketing
 * Tracks offline / local marketing activities:
 *   - Print advertising (local newspapers, flyers, mailers)
 *   - Community events & fundraising
 *   - Local sponsorships
 *   - Out-of-home placements
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Printer,
  Heart,
  Handshake,
  PlusCircle,
  DollarSign,
  CalendarDays,
  FileText,
} from "lucide-react";

type ActivityType = "print" | "event" | "fundraising" | "sponsorship" | "other";

interface LocalActivity {
  id: number;
  type: ActivityType;
  name: string;
  description: string;
  date: string;
  spend: number;
  reach?: number;
  notes?: string;
  status: "planned" | "active" | "completed";
}

const TYPE_META: Record<ActivityType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  print:       { label: "Print Ad",    icon: Printer,     color: "#111111", bg: "#F5F5F5" },
  event:       { label: "Event",       icon: CalendarDays, color: "#007AFF", bg: "#EBF4FF" },
  fundraising: { label: "Fundraising", icon: Heart,       color: "#FF3B30", bg: "#FFF0EF" },
  sponsorship: { label: "Sponsorship", icon: Handshake,   color: "#3DB855", bg: "#F0FAF3" },
  other:       { label: "Other",       icon: MapPin,      color: "#888888", bg: "#F5F5F5" },
};

const STATUS_STYLE: Record<LocalActivity["status"], string> = {
  planned:   "bg-[#F5C72C]/10 text-[#B8900A]",
  active:    "bg-[#3DB855]/10 text-[#2A9040]",
  completed: "bg-[#F5F5F5] text-[#888888]",
};

// Static seed data — replace with tRPC query once a localMarketing router is added
const SEED_ACTIVITIES: LocalActivity[] = [
  {
    id: 1,
    type: "print",
    name: "Arlington Heights Post — Full Page Ad",
    description: "Full-page ad in local weekly newspaper announcing Winter Clinics",
    date: "2026-01-10",
    spend: 650,
    reach: 12000,
    status: "completed",
  },
  {
    id: 2,
    type: "fundraising",
    name: "AHHS Golf Team Fundraiser Round",
    description: "Charity round at Golf VX supporting the AHHS Golf Team booster club",
    date: "2026-02-14",
    spend: 0,
    notes: "In-kind donation of bay time ($320 value)",
    status: "completed",
  },
  {
    id: 3,
    type: "sponsorship",
    name: "Buffalo Grove Park District Spring League",
    description: "Title sponsor of the BG Parks adult spring golf league",
    date: "2026-04-01",
    spend: 500,
    reach: 80,
    status: "planned",
  },
  {
    id: 4,
    type: "event",
    name: "Chamber of Commerce Business After Hours",
    description: "Hosted 'Business After Hours' mixer at Golf VX — 40+ local business owners",
    date: "2026-02-27",
    spend: 200,
    reach: 45,
    status: "completed",
  },
  {
    id: 5,
    type: "print",
    name: "Spring Flyer Distribution — Local Coffee Shops",
    description: "Tri-fold flyers at 12 local coffee shops and gyms for Junior Camp enrollment",
    date: "2026-03-01",
    spend: 180,
    notes: "500 flyers printed, distributed across AH / Buffalo Grove / Palatine",
    status: "active",
  },
];

function fmtCurrency(n: number) {
  if (n === 0) return "In-kind";
  return "$" + n.toLocaleString("en-US");
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function LocalMarketing() {
  const [filter, setFilter] = useState<ActivityType | "all">("all");

  const activities = SEED_ACTIVITIES.filter(a => filter === "all" || a.type === filter);
  const totalSpend = SEED_ACTIVITIES.reduce((s, a) => s + a.spend, 0);
  const completedCount = SEED_ACTIVITIES.filter(a => a.status === "completed").length;
  const plannedCount = SEED_ACTIVITIES.filter(a => a.status === "planned").length;

  const FILTER_TABS: Array<{ key: ActivityType | "all"; label: string }> = [
    { key: "all", label: "All" },
    { key: "print", label: "Print" },
    { key: "event", label: "Events" },
    { key: "fundraising", label: "Fundraising" },
    { key: "sponsorship", label: "Sponsorships" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Local Marketing</h1>
          <p className="text-sm text-[#888888] mt-0.5">Print ads, community events, fundraising & sponsorships</p>
        </div>
        <button className="flex items-center gap-1.5 text-sm font-medium text-[#111111] border border-[#E0E0E0] rounded-lg px-3 py-2 hover:bg-[#F5F5F5] transition-colors">
          <PlusCircle className="h-4 w-4" />
          Add Activity
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Spend (YTD)", value: fmtCurrency(totalSpend), icon: DollarSign, color: "#F5C72C" },
          { label: "Completed", value: String(completedCount), icon: FileText, color: "#3DB855" },
          { label: "Planned", value: String(plannedCount), icon: CalendarDays, color: "#007AFF" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-white border-[#E0E0E0] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-[#AAAAAA]">{label}</p>
                <p className="text-lg font-bold text-[#111111] leading-tight">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? "bg-[#111111] text-white"
                : "bg-[#F5F5F5] text-[#888888] hover:bg-[#E8E8E8]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Activity list */}
      <div className="space-y-3">
        {activities.map((a) => {
          const meta = TYPE_META[a.type];
          const Icon = meta.icon;
          return (
            <Card key={a.id} className="bg-white border-[#E0E0E0] hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: meta.bg }}
                    >
                      <Icon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-[#111111] text-sm">{a.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ color: meta.color, borderColor: `${meta.color}30` }}>
                          {meta.label}
                        </Badge>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[a.status]}`}>
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-[#888888] mb-2">{a.description}</p>
                      {a.notes && (
                        <p className="text-xs text-[#AAAAAA] italic">{a.notes}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-[#AAAAAA]">
                        <span>{fmtDate(a.date)}</span>
                        <span>Spend: <span className="font-medium text-[#111111]">{fmtCurrency(a.spend)}</span></span>
                        {a.reach && <span>Reach: ~{a.reach.toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {activities.length === 0 && (
          <div className="text-center py-12 text-[#AAAAAA] text-sm">No activities in this category yet</div>
        )}
      </div>

      {/* Note */}
      <p className="text-xs text-[#AAAAAA] text-center">
        Local marketing activities are currently tracked manually. Database-backed CRUD coming soon.
      </p>
    </div>
  );
}
