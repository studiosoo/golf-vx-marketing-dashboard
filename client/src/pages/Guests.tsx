import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Calendar, DollarSign, Loader2 } from "lucide-react";

function programLabel(type: string): string {
  if (!type) return "—";
  const t = type.toLowerCase();
  if (t.includes("drive day")) return "Drive Day";
  if (t.includes("winter") || t.includes("pbga")) return "Winter Clinic";
  if (t.includes("summer camp") || t.includes("junior")) return "Junior Summer Camp";
  if (t.includes("trial") || t.includes("intro")) return "Trial Session";
  if (t.includes("superbowl") || t.includes("watch party")) return "Watch Party";
  if (t.includes("league")) return "League";
  return type.split("·")[0].trim().split(" - ")[0].trim();
}

const PROGRAM_COLORS: Record<string, string> = {
  "Drive Day": "bg-blue-50 text-blue-700 border-blue-100",
  "Winter Clinic": "bg-purple-50 text-purple-700 border-purple-100",
  "Junior Summer Camp": "bg-green-50 text-green-700 border-green-100",
  "Trial Session": "bg-[#F5C72C]/10 text-[#8B6E00] border-[#F5C72C]/30",
  "Watch Party": "bg-orange-50 text-orange-700 border-orange-100",
  "League": "bg-gray-50 text-gray-700 border-gray-200",
};

function ProgramBadge({ type }: { type: string }) {
  const label = programLabel(type);
  const colorClass = PROGRAM_COLORS[label] || "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Guests() {
  const [search, setSearch] = useState("");

  const { data: contacts, isLoading } = trpc.members.getGuestContacts.useQuery(
    { search: search || undefined },
    { staleTime: 120_000 }
  );

  const totalVisits = contacts?.reduce((s, c) => s + c.visitCount, 0) || 0;
  const totalRevenue = contacts?.reduce((s, c) => s + c.totalPaid, 0) || 0;

  return (
    <div className="p-6 space-y-5 bg-[#FAFAFA] min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111] tracking-tight">Guests & Leads</h1>
        <p className="text-sm text-[#666] mt-0.5">Acuity visitors from the last 6 months — track program participation and follow-up opportunities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F5C72C]/10 flex items-center justify-center">
            <Users className="w-4.5 h-4.5 text-[#8B6E00]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#111]">{contacts?.length || 0}</div>
            <div className="text-xs text-[#888]">Unique Visitors</div>
          </div>
        </div>
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Calendar className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#111]">{totalVisits}</div>
            <div className="text-xs text-[#888]">Total Bookings</div>
          </div>
        </div>
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <DollarSign className="w-4.5 h-4.5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#111]">${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-[#888]">Total Paid</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-9 bg-white border-[#E0E0E0] text-[#111] placeholder:text-[#AAAAAA] focus:border-[#F5C72C] focus:ring-[#F5C72C]/20 h-9 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#F0F0F0] hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-[#888] uppercase tracking-wide py-2.5 pl-4">Name</TableHead>
              <TableHead className="text-xs font-semibold text-[#888] uppercase tracking-wide py-2.5">Email</TableHead>
              <TableHead className="text-xs font-semibold text-[#888] uppercase tracking-wide py-2.5">Programs Attended</TableHead>
              <TableHead className="text-xs font-semibold text-[#888] uppercase tracking-wide py-2.5">Last Visit</TableHead>
              <TableHead className="text-xs font-semibold text-[#888] uppercase tracking-wide py-2.5 text-right pr-4">Visits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-[#999]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading visitors…</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (!contacts || contacts.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-[#999] text-sm">
                  {search ? `No visitors matching "${search}"` : "No visitors found in the last 6 months"}
                </TableCell>
              </TableRow>
            )}
            {(contacts || []).map((c, i) => {
              const uniquePrograms = Array.from(new Set(c.programs.map(programLabel)));
              return (
                <TableRow key={c.email} className={`border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors ${i % 2 === 0 ? '' : 'bg-[#FAFAFA]/50'}`}>
                  <TableCell className="py-2.5 pl-4">
                    <span className="text-sm font-medium text-[#111]">{c.firstName} {c.lastName}</span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="text-sm text-[#555]">{c.email}</span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    {uniquePrograms.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {uniquePrograms.slice(0, 3).map(p => (
                          <ProgramBadge key={p} type={p} />
                        ))}
                        {uniquePrograms.length > 3 && (
                          <span className="text-xs text-[#999] self-center">+{uniquePrograms.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-[#AAAAAA]">No programs</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="text-sm text-[#666]">{formatDate(c.lastVisit)}</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-right pr-4">
                    <span className="text-sm font-semibold text-[#111]">{c.visitCount}</span>
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
