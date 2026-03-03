import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  Gift,
  Search,
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  X,
  Filter,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Target,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortBy = "submissionTimestamp" | "name" | "driveDayScore" | "status";
type SortDir = "asc" | "desc";

type Application = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  golfExperienceLevel?: string | null;
  visitedBefore?: string | null;
  indoorGolfFamiliarity?: string | null;
  howDidTheyHear?: string | null;
  bestTimeToCall?: string | null;
  illinoisResident?: boolean | null;
  status: string;
  submissionTimestamp?: Date | string | null;
  isTestEntry?: boolean;
  driveDayScore: number;
  driveDayReasons: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 85) return "text-green-400 bg-green-500/10";
  if (score >= 70) return "text-yellow-400 bg-yellow-500/10";
  return "text-muted-foreground bg-muted";
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    pending:   { label: "Pending",   cls: "bg-muted text-muted-foreground",       icon: <Clock size={10} /> },
    contacted: { label: "Contacted", cls: "bg-blue-500/10 text-blue-400",         icon: <Mail size={10} /> },
    scheduled: { label: "Scheduled", cls: "bg-yellow-500/10 text-yellow-400",     icon: <Calendar size={10} /> },
    completed: { label: "Completed", cls: "bg-green-500/10 text-green-400",       icon: <CheckCircle size={10} /> },
    declined:  { label: "Declined",  cls: "bg-red-500/10 text-red-400",           icon: <XCircle size={10} /> },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

function formatDate(ts: Date | string | null | undefined) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return "—"; }
}

// ─── Applicant Detail Drawer ─────────────────────────────────────────────────

