import { useState, useEffect, lazy, Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useSearch, useLocation } from "wouter";

// Lazy load tab content pages
const StrategicCampaigns = lazy(() => import("./StrategicCampaigns"));
const Programs = lazy(() => import("./Programs"));
const AnnualGiveaway = lazy(() => import("./AnnualGiveaway"));
const ROI = lazy(() => import("./ROI"));
const BudgetManager = lazy(() => import("./BudgetManager"));

const TAB_KEYS = ["strategic", "programs", "giveaway", "roi", "budget"] as const;
type TabKey = typeof TAB_KEYS[number];

function TabLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function CampaignsHub() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const tabParam = params.get("tab");
  const initialTab: TabKey = TAB_KEYS.includes(tabParam as TabKey) ? (tabParam as TabKey) : "strategic";
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
    setLocation(`/campaigns?tab=${value}`, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage strategic campaigns, programs, giveaways, ROI analysis, and budgets
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="strategic">Strategic</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="giveaway">Giveaway</TabsTrigger>
            <TabsTrigger value="roi">ROI</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="strategic" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <StrategicCampaigns />
            </Suspense>
          </TabsContent>

          <TabsContent value="programs" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <Programs />
            </Suspense>
          </TabsContent>

          <TabsContent value="giveaway" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <AnnualGiveaway />
            </Suspense>
          </TabsContent>

          <TabsContent value="roi" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <ROI />
            </Suspense>
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <BudgetManager />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
