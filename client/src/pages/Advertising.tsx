import { useState } from "react";
import { BarChart3, Instagram, HandHeart, Newspaper, Ticket } from "lucide-react";
import MetaAds from "./MetaAds";
import { MetaAdsStatusBadge } from "@/components/MetaAdsStatusBadge";
import { InfluencerTab } from "@/components/advertising/InfluencerTab";
import { OutreachTab } from "@/components/advertising/OutreachTab";
import { PrintTab } from "@/components/advertising/PrintTab";
import { EventsTab } from "@/components/advertising/EventsTab";

type TabId = "meta" | "influencer" | "outreach" | "print" | "events";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "meta", label: "Meta Ads", icon: <BarChart3 size={15} /> },
  { id: "influencer", label: "Influencer Collabs", icon: <Instagram size={15} /> },
  { id: "outreach", label: "Community Giving", icon: <HandHeart size={15} /> },
  { id: "print", label: "Print & Events", icon: <Newspaper size={15} /> },
  { id: "events", label: "Trade Shows", icon: <Ticket size={15} /> },
];

export default function Advertising() {
  const [tab, setTab] = useState<TabId>("meta");

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Advertising</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-muted-foreground text-sm">
            Meta Ads, influencer collabs, community giving, print, and trade shows
          </p>
          <MetaAdsStatusBadge />
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 bg-muted/30 rounded-lg p-1 w-full sm:w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "meta" && <MetaAds embedded />}
      {tab === "influencer" && <InfluencerTab />}
      {tab === "outreach" && <OutreachTab />}
      {tab === "print" && <PrintTab />}
      {tab === "events" && <EventsTab />}
    </div>
  );
}
