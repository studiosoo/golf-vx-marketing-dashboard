import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";

// TODO: implement — Notifications (placeholder, hidden)
// TODO: implement — Preferences (placeholder, hidden)
// TODO: move to /integrations — API Keys (belongs on Integrations page)

export default function AccountSettings() {
  const { data: user } = trpc.auth.me.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-[#222222]">Settings</h1>
        <p className="text-[#6F6F6B] text-sm mt-1">Manage your account</p>
      </div>

      {/* Profile — Category A: functional */}
      <Card className="bg-white border-[#DEDEDA]">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User size={16} />Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[#F2DD48]/20 flex items-center justify-center">
              <User size={24} className="text-[#F2DD48]" />
            </div>
            <div>
              <div className="font-semibold text-[#222222]">{(user as any)?.name || "Owner"}</div>
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
          <Button className="bg-[#F2DD48] text-black hover:bg-yellow-500" size="sm">Save Profile</Button>
        </CardContent>
      </Card>

      {/* Reorganization notice — functional items < 3 */}
      <Card className="bg-white border-[#DEDEDA]">
        <CardContent className="py-4">
          <p className="text-[#6F6F6B] text-sm">
            Settings are being reorganized. More options coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