function ApplicantDrawer({ app, onClose }: { app: Application; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-md bg-background border-l border-border overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <User size={16} className="text-primary" />
            <span className="font-semibold">{app.name}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Drive Day Score */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Drive Day Score</span>
              <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${scoreColor(app.driveDayScore)}`}>
                {app.driveDayScore}
              </span>
            </div>
            {app.driveDayReasons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {app.driveDayReasons.map((r) => (
                  <span key={r} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r}</span>
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-muted-foreground shrink-0" />
                <a href={`mailto:${app.email}`} className="text-primary hover:underline truncate">{app.email}</a>
              </div>
              {app.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-muted-foreground shrink-0" />
                  <a href={`tel:${app.phone}`} className="hover:underline">{app.phone}</a>
                </div>
              )}
              {app.city && (
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-muted-foreground shrink-0" />
                  <span>{app.city}{app.illinoisResident ? " · IL Resident ✓" : ""}</span>
                </div>
              )}
            </div>
          </div>

          {/* Demographics */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Demographics</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-card border border-border rounded p-2">
                <div className="text-xs text-muted-foreground">Age Range</div>
                <div className="font-medium">{app.ageRange || "—"}</div>
              </div>
              <div className="bg-card border border-border rounded p-2">
                <div className="text-xs text-muted-foreground">Gender</div>
                <div className="font-medium">{app.gender || "—"}</div>
              </div>
            </div>
          </div>

          {/* Golf Background */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Golf Background</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-card border border-border rounded p-2">
                <div className="text-xs text-muted-foreground">Experience Level</div>
                <div className="font-medium">{app.golfExperienceLevel || "—"}</div>
              </div>
              <div className="bg-card border border-border rounded p-2">
                <div className="text-xs text-muted-foreground">Visited Golf VX Before</div>
                <div className="font-medium">{app.visitedBefore || "—"}</div>
              </div>
              <div className="bg-card border border-border rounded p-2">
                <div className="text-xs text-muted-foreground">Indoor Golf Familiarity</div>
                <div className="font-medium">{app.indoorGolfFamiliarity || "—"}</div>
              </div>
            </div>
          </div>

          {/* Attribution */}
          {app.howDidTheyHear && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attribution</h4>
              <div className="bg-card border border-border rounded p-2 text-sm">
                {app.howDidTheyHear}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submission</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-card border border-border rounded p-2">
                <div className="text-xs text-muted-foreground">Date</div>
                <div className="font-medium">{formatDate(app.submissionTimestamp)}</div>
              </div>
              <div className="bg-card border border-border rounded p-2">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="mt-0.5">{statusBadge(app.status)}</div>
              </div>
            </div>
            {app.bestTimeToCall && (
              <div className="bg-card border border-border rounded p-2 text-sm">
                <div className="text-xs text-muted-foreground">Best Time to Call</div>
                <div className="font-medium">{app.bestTimeToCall}</div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 pt-2">
            <a
              href={`mailto:${app.email}?subject=Golf VX Arlington Heights — Annual Membership Giveaway`}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Mail size={13} /> Email
            </a>
            {app.phone && (
              <a
                href={`tel:${app.phone}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
              >
                <Phone size={13} /> Call
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sort Header ─────────────────────────────────────────────────────────────

function SortHeader({
  label, field, sortBy, sortDir, onSort,
}: {
  label: string; field: SortBy; sortBy: SortBy; sortDir: SortDir;
  onSort: (f: SortBy) => void;
}) {
  const active = sortBy === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
    >
      {label}
      {active ? (
        sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      ) : (
        <ChevronDown size={12} className="opacity-30" />
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GiveawayApplications() {
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterExp, setFilterExp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterIL, setFilterIL] = useState<boolean | undefined>(undefined);
  const [showTest, setShowTest] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("submissionTimestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const PAGE_SIZE = 50;

  const queryInput = useMemo(() => ({
    search: search || undefined,
    gender: filterGender || undefined,
    ageRange: filterAge || undefined,
    golfExperience: filterExp || undefined,
    status: filterStatus || undefined,
    illinoisResident: filterIL,
    showTestEntries: showTest,
    sortBy,
    sortDir,
    page,
    pageSize: PAGE_SIZE,
  }), [search, filterGender, filterAge, filterExp, filterStatus, filterIL, showTest, sortBy, sortDir, page]);

  const { data, isLoading, refetch } = trpc.giveaway.getApplicationsFiltered.useQuery(queryInput);
  const { data: stats } = trpc.giveaway.getStats.useQuery();
  const { data: lastSync } = trpc.giveaway.getLastSyncInfo.useQuery();

  const utils = trpc.useUtils();
  const syncMutation = trpc.giveaway.sync.useMutation({
    onMutate: () => setSyncStatus("loading"),
    onSuccess: () => {
      setSyncStatus("success");
      utils.giveaway.getApplicationsFiltered.invalidate();
      utils.giveaway.getStats.invalidate();
      utils.giveaway.getLastSyncInfo.invalidate();
      setTimeout(() => setSyncStatus("idle"), 4000);
    },
    onError: () => {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 6000);
    },
  });

  const handleSort = useCallback((field: SortBy) => {
    if (sortBy === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
    setPage(1);
  }, [sortBy]);

  const clearFilters = () => {
    setSearch(""); setFilterGender(""); setFilterAge("");
    setFilterExp(""); setFilterStatus(""); setFilterIL(undefined);
    setShowTest(false); setPage(1);
  };

  const hasFilters = search || filterGender || filterAge || filterExp || filterStatus || filterIL !== undefined || showTest;

  // CSV export
  const handleExport = () => {
    if (!data?.applications) return;
    const headers = ["Name", "Email", "Phone", "City", "IL Resident", "Age Range", "Gender", "Golf Experience", "Visited Before", "Indoor Familiarity", "Drive Day Score", "Status", "Submitted", "How Did They Hear"];
    const rows = data.applications.map((a) => [
      a.name, a.email, a.phone ?? "", a.city ?? "",
      a.illinoisResident ? "Yes" : "No",
      a.ageRange ?? "", a.gender ?? "",
      a.golfExperienceLevel ?? "", a.visitedBefore ?? "",
      a.indoorGolfFamiliarity ?? "",
      String(a.driveDayScore),
      a.status,
      formatDate(a.submissionTimestamp),
      (a.howDidTheyHear ?? "").replace(/,/g, ";"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `giveaway-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const formatLastSync = (ts: unknown) => {
    if (!ts) return "Never";
    try { return new Date(ts as string).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }); }
    catch { return "Unknown"; }
  };

  const apps = data?.applications ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gift size={20} className="text-primary" />
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Annual Membership Giveaway
            </h1>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">2026</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats?.totalApplications ?? 0} applicants · Last sync: {formatLastSync(lastSync)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExport}
            disabled={apps.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncStatus === "loading"}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            {syncStatus === "loading" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {syncStatus === "loading" ? "Syncing…" : syncStatus === "success" ? "Synced!" : "Sync Now"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Applicants", value: stats.totalApplications },
            { label: "Male", value: stats.genderDistribution?.["Male"] ?? 0 },
            { label: "Female", value: stats.genderDistribution?.["Female"] ?? 0 },
            { label: "IL Residents", value: Object.values(stats.genderDistribution ?? {}).reduce((s: number, v) => s + (v as number), 0) },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter size={14} /> Filters
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <X size={11} /> Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
          {/* Search */}
          <div className="relative xl:col-span-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, email, city…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {/* Gender */}
          <select
            value={filterGender}
            onChange={(e) => { setFilterGender(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
          {/* Age */}
          <select
            value={filterAge}
            onChange={(e) => { setFilterAge(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Ages</option>
            <option value="Under 25">Under 25</option>
            <option value="25-34">25–34</option>
            <option value="35-44">35–44</option>
            <option value="45-54">45–54</option>
            <option value="55+">55+</option>
          </select>
          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>
          {/* IL Resident */}
          <select
            value={filterIL === undefined ? "" : filterIL ? "yes" : "no"}
            onChange={(e) => {
              setFilterIL(e.target.value === "" ? undefined : e.target.value === "yes");
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Locations</option>
            <option value="yes">IL Residents Only</option>
            <option value="no">Non-IL</option>
          </select>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showTest}
              onChange={(e) => { setShowTest(e.target.checked); setPage(1); }}
              className="rounded border-border"
            />
            <span className="text-muted-foreground">Show test entries</span>
          </label>
          <span className="text-muted-foreground ml-auto">
            {total} result{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Name" field="name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</span>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Demographics</span>
                </th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Golf Background</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <SortHeader label="Drive Day" field="driveDayScore" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">
                  <SortHeader label="Submitted" field="submissionTimestamp" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <AlertCircle size={24} className="mx-auto mb-2 opacity-40" />
                    No applications match your filters.
                  </td>
                </tr>
              ) : (
                apps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app as Application)}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{app.name}</div>
                      {app.isTestEntry && (
                        <span className="text-xs text-muted-foreground">(test)</span>
                      )}
                    </td>
                    {/* Contact */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-xs text-muted-foreground truncate max-w-[160px]">{app.email}</div>
                      {app.city && <div className="text-xs text-muted-foreground">{app.city}{app.illinoisResident ? " · IL" : ""}</div>}
                    </td>
                    {/* Demographics */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-xs text-muted-foreground">{app.ageRange || "—"}</div>
                      <div className="text-xs text-muted-foreground">{app.gender || "—"}</div>
                    </td>
                    {/* Golf Background */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="text-xs text-muted-foreground truncate max-w-[140px]">{app.golfExperienceLevel || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[140px]">{app.indoorGolfFamiliarity || "—"}</div>
                    </td>
                    {/* Drive Day Score */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor(app.driveDayScore)}`}>
                        {app.driveDayScore}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">{statusBadge(app.status)}</td>
                    {/* Submitted */}
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                      {formatDate(app.submissionTimestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
            <span>Page {page} of {totalPages} · {total} total</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Applicant detail drawer */}
      {selectedApp && (
        <ApplicantDrawer app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </div>
  );
}
