import { useState, useEffect, lazy, Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useSearch, useLocation } from "wouter";

// These pages have their own DashboardLayout wrapper, so we use content-only versions
// MetaAds and EmailMarketing wrap DashboardLayout internally - we'll render their content directly
const MetaAdsContent = lazy(() => import("./MetaAdsContent"));
const EmailMarketingContent = lazy(() => import("./EmailMarketingContent"));
const InstagramContent = lazy(() => import("./InstagramContent"));
const CampaignVisuals = lazy(() => import("./CampaignVisuals"));

const TAB_KEYS = ["meta-ads", "email", "instagram", "visuals"] as const;
type TabKey = typeof TAB_KEYS[number];

function TabLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ChannelsHub() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const tabParam = params.get("tab");
  const initialTab: TabKey = TAB_KEYS.includes(tabParam as TabKey) ? (tabParam as TabKey) : "meta-ads";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    const p = new URLSearchParams(search);
    const t = p.get("tab");
    if (TAB_KEYS.includes(t as TabKey)) {
      setActiveTab(t as TabKey);
    }
  }, [search]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabKey);
    setLocation(`/channels?tab=${value}`, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Channels</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage Meta Ads, email marketing, Instagram, and campaign visuals
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="meta-ads">Meta Ads</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="visuals">Visuals</TabsTrigger>
          </TabsList>

          <TabsContent value="meta-ads" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <MetaAdsContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <EmailMarketingContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="instagram" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <InstagramContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="visuals" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <CampaignVisuals />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
