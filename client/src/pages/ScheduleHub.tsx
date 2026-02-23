import { useState, useEffect, lazy, Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useSearch, useLocation } from "wouter";

const CalendarViewer = lazy(() => import("./CalendarViewer"));
const CampaignTimeline = lazy(() => import("./CampaignTimeline"));

const TAB_KEYS = ["calendar", "timeline"] as const;
type TabKey = typeof TAB_KEYS[number];

function TabLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ScheduleHub() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const tabParam = params.get("tab");
  const initialTab: TabKey = TAB_KEYS.includes(tabParam as TabKey) ? (tabParam as TabKey) : "calendar";
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
    setLocation(`/schedule?tab=${value}`, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Schedule</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Calendar view and campaign timeline
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <CalendarViewer />
            </Suspense>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              <CampaignTimeline />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
