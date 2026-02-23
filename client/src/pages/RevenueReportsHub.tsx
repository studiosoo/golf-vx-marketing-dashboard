import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearch, useLocation } from "wouter";

const TAB_KEYS = ["revenue", "reports"] as const;
type TabKey = typeof TAB_KEYS[number];

export default function RevenueReportsHub() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const tabParam = params.get("tab");
  const initialTab: TabKey = TAB_KEYS.includes(tabParam as TabKey) ? (tabParam as TabKey) : "revenue";
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
    setLocation(`/revenue-reports?tab=${value}`, { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Revenue & Reports</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Financial analytics and marketing reports
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Revenue Dashboard</h2>
              <p className="text-muted-foreground">Coming soon - Revenue analytics and insights</p>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Reports Dashboard</h2>
              <p className="text-muted-foreground">Coming soon - Reports analytics and insights</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
