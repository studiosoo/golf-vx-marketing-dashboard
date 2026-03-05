import { trpc } from "@/lib/trpc";
import {
  Users,
  DollarSign,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Clock,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-6 border ${accent ? "bg-primary/5 border-primary/20" : "bg-white/5 border-white/10"}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-white/60">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? "bg-primary/20" : "bg-white/10"}`}>
          <span className={accent ? "text-primary" : "text-white/60"}>{icon}</span>
        </div>
      </div>
      <div className={`text-3xl font-bold mb-1 ${accent ? "text-primary" : "text-white"}`}>{value}</div>
      {subtitle && <div className="text-sm text-white/50">{subtitle}</div>}
    </div>
  );
}

export default function Preview() {
  const { data: snapshot, isLoading } = trpc.preview.getSnapshot.useQuery();

  const members = snapshot?.members;
  const revenue = snapshot?.revenue;
  const budget = snapshot?.budget;
  const campaigns = snapshot?.campaigns;

  const memberProgress = members ? Math.min((members.total / members.goal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">VX</span>
            </div>
            <div>
              <div className="font-bold text-lg leading-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                GOLF VX
              </div>
              <div className="text-xs text-white/50 leading-tight">Arlington Heights</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Clock size={12} />
            {snapshot?.generatedAt
              ? `Last synced: ${new Date(snapshot.generatedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}`
              : "Loading..."}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Marketing Dashboard
          </h1>
          <p className="text-white/50">Live performance overview</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Members"
                value={members ? members.total.toLocaleString() : "—"}
                subtitle={`Goal: ${members?.goal || 300}`}
                icon={<Users size={18} />}
                accent
              />
              <StatCard
                title="Monthly Revenue"
                value={revenue ? `$${revenue.thisMonth.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—"}
                subtitle={revenue && revenue.mom !== 0 ? `${revenue.mom > 0 ? "+" : ""}${revenue.mom.toFixed(1)}% vs last month` : undefined}
                icon={<DollarSign size={18} />}
              />
              <StatCard
                title="Ad Spend"
                value={budget ? `$${Number(budget.spent).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—"}
                subtitle={budget ? `${budget.utilization.toFixed(0)}% of budget` : undefined}
                icon={<Target size={18} />}
              />
              <StatCard
                title="Active Campaigns"
                value={campaigns ? campaigns.active : "—"}
                subtitle="Running"
                icon={<TrendingUp size={18} />}
              />
            </div>

            {/* Member breakdown */}
            {members && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="font-semibold text-lg mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Member Breakdown
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-3xl font-bold text-primary">{members.allAccessAce}</div>
                    <div className="text-sm text-white/60 mt-1">All Access Ace</div>
                    <div className="text-xs text-white/40">$325/mo</div>
                  </div>
                  <div className="text-center p-4 bg-[#888888]/100/10 rounded-lg border border-blue-500/20">
                    <div className="text-3xl font-bold text-[#888888]">{members.swingSaver}</div>
                    <div className="text-sm text-white/60 mt-1">Swing Saver</div>
                    <div className="text-xs text-white/40">$225/mo</div>
                  </div>
                  <div className="text-center p-4 bg-[#888888]/100/10 rounded-lg border border-purple-500/20">
                    <div className="text-3xl font-bold text-[#888888]">{members.pro}</div>
                    <div className="text-sm text-white/60 mt-1">Golf VX Pro</div>
                    <div className="text-xs text-white/40">$500/mo</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Member Goal Progress</span>
                    <span className="font-medium">{members.total} / {members.goal}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-700"
                      style={{ width: `${memberProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>0</span>
                    <span className="text-primary font-medium">{memberProgress.toFixed(0)}%</span>
                    <span>{members.goal}</span>
                  </div>
                </div>
              </div>
            )}

            {/* MRR */}
            {members && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="font-semibold text-lg mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Monthly Recurring Revenue
                </h2>
                <div className="text-5xl font-bold text-primary mb-2">
                  ${members.mrr.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-white/50 text-sm">
                  {members.newThisMonth > 0 && (
                    <span className="text-[#3DB855]">+{members.newThisMonth} new members this month</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-4 mt-10">
        <div className="max-w-5xl mx-auto text-center text-xs text-white/30">
          Golf VX Arlington Heights — Marketing Intelligence Dashboard
        </div>
      </div>
    </div>
  );
}
