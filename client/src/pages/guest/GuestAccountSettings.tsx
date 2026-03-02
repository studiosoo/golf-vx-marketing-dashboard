// Guest version of AccountSettings — static page showing login prompt
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Lock, LogIn } from "lucide-react";

export default function GuestAccountSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">User profile and system configuration</p>
      </div>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings size={16} />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center space-y-4">
            <Lock size={32} className="mx-auto text-muted-foreground" />
            <div>
              <p className="text-foreground font-medium">Authentication Required</p>
              <p className="text-muted-foreground text-sm mt-1">Account settings are only available to authenticated users</p>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <LogIn size={14} />
              Login to Access Settings
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
