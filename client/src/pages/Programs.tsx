import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, DollarSign } from "lucide-react";

export default function Programs() {
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();

  const programTypes = ["pbga_programs", "event_specific", "corporate_events"];
  const programs = (campaigns as any[])?.filter((c: any) => programTypes.includes(c.type)) || [];
  const active = programs.filter((p: any) => p.status === "active");
  const upcoming = programs.filter((p: any) => p.status === "planned");
  const past = programs.filter((p: any) => p.status === "completed");

  const ProgramCard = ({ program }: { program: any }) => (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-semibold text-foreground">{program.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 capitalize">{program.type?.replace(/_/g, " ")}</div>
          </div>
          <Badge variant={program.status === "active" ? "default" : "secondary"} className="text-xs capitalize">
            {program.status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold text-foreground">${parseFloat(String(program.actualRevenue || 0)).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Revenue</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold text-foreground">${parseFloat(String(program.actualSpend || 0)).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Spend</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Programs</h1>
        <p className="text-muted-foreground text-sm mt-1">Golf programs and events management</p>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="bg-muted">
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        {["active", "upcoming", "past"].map((tab) => {
          const list = tab === "active" ? active : tab === "upcoming" ? upcoming : past;
          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-card rounded-xl animate-pulse border border-border" />
                  ))}
                </div>
              ) : list.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list.map((p: any) => <ProgramCard key={p.id} program={p} />)}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
                  <p>No {tab} programs</p>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
