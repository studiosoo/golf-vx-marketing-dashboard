import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Clock, ExternalLink, Zap } from "lucide-react";

const INTEGRATIONS = [
  {
    name: "Meta Ads",
    description: "Facebook & Instagram advertising platform",
    category: "Advertising",
    status: "active",
    docsUrl: "https://developers.facebook.com/docs/marketing-apis",
    features: ["Campaign sync", "Ad performance metrics", "Audience insights"],
  },
  {
    name: "Encharge",
    description: "Email marketing automation and drip campaigns",
    category: "Email",
    status: "active",
    docsUrl: "https://docs.encharge.io",
    features: ["Subscriber sync", "Tag management", "Sequence triggers"],
  },
  {
    name: "Acuity Scheduling",
    description: "Appointment booking and scheduling management",
    category: "Booking",
    status: "active",
    docsUrl: "https://developers.acuityscheduling.com",
    features: ["Appointment sync", "Sunday Clinic metrics", "Winter Clinic data"],
  },
  {
    name: "Boomerang",
    description: "Digital loyalty card and wallet pass management",
    category: "Loyalty",
    status: "active",
    docsUrl: "https://app.boomerangapp.com",
    features: ["Card issued/installed/deleted events", "Member sync", "Webhook receiver"],
  },
  {
    name: "ClickFunnels",
    description: "Landing pages, funnels, and giveaway management",
    category: "Funnels",
    status: "active",
    docsUrl: "https://developers.clickfunnels.com",
    features: ["Giveaway applications", "Contact sync", "Form submissions"],
  },
  {
    name: "Make.com (HQ)",
    description: "Automation hub connecting Boomerang events to dashboard",
    category: "Automation",
    status: "active",
    docsUrl: "https://www.make.com",
    features: ["Boomerang webhook relay", "x-webhook-secret auth", "Event routing"],
  },
  {
    name: "Asana",
    description: "Project management and marketing timeline tracking",
    category: "Project Mgmt",
    status: "active",
    docsUrl: "https://developers.asana.com",
    features: ["Task sync", "Campaign timeline", "Team coordination"],
  },
  {
    name: "Instagram",
    description: "Instagram content performance and engagement metrics",
    category: "Social",
    status: "active",
    docsUrl: "https://developers.facebook.com/docs/instagram-api",
    features: ["Post metrics", "Engagement tracking", "Audience data"],
  },
  {
    name: "Twilio",
    description: "SMS messaging for member communications",
    category: "SMS",
    status: "pending",
    docsUrl: "https://www.twilio.com/docs",
    features: ["Bulk SMS", "Welcome messages", "Event notifications"],
  },
  {
    name: "Google Analytics 4",
    description: "Website traffic and conversion analytics",
    category: "Analytics",
    status: "active",
    docsUrl: "https://developers.google.com/analytics",
    features: ["Traffic metrics", "Conversion tracking", "Audience segments"],
  },
];

const STATUS_CONFIG = {
  active: { icon: CheckCircle, color: "text-green-400", label: "Active", badgeClass: "border-green-500/40 text-green-400" },
  pending: { icon: Clock, color: "text-amber-400", label: "Pending Setup", badgeClass: "border-amber-500/40 text-amber-400" },
  error: { icon: XCircle, color: "text-red-400", label: "Error", badgeClass: "border-red-500/40 text-red-400" },
};

export default function Integrations() {
  const { data: syncStatus } = trpc.autonomous.getSyncStatus.useQuery();

  const activeCount = INTEGRATIONS.filter(i => i.status === "active").length;
  const pendingCount = INTEGRATIONS.filter(i => i.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Integrations</h1>
            <p className="text-muted-foreground mt-1 text-sm">Connected services and third-party platform status</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Integrations", value: INTEGRATIONS.length, color: "text-foreground" },
            { label: "Active", value: activeCount, color: "text-green-400" },
            { label: "Pending Setup", value: pendingCount, color: "text-amber-400" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {INTEGRATIONS.map((integration) => {
            const cfg = STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;
            const StatusIcon = cfg.icon;
            return (
              <Card key={integration.name} className="hover:border-muted-foreground/30 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-semibold">{integration.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      <Badge variant="outline" className={`text-xs ${cfg.badgeClass}`}>{cfg.label}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-2">{integration.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">{integration.category}</Badge>
                    </div>
                    <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-0.5">
                      Docs <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {integration.features.map((f) => (
                      <span key={f} className="text-xs bg-muted/40 rounded px-1.5 py-0.5 text-muted-foreground">{f}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
