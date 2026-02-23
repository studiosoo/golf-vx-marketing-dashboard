import { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const InstagramViewer = lazy(() => import("./InstagramViewer"));
const InstagramAnalytics = lazy(() => import("./InstagramAnalytics"));
const InstagramSync = lazy(() => import("./InstagramSync"));

function TabLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function InstagramContent() {
  const [activeTab, setActiveTab] = useState("feed");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Instagram</h2>
        <p className="text-muted-foreground mt-1">
          @golfvxarlingtonheights feed, analytics, and data sync
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4">
          <Suspense fallback={<TabLoader />}>
            <InstagramViewer />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Suspense fallback={<TabLoader />}>
            <InstagramAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="sync" className="mt-4">
          <Suspense fallback={<TabLoader />}>
            <InstagramSync />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
