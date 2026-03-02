import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { User, Shield, Bell, LogOut, Key, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SYSTEM_INFO = [
  { label: "Dashboard Version", value: "v2.0.0" },
  { label: "Environment", value: "Production" },
  { label: "Location", value: "Arlington Heights, IL" },
  { label: "Brand", value: "Golf VX" },
  { label: "Franchise", value: "Arlington Heights" },
  { label: "Timezone", value: "America/Chicago (CST)" },
];

const WEBHOOK_INFO = [
  { label: "Boomerang Webhook", value: "POST /api/webhooks/boomerang", status: "active" },
  { label: "Webhook Secret", value: "golfvx_boomerang_2026", status: "active" },
  { label: "Make.com Header", value: "x-webhook-secret", status: "active" },
  { label: "Twilio SMS", value: "Not configured", status: "pending" },
];

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({ title: "Signed out", description: "You have been signed out successfully" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your profile, system configuration, and webhook settings</p>
        </div>

        {/* User Profile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-foreground">{user?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs capitalize">{user?.role ?? "user"}</Badge>
                  <span className="text-xs text-muted-foreground">Last sign in: {user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : "—"}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 shrink-0" onClick={handleLogout}>
                <LogOut className="h-3 w-3" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-400" /> System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SYSTEM_INFO.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Webhook & API Config */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" /> Webhook & API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {WEBHOOK_INFO.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.value}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${
                    item.status === "active" ? "border-green-500/40 text-green-400" : "border-amber-500/40 text-amber-400"
                  }`}>{item.status === "active" ? "Active" : "Pending"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Manus OAuth</p>
                  <p className="text-xs text-muted-foreground">Authenticated via Manus OAuth 2.0</p>
                </div>
                <Badge variant="outline" className="text-xs border-green-500/40 text-green-400">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Session Cookie</p>
                  <p className="text-xs text-muted-foreground">JWT-signed HTTP-only session cookie</p>
                </div>
                <Badge variant="outline" className="text-xs border-green-500/40 text-green-400">Secure</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
