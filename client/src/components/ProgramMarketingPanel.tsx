/**
 * ProgramMarketingPanel
 * Reusable component showing marketing intelligence for a specific program.
 * Tabs: Meta Ads | Instagram | Newsletter
 * Used in: SundayClinicDetail, WinterClinicDetail, JuniorCampDashboard
 */
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  BarChart3,
  Instagram,
  Mail,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  MousePointer,
  DollarSign,
  Users,
  AlertCircle,
} from "lucide-react";

interface ProgramMarketingPanelProps {
  /** Keywords to match against Meta campaign names (case-insensitive) */
  programKeywords: string[];
  /** Display name for the program */
  programName: string;
}

function MetaAdsTab({ programKeywords, programName }: ProgramMarketingPanelProps) {
  const { data: campaigns, isLoading } = trpc.metaAds.getAllCampaignsWithInsights.useQuery({ datePreset: "last_30d" });
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="bg-muted/30 rounded-xl p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  // Filter campaigns matching this program's keywords
  const programCampaigns = (campaigns || []).filter(c => {
    const name = (c.name || "").toLowerCase();
    return programKeywords.some(kw => name.includes(kw.toLowerCase()));
  });

  if (programCampaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
        <div>
          <p className="font-medium text-muted-foreground">No Meta Ads campaigns found for {programName}</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Campaigns matching: {programKeywords.join(", ")}
          </p>
        </div>
        <button
          onClick={() => setLocation("/campaigns/meta-ads")}
          className="flex items-center gap-2 text-sm text-primary hover:underline mt-2"
        >
          View all Meta Ads <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const totalSpend = programCampaigns.reduce((s, c) => s + parseFloat(c.insights?.spend || "0"), 0);
  const totalImpressions = programCampaigns.reduce((s, c) => s + parseInt(c.insights?.impressions || "0"), 0);
  const totalClicks = programCampaigns.reduce((s, c) => s + parseInt(c.insights?.clicks || "0"), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, label: "Total Spend", value: `$${totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { icon: Eye, label: "Impressions", value: totalImpressions.toLocaleString() },
          { icon: MousePointer, label: "Clicks", value: totalClicks.toLocaleString() },
          { icon: TrendingUp, label: "Avg CTR", value: `${avgCtr.toFixed(2)}%` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
            <div className="text-xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Campaign list */}
      <div className="space-y-3">
        {programCampaigns.map(c => {
          const spend = parseFloat(c.insights?.spend || "0");
          const impressions = parseInt(c.insights?.impressions || "0");
          const clicks = parseInt(c.insights?.clicks || "0");
          const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
          const cpc = parseFloat(c.insights?.cpc || "0");
          const statusColor = c.status === "ACTIVE" ? "text-[#72B84A] bg-green-400/10" : c.status === "PAUSED" ? "text-[#F2DD48] bg-[#F2DD48]/10" : "text-muted-foreground bg-muted/30";

          return (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.objective || "—"}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{c.status}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Spend</div>
                  <div className="font-semibold">${spend.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Impressions</div>
                  <div className="font-semibold">{impressions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">CTR</div>
                  <div className="font-semibold">{ctr.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">CPC</div>
                  <div className="font-semibold">${cpc.toFixed(2)}</div>
                </div>
              </div>
              <button
                onClick={() => setLocation(`/campaigns/meta-ads/campaign/${c.id}`)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-3"
              >
                View full campaign details <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setLocation("/campaigns/meta-ads")}
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        View all Meta Ads campaigns <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function InstagramTab({ programName }: { programName: string }) {
  const [, setLocation] = useLocation();
  const { data: insights, isLoading } = trpc.instagram.getInsights.useQuery({ days: 30 });

  if (isLoading) {
    return <div className="bg-muted/30 rounded-xl p-4 animate-pulse h-32" />;
  }

  const recentInsights = (insights || []).slice(0, 7);

  return (
    <div className="space-y-4">
      {/* Note about Instagram filtering */}
      <div className="flex items-start gap-3 bg-blue-400/10 border border-blue-400/30 rounded-xl p-4 text-sm">
        <Instagram className="h-4 w-4 text-[#6F6F6B] mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-blue-300">Instagram Business Insights</p>
          <p className="text-muted-foreground mt-1">
            Showing account-level Instagram metrics. Posts specifically tagged for {programName} are managed through the{" "}
            <button onClick={() => setLocation("/website/instagram")} className="text-primary underline underline-offset-2 hover:opacity-80">
              Instagram tab
            </button>
            {" "}in the sidebar.
          </p>
        </div>
      </div>

      {recentInsights.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent 7-Day Trend</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Date</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Followers</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Reach</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Impressions</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {recentInsights.map((row: any, i: number) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right font-medium">{(row.followersCount || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{(row.reach || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{(row.impressions || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{(row.engagement || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <Instagram className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-muted-foreground">No Instagram insights synced yet</p>
        </div>
      )}

      <button
        onClick={() => setLocation("/website/instagram")}
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        Open Instagram Analytics <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function NewsletterTab({ programName, programKeywords }: ProgramMarketingPanelProps) {
  const [, setLocation] = useLocation();
  const { data: segments, isLoading } = trpc.encharge.getSegments.useQuery();

  if (isLoading) {
    return <div className="bg-muted/30 rounded-xl p-4 animate-pulse h-32" />;
  }

  // Filter segments related to this program
  const programSegments = (segments || []).filter((s: any) => {
    const name = (s.name || "").toLowerCase();
    return programKeywords.some(kw => name.includes(kw.toLowerCase()));
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-[#a87fbe]/10 border border-[#a87fbe]/30 rounded-xl p-4 text-sm">
        <Mail className="h-4 w-4 text-[#a87fbe] mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-[#a87fbe]">Email / Newsletter via Encharge</p>
          <p className="text-muted-foreground mt-1">
            Newsletter campaigns and drip flows for {programName} are managed through Encharge.
            Segments and broadcasts related to this program appear below.
          </p>
        </div>
      </div>

      {programSegments.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Related Encharge Segments</h3>
          <div className="space-y-2">
            {programSegments.map((seg: any) => (
              <div key={seg.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{seg.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{seg.count || 0} subscribers</div>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <Mail className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-muted-foreground">No Encharge segments found for {programName}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Create a segment in Encharge tagged with: {programKeywords.join(", ")}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setLocation("/communication/drip")}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          View Drip Campaigns <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setLocation("/communication/announcements")}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          View Announcements <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

type MarketingTab = "meta_ads" | "instagram" | "newsletter";

export default function ProgramMarketingPanel({ programKeywords, programName }: ProgramMarketingPanelProps) {
  const [activeTab, setActiveTab] = useState<MarketingTab>("meta_ads");

  const tabs: { id: MarketingTab; label: string; icon: React.ElementType }[] = [
    { id: "meta_ads", label: "Meta Ads", icon: BarChart3 },
    { id: "instagram", label: "Instagram", icon: Instagram },
    { id: "newsletter", label: "Newsletter", icon: Mail },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "meta_ads" && <MetaAdsTab programKeywords={programKeywords} programName={programName} />}
      {activeTab === "instagram" && <InstagramTab programName={programName} />}
      {activeTab === "newsletter" && <NewsletterTab programKeywords={programKeywords} programName={programName} />}
    </div>
  );
}
