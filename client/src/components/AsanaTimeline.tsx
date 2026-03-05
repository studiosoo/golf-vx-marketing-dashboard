import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { ExternalLink, RefreshCw, Loader2, CheckCircle2, Circle, Diamond, ChevronDown, ChevronRight } from "lucide-react";

interface AsanaTask {
  gid: string;
  name: string;
  start_on: string | null;
  due_on: string | null;
  completed: boolean;
  resource_subtype: string;
  campaign: string;
  section: string;
}

const CAMPAIGN_COLORS: Record<string, { bg: string; bar: string; text: string }> = {
  "Trial Conversion Campaign":             { bg: "bg-green-50",  bar: "bg-green-500",  text: "text-[#3DB855]" },
  "Membership Acquisition campaign":        { bg: "bg-red-50",    bar: "bg-red-400",    text: "text-red-700" },
  "Member Retention + Community Flywheel": { bg: "bg-[#888888]/10",   bar: "bg-[#888888]/100",   text: "text-[#888888]" },
  "Venue Display / Local Media":           { bg: "bg-yellow-50", bar: "bg-yellow-500", text: "text-yellow-700" },
};

function getColor(campaign: string) {
  return CAMPAIGN_COLORS[campaign] || { bg: "bg-gray-50", bar: "bg-[#AAAAAA]", text: "text-gray-700" };
}

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(s: string | null): string {
  if (!s) return "—";
  const d = parseDate(s);
  if (!d) return s;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AsanaTimeline() {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(
    new Set(Object.keys(CAMPAIGN_COLORS))
  );
  const { data, isLoading, error, refetch, isFetching } = trpc.asana.getTimeline.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { timelineStart, timelineEnd, monthLabels } = useMemo(() => {
    const tasks = (data?.tasks || []) as AsanaTask[];
    const dates = tasks
      .flatMap((t) => [parseDate(t.start_on), parseDate(t.due_on)])
      .filter(Boolean) as Date[];
    const now = new Date();
    const minDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(now.getFullYear(), 0, 1);
    const maxDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date(now.getFullYear(), 11, 31);
    const start = new Date(minDate); start.setDate(1);
    const end = new Date(maxDate); end.setMonth(end.getMonth() + 1); end.setDate(0);
    const totalMs = Math.max(1, end.getTime() - start.getTime());
    const months: { label: string; year: number; month: number; left: number; width: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const monthStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
      const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      const left = Math.max(0, (monthStart.getTime() - start.getTime()) / totalMs * 100);
      const width = (Math.min(monthEnd.getTime(), end.getTime()) - Math.max(monthStart.getTime(), start.getTime())) / totalMs * 100;
      months.push({
        label: cur.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        year: cur.getFullYear(), month: cur.getMonth(), left, width,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return { timelineStart: start, timelineEnd: end, monthLabels: months };
  }, [data]);

  const totalMs = Math.max(1, timelineEnd.getTime() - timelineStart.getTime());
  const todayLeft = Math.max(0, Math.min(100, (new Date().getTime() - timelineStart.getTime()) / totalMs * 100));

  function getBarStyle(task: AsanaTask) {
    const s = parseDate(task.start_on) || parseDate(task.due_on);
    const e = parseDate(task.due_on) || parseDate(task.start_on);
    if (!s || !e) return null;
    const left = Math.max(0, (s.getTime() - timelineStart.getTime()) / totalMs * 100);
    const width = Math.max(0.3, (e.getTime() - s.getTime()) / totalMs * 100);
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  }

  function getMilestoneStyle(task: AsanaTask) {
    const d = parseDate(task.due_on);
    if (!d) return null;
    const left = Math.max(0, (d.getTime() - timelineStart.getTime()) / totalMs * 100);
    return { left: `${left}%` };
  }

  const grouped = useMemo(() => {
    const tasks = (data?.tasks || []) as AsanaTask[];
    const map: Record<string, AsanaTask[]> = {};
    for (const campaign of Object.keys(CAMPAIGN_COLORS)) map[campaign] = [];
    for (const t of tasks) {
      const key = Object.keys(CAMPAIGN_COLORS).find(k =>
        t.campaign === k || t.section.startsWith(k.split(" ")[0])
      ) || t.campaign;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [data]);

  const toggleCampaign = (campaign: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(campaign)) next.delete(campaign); else next.add(campaign);
      return next;
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-[#F5C72C]" />
      <span className="ml-2 text-sm text-[#666]">Loading Asana timeline…</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p className="text-sm font-medium text-red-700 mb-1">Could not load Asana timeline</p>
      <p className="text-xs text-[#E8453C] mb-3">{(error as unknown as Error).message}</p>
      <button onClick={() => refetch()} className="text-xs px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50">Retry</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#111]">Marketing Master Timeline</h3>
          <p className="text-xs text-[#888]">Live from Asana · {data?.tasks.length || 0} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={data?.projectUrl || "#"} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#F06A35] bg-[#F06A35]/10 border border-[#F06A35]/30 rounded-lg hover:bg-[#F06A35]/20 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />Open in Asana
          </a>
          <button onClick={() => refetch()} disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#666] bg-white border border-[#E0E0E0] rounded-lg hover:bg-[#F5F5F5] transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(CAMPAIGN_COLORS).map(([name, c]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${c.bar}`} />
            <span className="text-xs text-[#555]">{name.split(" ").slice(0, 2).join(" ")}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-4 bg-[#888888]/100" />
          <span className="text-xs text-[#555]">Today</span>
        </div>
      </div>

      <div className="bg-white border border-[#E0E0E0] rounded-xl overflow-hidden overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="flex border-b border-[#E0E0E0] bg-[#FAFAFA]">
            <div className="w-56 flex-shrink-0 px-4 py-2 text-xs font-medium text-[#888] border-r border-[#E0E0E0]">Task</div>
            <div className="flex-1 relative h-8 overflow-hidden">
              {monthLabels.map(m => (
                <div key={`${m.year}-${m.month}`}
                  className="absolute top-0 h-full flex items-center border-r border-[#E8E8E8]"
                  style={{ left: `${m.left}%`, width: `${m.width}%` }}>
                  <span className="text-xs text-[#888] px-1 truncate">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {Object.entries(grouped).map(([campaign, tasks]) => {
            const color = getColor(campaign);
            const expanded = expandedCampaigns.has(campaign);
            const completed = tasks.filter(t => t.completed).length;
            return (
              <div key={campaign} className="border-b border-[#E0E0E0] last:border-b-0">
                <button onClick={() => toggleCampaign(campaign)}
                  className={`w-full flex items-center ${color.bg} hover:brightness-95 transition-all`}>
                  <div className="w-56 flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-r border-[#E0E0E0]">
                    {expanded
                      ? <ChevronDown className="w-3.5 h-3.5 text-[#666] flex-shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 text-[#666] flex-shrink-0" />}
                    <span className={`text-xs font-semibold ${color.text} truncate`}>{campaign}</span>
                    <span className="text-xs text-[#999] ml-auto flex-shrink-0">{completed}/{tasks.length}</span>
                  </div>
                  <div className="flex-1 relative h-8">
                    {tasks.length > 0 && (() => {
                      const dates = tasks.flatMap(t => [parseDate(t.start_on), parseDate(t.due_on)]).filter(Boolean) as Date[];
                      if (!dates.length) return null;
                      const min = new Date(Math.min(...dates.map(d => d.getTime())));
                      const max = new Date(Math.max(...dates.map(d => d.getTime())));
                      const left = Math.max(0, (min.getTime() - timelineStart.getTime()) / totalMs * 100);
                      const width = Math.max(0.5, (max.getTime() - min.getTime()) / totalMs * 100);
                      return <div className={`absolute top-2 h-4 rounded-sm opacity-25 ${color.bar}`}
                        style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }} />;
                    })()}
                    <div className="absolute top-0 bottom-0 w-px bg-[#888888]/100 opacity-40" style={{ left: `${todayLeft}%` }} />
                  </div>
                </button>

                {expanded && tasks.map(task => {
                  const isMilestone = task.resource_subtype === "milestone";
                  const barStyle = isMilestone ? null : getBarStyle(task);
                  const milestoneStyle = isMilestone ? getMilestoneStyle(task) : null;
                  return (
                    <div key={task.gid} className="flex items-center border-t border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors">
                      <div className="w-56 flex-shrink-0 flex items-center gap-2 px-4 py-2 border-r border-[#F0F0F0]">
                        {task.completed
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-[#3DB855] flex-shrink-0" />
                          : isMilestone
                            ? <Diamond className="w-3.5 h-3.5 text-[#999] flex-shrink-0" />
                            : <Circle className="w-3.5 h-3.5 text-[#CCC] flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className={`text-xs truncate ${task.completed ? "line-through text-[#AAA]" : "text-[#333]"}`}>
                            {task.name}
                          </p>
                          {(task.start_on || task.due_on) && (
                            <p className="text-[10px] text-[#AAA]">
                              {task.start_on ? formatDate(task.start_on) : ""}
                              {task.start_on && task.due_on ? " → " : ""}
                              {task.due_on ? formatDate(task.due_on) : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 relative h-10">
                        <div className="absolute top-0 bottom-0 w-px bg-blue-400 opacity-25" style={{ left: `${todayLeft}%` }} />
                        {barStyle && (
                          <div
                            className={`absolute top-3 h-4 rounded-sm ${color.bar} ${task.completed ? "opacity-30" : "opacity-80"}`}
                            style={barStyle}
                            title={`${task.name}: ${formatDate(task.start_on)} → ${formatDate(task.due_on)}`}
                          />
                        )}
                        {milestoneStyle && (
                          <div className="absolute top-2 transform -translate-x-1/2" style={milestoneStyle}>
                            <Diamond className={`w-5 h-5 ${task.completed ? "text-[#3DB855]" : "text-[#F5C72C]"}`} fill="currentColor" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
