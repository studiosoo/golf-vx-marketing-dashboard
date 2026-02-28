import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Key, Settings } from "lucide-react";

export default function AccountSettings() {
  const { data: user } = trpc.auth.me.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences and settings</p>
      </div>
      <Tabs defaultValue="profile">
        <TabsList className="bg-muted">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><User size={16} />Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center">
                  <User size={24} className="text-yellow-400" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{(user as any)?.name || "Owner"}</div>
                  <Badge variant="secondary" className="text-xs mt-1">{(user as any)?.role || "admin"}</Badge>
                </div>
              </div>
              <Separator className="bg-border" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Display Name</Label>
                  <Input defaultValue={(user as any)?.name || ""} className="mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={(user as any)?.email || ""} className="mt-1" disabled />
                </div>
              </div>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500" size="sm">Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Bell size={16} />Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "New member signups", description: "Get notified when a new member joins" },
                { label: "Campaign performance alerts", description: "Weekly campaign performance summary" },
                { label: "Revenue milestones", description: "Alert when revenue targets are hit" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  <div className="w-10 h-5 bg-yellow-400 rounded-full cursor-pointer relative">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-black rounded-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Key size={16} />API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Meta Ads API", "Encharge API", "Acuity API", "ClickFunnels API"].map((api) => (
                <div key={api} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-foreground">{api}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">••••••••••••••••••••••••••••••••</div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Active</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preferences" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Settings size={16} />Dashboard Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Default Date Range</Label>
                <Input defaultValue="Last 30 days" className="mt-1" />
              </div>
              <div>
                <Label>Timezone</Label>
                <Input defaultValue="America/Chicago (CST)" className="mt-1" />
              </div>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500" size="sm">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
