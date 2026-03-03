import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Calendar, Trophy } from "lucide-react";

function programLabel(type: string): string {
  if (!type) return "—";
  if (type.toLowerCase().includes("drive day")) return "Drive Day";
  if (type.toLowerCase().includes("winter") || type.toLowerCase().includes("pbga")) return "Winter Clinic";
  if (type.toLowerCase().includes("summer camp") || type.toLowerCase().includes("junior")) return "Junior Summer Camp";
  if (type.toLowerCase().includes("trial") || type.toLowerCase().includes("intro")) return "Trial Session";
  if (type.toLowerCase().includes("superbowl") || type.toLowerCase().includes("watch party")) return "Superbowl Watch Party";
  return type.split("·")[0].trim();
}

export default function Guests() {
  const [search, setSearch] = useState("");
  const { data: guests, isLoading } = trpc.members.listWithPrograms.useQuery(
    { search: search || undefined, status: "trial" },
    { staleTime: 60_000 }
  );

  const totalPrograms = guests?.reduce((s, g) => s + (g.programCount || 0), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Guests & Leads</h1>
        <p className="text-muted-foreground text-sm mt-1">Trial members and guest visitors — track which programs they participated in</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-[#F5C72C]" />
              <span className="text-xs text-muted-foreground">Total Guests</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{guests?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-[#F5C72C]" />
              <span className="text-xs text-muted-foreground">Program Visits</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{totalPrograms}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={14} className="text-[#F5C72C]" />
              <span className="text-xs text-muted-foreground">Avg Programs/Guest</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {guests?.length ? (totalPrograms / guests.length).toFixed(1) : "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Source</TableHead>
              <TableHead className="text-muted-foreground">Programs Attended</TableHead>
              <TableHead className="text-muted-foreground">Last Visit</TableHead>
              <TableHead className="text-muted-foreground text-right">Visits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell>
              </TableRow>
            )}
            {!isLoading && (!guests || guests.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No guests found</TableCell>
              </TableRow>
            )}
            {(guests || []).map((g: any) => {
              const uniquePrograms = Array.from(new Set((g.appointments || []).map((a: any) => programLabel(a.type))));
              const lastDate = g.lastProgramDate ? new Date(g.lastProgramDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
              return (
                <TableRow key={g.id} className="border-border hover:bg-muted/20">
                  <TableCell className="font-medium text-foreground">{g.firstName} {g.lastName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{g.email}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{g.source || "—"}</TableCell>
                  <TableCell>
                    {uniquePrograms.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {uniquePrograms.map((p: any) => (
                          <Badge key={p} variant="secondary" className="text-xs bg-[#F5C72C]/10 text-[#111111] border-0">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">No programs yet</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{lastDate || "—"}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-medium text-foreground">{g.programCount || 0}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
