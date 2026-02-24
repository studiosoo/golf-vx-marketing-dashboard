import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AccountSettings() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your account and team settings</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Construction className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Coming Soon</CardTitle>
            </div>
            <CardDescription>
              This section is under development and will be available shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Check back soon for Account Settings functionality.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
