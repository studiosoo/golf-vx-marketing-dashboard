import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users } from "lucide-react";

export default function Guests() {
  const [search, setSearch] = useState("");
  const { data: members, isLoading } = trpc.members.list.useQuery({ search: search || undefined, status: "trial" });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Guests</h1>
        <p className="text-muted-foreground text-sm mt-1">Trial members and guest visits</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-400">{(members as any[])?.length || 0}</div>
          <div className="text-xs text-muted-foreground">Trial Members</div>
        </CardContent>
      </Card>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="pl-8" />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Source</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(members as any[])?.map((m: any) => (
              <TableRow key={m.id} className="border-border hover:bg-muted/20">
                <TableCell className="font-medium text-foreground">{m.firstName} {m.lastName}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{m.email}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{m.source || "—"}</TableCell>
                <TableCell><Badge variant="secondary" className="text-xs capitalize">{m.status}</Badge></TableCell>
              </TableRow>            ))}          </TableBody>
        </Table>
      </div>
    </div>
  );
}
