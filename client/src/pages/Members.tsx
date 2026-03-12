import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageTitle } from "@/components/layout/PageTitle";
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
  all_access_aces: "bg-[#F2DD48]/10 text-[#F2DD48] border-[#F2DD48]/20",
  swing_savers: "bg-[#6F6F6B]/100/10 text-[#6F6F6B] border-blue-500/20",
  golf_vx_pro: "bg-[#6F6F6B]/100/10 text-[#6F6F6B] border-purple-500/20",
  trial: "bg-yellow-500/10 text-[#F2DD48] border-yellow-500/20",
  monthly: "bg-green-500/10 text-[#72B84A] border-green-500/20",
  annual: "bg-green-500/10 text-[#72B84A] border-green-500/20",
  corporate: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  none: "bg-[#F1F1EF] text-[#6F6F6B] border-[#DEDEDA]",
};

const STATUS_COLORS: Record<MemberStatus, string> = {
  active: "bg-green-500/10 text-[#72B84A]",
  inactive: "bg-[#F1F1EF] text-[#6F6F6B]",
  cancelled: "bg-[#FF3B30]/10 text-[#FF3B30]",
  trial: "bg-yellow-500/10 text-[#F2DD48]",
};

function MemberRow({ member }: { member: Member }) {
  return (
    <tr className="border-b border-[#DEDEDA] hover:bg-[#F6F6F4] transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F2DD48]/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#F2DD48]">
              {member.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-sm text-[#222222]">{member.name}</div>
            <div className="text-xs text-[#6F6F6B]">{member.email}</div>
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
      <td className="px-4 py-3 text-sm text-[#6F6F6B]">
        {member.monthlyAmount ? `$${parseFloat(member.monthlyAmount).toFixed(0)}/mo` : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-[#6F6F6B]">
        {member.phone ? (
          <span className="flex items-center gap-1">
            <Phone size={12} />
            {member.phone}
          </span>
        ) : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-[#6F6F6B]">
        {member.joinDate
          ? new Date(member.joinDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-[#6F6F6B]">
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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <PageTitle>Members</PageTitle>
          <p className="text-sm text-[#6F6F6B]">Member management and analytics</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "TOTAL MEMBERS",   value: (members as Member[]).length, color: "text-[#222222]" },
          { label: "ACTIVE",          value: activeMembers.length,         color: "text-[#72B84A]" },
          { label: "ALL ACCESS ACE",  value: allAccessCount,               color: "text-[#222222]" },
          { label: "SWING SAVER",     value: swingSaverCount,              color: "text-[#222222]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#DEDEDA] rounded-lg p-4">
            <div className="text-[11px] font-normal text-[#6F6F6B] uppercase tracking-[0.05em] mb-1">{label}</div>
            <div className={`text-[22px] font-bold leading-none ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6F6B]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#DEDEDA] rounded-md text-sm text-[#222222] placeholder:text-[#6F6F6B] focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MemberStatus | "")}
          className="px-3 py-2 bg-white border border-[#DEDEDA] rounded-md text-sm text-[#222222] focus:outline-none focus:ring-1 focus:ring-primary"
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
          className="px-3 py-2 bg-white border border-[#DEDEDA] rounded-md text-sm text-[#222222] focus:outline-none focus:ring-1 focus:ring-primary"
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
          <Loader2 size={24} className="animate-spin text-[#F2DD48]" />
        </div>
      ) : (members as Member[]).length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#DEDEDA] rounded-lg">
          <Users size={32} className="text-[#6F6F6B] mx-auto mb-3" />
          <p className="text-[#6F6F6B]">No members found</p>
          {(search || statusFilter || tierFilter) && (
            <p className="text-sm text-[#6F6F6B] mt-1">Try adjusting your filters</p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#DEDEDA] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#DEDEDA] bg-[#F6F6F4]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6F6F6B] uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6F6F6B] uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6F6F6B] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6F6F6B] uppercase tracking-wider">
                    Monthly
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6F6F6B] uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6F6F6B] uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6F6F6B] uppercase tracking-wider">
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
          <div className="px-4 py-3 border-t border-[#DEDEDA] text-xs text-[#6F6F6B]">
            Showing {(members as Member[]).length} members
          </div>
        </div>
      )}
    </div>
  );
}
