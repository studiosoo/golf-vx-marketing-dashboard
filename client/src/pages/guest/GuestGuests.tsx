// Guest version of Guests — uses trpc.guest.getMembers with guest filter
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";

export default function GuestGuests() {
  const { data: members = [], isLoading } = trpc.guest.getMembers.useQuery({ status: "inactive" });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Guests</h1>
        <p className="text-muted-foreground text-sm mt-1">Non-member guest visitors</p>
      </div>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck size={16} />
            Guests ({(members as any[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}</div>
          ) : (members as any[]).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No guest data available</p>
          ) : (
            <div className="space-y-2">
              {(members as any[]).slice(0, 30).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">{m.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
