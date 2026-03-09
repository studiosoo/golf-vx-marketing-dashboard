import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Minus } from "lucide-react";

type IntegrationStatus = "connected" | "manual" | "partial";

interface Integration {
  key: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  note: string;
}

const INTEGRATIONS: Integration[] = [
  {
    key: "metaAds",
    name: "Meta Ads",
    description: "Facebook & Instagram advertising",
    status: "connected",
    note: "Campaign data synced daily via cache",
  },
  {
    key: "boomerang",
    name: "Boomerang",
    description: "Membership management",
    status: "connected",
    note: "Member records via webhook",
  },
  {
    key: "acuity",
    name: "Acuity Scheduling",
    description: "Booking & appointment management",
    status: "connected",
    note: "Booking & revenue data active",
  },
  {
    key: "toast",
    name: "Toast POS",
    description: "Point of sale system",
    status: "connected",
    note: "Daily F&B and bay revenue flowing",
  },
  {
    key: "encharge",
    name: "Encharge",
    description: "Email marketing automation",
    status: "partial",
    note: "Write key active · subscriber sync partial",
  },
  {
    key: "clickfunnels",
    name: "ClickFunnels",
    description: "Sales funnel management",
    status: "manual",
    note: "Funnel metrics tracked via URL params",
  },
];

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === "connected")
    return <Badge className="bg-[#3DB855]/20 text-[#3DB855] border-[#3DB855]/30 text-xs">Connected</Badge>;
  if (status === "partial")
    return <Badge className="bg-[#F5C72C]/20 text-[#b8900a] border-[#F5C72C]/30 text-xs">Partial</Badge>;
  return <Badge variant="secondary" className="text-xs">Manual</Badge>;
}

function StatusIcon({ status }: { status: IntegrationStatus }) {
  if (status === "connected") return <CheckCircle size={16} className="text-[#3DB855]" />;
  if (status === "partial") return <AlertCircle size={16} className="text-[#F5C72C]" />;
  return <Minus size={16} className="text-muted-foreground" />;
}

export default function Integrations() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Third-party service connections active in the Arlington Heights pilot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((integration) => (
          <Card key={integration.key} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-foreground">{integration.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{integration.description}</div>
                </div>
                <StatusIcon status={integration.status} />
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status={integration.status} />
                <span className="text-xs text-muted-foreground">{integration.note}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
