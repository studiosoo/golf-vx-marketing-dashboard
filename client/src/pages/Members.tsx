import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Trophy,
  Loader2,
  ChevronDown,
  Star,
} from "lucide-react";

type MembershipTier = "trial" | "monthly" | "annual" | "corporate" | "none" | "all_access_aces" | "swing_savers" | "golf_vx_pro";
type MemberStatus = "active" | "inactive" | "cancelled" | "trial";

interface Member {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  membershipTier: MembershipTier;
  status: MemberStatus;
  joinDate: Date;
  acquisitionSource?: string | null;
  monthlyAmount?: string | null;
  loyaltyPoints?: number;
  totalVisits?: number;
  lastVisitDate?: Date | null;
  tags?: string[] | null;
}

const TIER_LABELS: Record<MembershipTier, string> = {
  all_access_aces: "All Access Ace",
  swing_savers: "Swing Saver",
  golf_vx_pro: "Golf VX Pro",
  trial: "Trial",
  monthly: "Monthly",
  annual: "Annual",
  corporate: "Corporate",
  none: "None",
};

const TIER_COLORS: Record<MembershipTier, string> = {
  all_access_aces: "bg-amber-50 text-amber-800 border-amber-300",
  swing_savers: "bg-blue-50 text-blue-700 border-blue-200",
  golf_vx_pro: "bg-purple-50 text-purple-700 border-purple-200",
  trial: "bg-amber-50 text-amber-700 border-amber-200",
  monthly: "bg-green-50 text-green-700 border-green-200",
  annual: "bg-green-50 text-green-700 border-green-200",
  corporate: "bg-indigo-50 text-indigo-700 border-indigo-200",
  none: "bg-muted text-muted-foreground border-border",
};

const STATUS_COLORS: Record<MemberStatus, string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-muted text-muted-foreground",
  cancelled: "bg-red-50 text-red-600",
  trial: "bg-amber-50 text-amber-700",
};

function MemberRow({ member }: { member: Member }) {
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {member.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-sm text-foreground">{member.name}</div>
            <div className="text-xs text-muted-foreground">{member.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${TIER_COLORS[member.membershipTier]}`}>
          {TIER_LABELS[member.membershipTier]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[member.status]}`}>
          {member.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {member.monthlyAmount ? `$${parseFloat(member.monthlyAmount).toFixed(0)}/mo` : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {member.phone ? (
          <span className="flex items-center gap-1">
            <Phone size={12} />
            {member.phone}
          </span>
        ) : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {member.joinDate
          ? new Date(member.joinDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {member.acquisitionSource || "—"}
      </td>
    </tr>
  );
}

export default function Members() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "">("");
  const [tierFilter, setTierFilter] = useState<MembershipTier | "">("");

  const { data: members = [], isLoading } = trpc.members.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    membershipTier: tierFilter || undefined,
  });

  const { data: stats } = trpc.members.getStats.useQuery();

  const activeMembers = (members as Member[]).filter((m) => m.status === "active");
  const allAccessCount = (members as Member[]).filter((m) => m.membershipTier === "all_access_aces").length;
  const swingSaverCount = (members as Member[]).filter((m) => m.membershipTier === "swing_savers").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Members
          </h1>
          <p className="text-sm text-muted-foreground">Member management and analytics</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Members</div>
          <div className="text-3xl font-bold text-foreground">{(members as Member[]).length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Active</div>
          <div className="text-3xl font-bold text-green-700">{activeMembers.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">All Access Ace</div>
          <div className="text-3xl font-bold text-primary">{allAccessCount}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Swing Saver</div>
          <div className="text-3xl font-bold text-blue-700">{swingSaverCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MemberStatus | "")}
          className="px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
          <option value="trial">Trial</option>
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as MembershipTier | "")}
          className="px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Tiers</option>
          <option value="all_access_aces">All Access Ace</option>
          <option value="swing_savers">Swing Saver</option>
          <option value="golf_vx_pro">Golf VX Pro</option>
          <option value="trial">Trial</option>
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (members as Member[]).length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Users size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No members found</p>
          {(search || statusFilter || tierFilter) && (
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Monthly
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {(members as Member[]).map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            Showing {(members as Member[]).length} members
          </div>
        </div>
      )}
    </div>
  );
}
