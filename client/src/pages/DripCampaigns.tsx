import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCw, Mail, Users, BarChart2, Layers } from "lucide-react";

function formatRate(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === "sent") {
    return (
      <span className="inline-block px-2 py-0.5 bg-green-50 text-[#72B84A] text-[11px] font-medium rounded">
        Sent
      </span>
    );
  }
  if (normalized === "sending") {
    return (
      <span className="inline-block px-2 py-0.5 bg-yellow-50 text-[#F2DD48] text-[11px] font-medium rounded">
        Sending
      </span>
    );
  }
  if (normalized === "scheduled") {
    return (
      <span className="inline-block px-2 py-0.5 bg-[#888888]/10 text-[#007AFF] text-[11px] font-medium rounded">
        Scheduled
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 bg-[#F1F1EF] text-[#888888] text-[11px] font-medium rounded">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function KpiCard({ icon, label, value }: KpiCardProps) {
  return (
    <div className="bg-white border border-[#DEDEDA] rounded-[10px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#888888]">{icon}</span>
        <span className="text-xs text-[#888888]">{label}</span>
      </div>
      <div className="text-3xl font-bold text-[#222222] tracking-tight">{value}</div>
    </div>
  );
}

export default function DripCampaigns() {
  const { data: metrics, isLoading: metricsLoading } = trpc.encharge.getMetrics.useQuery();
  const { data: segments, isLoading: segmentsLoading } = trpc.encharge.getSegments.useQuery();
  const { data: broadcasts, isLoading: broadcastsLoading } = trpc.emailCampaigns.list.useQuery();
  const { data: summary, isLoading: summaryLoading } = trpc.emailCampaigns.summary.useQuery();

  const syncMutation = trpc.emailCampaigns.syncNow.useMutation({
    onSuccess: () => {
      void trpc.useUtils().emailCampaigns.list.invalidate();
      void trpc.useUtils().emailCampaigns.summary.invalidate();
    },
  });

  const isLoading = metricsLoading || segmentsLoading || broadcastsLoading || summaryLoading;

  const totalSubscribers = metrics?.totalSubscribers ?? 0;
  const avgOpenRate = summary?.avgOpenRate ?? 0;
  const avgClickRate = summary?.avgClickRate ?? 0;
  const segmentCount = Array.isArray(segments) ? segments.length : (metrics?.segments ?? 0);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#222222]">Drip Campaigns</h1>
          <p className="text-xs text-[#888888] mt-0.5">Encharge 이메일 브로드캐스트 및 캠페인</p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#F2DD48] text-[#222222] text-sm font-semibold rounded-[10px] hover:brightness-95 active:scale-95 transition-all duration-100 disabled:opacity-60"
        >
          {syncMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Sync Now
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<Users size={14} />}
          label="총 구독자"
          value={isLoading ? "—" : totalSubscribers.toLocaleString()}
        />
        <KpiCard
          icon={<Mail size={14} />}
          label="평균 오픈율"
          value={isLoading ? "—" : `${avgOpenRate.toFixed(1)}%`}
        />
        <KpiCard
          icon={<BarChart2 size={14} />}
          label="평균 클릭율"
          value={isLoading ? "—" : `${avgClickRate.toFixed(1)}%`}
        />
        <KpiCard
          icon={<Layers size={14} />}
          label="세그먼트 수"
          value={isLoading ? "—" : segmentCount}
        />
      </div>

      {/* Broadcasts Table */}
      <div className="bg-white border border-[#DEDEDA] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#DEDEDA]">
          <h2 className="text-base font-bold text-[#222222]">브로드캐스트 목록</h2>
          {summary?.lastSyncedAt && (
            <p className="text-xs text-[#AAAAAA] mt-0.5">
              마지막 동기화: {formatDate(summary.lastSyncedAt)}
            </p>
          )}
        </div>

        {/* Loading */}
        {broadcastsLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-[#888888]">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">불러오는 중...</span>
          </div>
        )}

        {/* Empty State */}
        {!broadcastsLoading && (!broadcasts || broadcasts.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
            <Mail size={32} className="text-[#AAAAAA]" />
            <p className="text-sm text-[#888888]">
              Encharge에서 동기화된 캠페인이 없습니다.
            </p>
            <p className="text-xs text-[#AAAAAA]">
              [Sync Now] 버튼을 클릭하세요.
            </p>
          </div>
        )}

        {/* Table */}
        {!broadcastsLoading && broadcasts && broadcasts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#DEDEDA]">
                  <th className="text-xs text-[#AAAAAA] font-normal px-4 py-2 text-left">캠페인 이름</th>
                  <th className="text-xs text-[#AAAAAA] font-normal px-4 py-2 text-left">상태</th>
                  <th className="text-xs text-[#AAAAAA] font-normal px-4 py-2 text-right">오픈율</th>
                  <th className="text-xs text-[#AAAAAA] font-normal px-4 py-2 text-right">클릭율</th>
                  <th className="text-xs text-[#AAAAAA] font-normal px-4 py-2 text-right">발송일</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((b) => (
                  <tr
                    key={b.id}
                    className="h-14 border-b border-[#F1F1EF] last:border-0 hover:bg-[#F1F1EF] transition-colors duration-100"
                  >
                    <td className="px-4">
                      <div className="text-sm font-semibold text-[#222222] leading-snug">
                        {b.name}
                      </div>
                      {b.subject && (
                        <div className="text-xs text-[#888888] truncate max-w-[240px]">
                          {b.subject}
                        </div>
                      )}
                    </td>
                    <td className="px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 text-sm font-bold text-[#222222] text-right">
                      {formatRate(b.openRate)}
                    </td>
                    <td className="px-4 text-sm font-bold text-[#222222] text-right">
                      {formatRate(b.clickRate)}
                    </td>
                    <td className="px-4 text-sm text-[#888888] text-right whitespace-nowrap">
                      {formatDate(b.sendAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Segments */}
      {Array.isArray(segments) && segments.length > 0 && (
        <div className="bg-white border border-[#DEDEDA] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DEDEDA]">
            <h2 className="text-base font-bold text-[#222222]">이메일 세그먼트</h2>
          </div>
          <div className="divide-y divide-[#F1F1EF]">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className="h-14 px-4 flex items-center justify-between hover:bg-[#F1F1EF] transition-colors duration-100"
              >
                <span className="text-sm font-semibold text-[#222222]">{seg.name}</span>
                <span className="text-sm font-bold text-[#222222]">
                  {seg.peopleCount.toLocaleString()}
                  <span className="text-xs text-[#888888] font-normal ml-1">명</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
