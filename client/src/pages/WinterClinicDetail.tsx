import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useMemo, useState } from "react";
import ProgramMarketingPanel from "@/components/ProgramMarketingPanel";
import { ProgramAIIntelligence } from "@/components/ProgramAIIntelligence";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  GraduationCap,
  Baby,
  UserCheck,
  BarChart3,
  Megaphone,
  Loader2,
  Mail,
  Phone,
  X,
} from "lucide-react";

// Category keyword maps for filtering attendees by category
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  kids: ['tots', 'bogey', 'par shooter', 'h.s.', 'player/prep'],
  adults: ['ladies', 'co-ed', 'morning mulligan'],
  family: ['adults & kids', 'adults and kids'],
};

function WinterClinicAttendeeModal({
  open,
  onClose,
  clinicShortName,
  clinicDisplayName,
  category,
}: {
  open: boolean;
  onClose: () => void;
  clinicShortName: string;
  clinicDisplayName: string;
  category?: 'kids' | 'adults' | 'family';
}) {
  // Fetch all clinic attendees when filtering by category (clinicShortName empty)
  const { data: allAttendees, isLoading } = trpc.campaigns.getWinterClinicAttendeeList.useQuery(
    { minDate: "2026-01-01", maxDate: "2026-03-31", clinicShortName: clinicShortName || undefined },
    { enabled: open }
  );
  // Filter by category if specified
  const attendees = useMemo(() => {
    if (!allAttendees) return allAttendees;
    if (!category) return allAttendees;
    const keywords = CATEGORY_KEYWORDS[category] || [];
    return allAttendees.filter(a => {
      const typeLower = (a.type || '').toLowerCase();
      return keywords.some(kw => typeLower.includes(kw));
    });
  }, [allAttendees, category]);
  const sendSms = trpc.communication.sendSMS.useMutation();
  const sendEmail = trpc.communication.sendEmail.useMutation();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {clinicDisplayName} — Registrations
            {attendees && <Badge variant="secondary" className="ml-2">{attendees.length}</Badge>}
          </DialogTitle>
          <DialogDescription>All registered contacts for this clinic program</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !attendees?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              No registrations found for this clinic.
            </div>
          ) : (
            <div className="space-y-2">
              {attendees.map((a, idx) => (
                <div key={`${a.email}-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{(a.firstName?.[0] || "?").toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{a.firstName} {a.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {a.email && (
                      <button onClick={() => sendEmail.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, email: a.email, subject: `Golf VX Winter Clinic - Follow Up`, htmlBody: `<p>Hi ${a.firstName}, thanks for registering for Golf VX Winter Clinic!</p>` })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" title="Send email">
                        <Mail className="h-3 w-3" />
                        <span className="hidden sm:inline truncate max-w-[140px]">{a.email}</span>
                      </button>
                    )}
                    {a.phone && (
                      <button onClick={() => sendSms.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, phone: a.phone, body: `Hi ${a.firstName}! Thanks for registering for Golf VX Winter Clinic. See you on the course!` })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" title="Send SMS">
                        <Phone className="h-3 w-3" />
                        <span className="hidden sm:inline">{a.phone}</span>
                      </button>
                    )}
                    {parseFloat(a.amountPaid || '0') > 0 && (
                      <span className="text-xs font-medium text-[#3DB855]">${parseFloat(a.amountPaid || '0').toFixed(0)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="pt-3 border-t border-border flex items-center justify-between">
          {attendees && attendees.length > 0 ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => attendees.forEach(a => a.email && sendEmail.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, email: a.email, subject: `Golf VX Winter Clinic - Follow Up`, htmlBody: `<p>Hi ${a.firstName}, thanks for registering for Golf VX Winter Clinic!</p>` }))} disabled={sendEmail.isPending}>
                <Mail className="h-3 w-3 mr-1" /> Email All ({attendees.length})
              </Button>
              <Button size="sm" variant="outline" onClick={() => attendees.forEach(a => a.phone && sendSms.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, phone: a.phone, body: `Hi ${a.firstName}! Thanks for registering for Golf VX Winter Clinic!` }))} disabled={sendSms.isPending}>
                <Phone className="h-3 w-3 mr-1" /> SMS All ({attendees.filter(a => a.phone).length})
              </Button>
            </div>
          ) : <div />}
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WinterClinicDetail() {
  const [, setLocation] = useLocation();
  const [selectedClinic, setSelectedClinic] = useState<{ shortName: string; displayName: string; category?: 'kids' | 'adults' | 'family' } | null>(null);

  const dateRange = useMemo(() => ({
    minDate: "2026-01-01",
    maxDate: "2026-03-31",
  }), []);

  const { data, isLoading, error } = trpc.campaigns.getWinterClinicMetrics.useQuery(dateRange);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/programs")}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">PBGA Winter Clinics</h1>
            <p className="text-muted-foreground">Loading clinic data from Acuity...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-primary/20 rounded w-2/3 mb-3" />
              <div className="h-8 bg-primary/20 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/programs")}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">PBGA Winter Clinics</h1>
            <p className="text-red-500">Error loading data: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { clinics, categorySummary, totalRegistrations, uniqueStudents, totalRevenue, overallSourceBreakdown, overallExperienceLevels } = data;

  // Sort sources by count
  const sortedSources = Object.entries(overallSourceBreakdown)
    .sort(([, a], [, b]) => b - a);
  const totalSourced = sortedSources.reduce((sum, [, count]) => sum + count, 0);

  // Sort experience levels
  const sortedExperience = Object.entries(overallExperienceLevels)
    .sort(([, a], [, b]) => b - a);
  const totalExperience = sortedExperience.reduce((sum, [, count]) => sum + count, 0);

  // Source colors — Golf VX palette
  const sourceColors: Record<string, string> = {
    "PBGA Links & Tees": "bg-[#F5C72C]",
    "Social Media": "bg-[#111111]",
    "Golf VX": "bg-primary",
    "Google Search": "bg-[#555555]",
    "Friend / Family": "bg-[#888888]",
    "Flyer / Signage": "bg-[#AAAAAA]",
    "Unknown": "bg-[#CCCCCC]",
  };

  // Experience colors — Golf VX palette
  const experienceColors: Record<string, string> = {
    "Beginner": "bg-[#3DB855]",
    "Intermediate": "bg-[#F5C72C]",
    "Advanced": "bg-[#111111]",
    "beginner": "bg-[#3DB855]",
    "intermediate": "bg-[#F5C72C]",
    "advanced": "bg-[#111111]",
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'kids': return <Baby className="h-4 w-4" />;
      case 'adults': return <UserCheck className="h-4 w-4" />;
      case 'family': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'kids': return 'bg-[#FFFBEA] text-[#111111] border-[#F5C72C]/40';
      case 'adults': return 'bg-[#F5F5F5] text-[#111111] border-[#E0E0E0]';
      case 'family': return 'bg-[#F5F5F5] text-[#555555] border-[#E0E0E0]';
      default: return 'bg-[#F5F5F5] text-[#888888] border-[#E0E0E0]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation("/programs")}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">PBGA Winter Clinics</h1>
          <p className="text-muted-foreground">
            4-Week Golf Clinic Programs — Jan to Mar 2026
          </p>
        </div>
        <span className="px-3 py-1 text-xs font-medium bg-[#E8F5EB] text-[#3DB855] rounded-full border border-[#3DB855]/30">
          Active
        </span>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Registrations</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{totalRegistrations}</p>
          <p className="text-xs text-muted-foreground mt-1">{uniqueStudents} unique students</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Revenue</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-[#3DB855]">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ${uniqueStudents > 0 ? (totalRevenue / uniqueStudents).toFixed(2) : '0'} avg/student
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Clinic Types</span>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{clinics.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {categorySummary.kids.length} kids · {categorySummary.adults.length} adults · {categorySummary.family.length} family
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Fill Rate</span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">
            {clinics.length > 0 ? (totalRegistrations / clinics.length).toFixed(1) : 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">avg registrations/clinic</p>
        </div>
      </div>

      {/* Acquisition Sources & Experience Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Acquisition Sources */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Acquisition Sources</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">How students found PBGA Winter Clinics</p>

          {/* Source bar chart */}
          <div className="space-y-3">
            {sortedSources.map(([source, count]) => {
              const pct = totalSourced > 0 ? (count / totalSourced) * 100 : 0;
              const color = sourceColors[source] || 'bg-gray-400';
              return (
                <div key={source}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{source}</span>
                    <span className="text-muted-foreground">{count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {sortedSources.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No acquisition source data available</p>
          )}
        </div>

        {/* Experience Level Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Experience Level</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Golf experience distribution across all clinics</p>

          <div className="space-y-3">
            {sortedExperience.map(([level, count]) => {
              const pct = totalExperience > 0 ? (count / totalExperience) * 100 : 0;
              const color = experienceColors[level] || experienceColors[level.toLowerCase()] || 'bg-gray-400';
              return (
                <div key={level}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium capitalize">{level}</span>
                    <span className="text-muted-foreground">{count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {sortedExperience.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No experience level data available</p>
          )}
        </div>
      </div>

      {/* Category Summary Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Programs by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'kids', label: 'Kids Programs', items: categorySummary.kids, icon: <Baby className="h-5 w-5" />, filterKeyword: 'tots|bogey|par shooter|h.s.' },
            { key: 'adults', label: 'Adult Programs', items: categorySummary.adults, icon: <UserCheck className="h-5 w-5" />, filterKeyword: 'ladies|co-ed|morning mulligan' },
            { key: 'family', label: 'Family Programs', items: categorySummary.family, icon: <Users className="h-5 w-5" />, filterKeyword: 'adults & kids|adults and kids' },
          ].map(({ key, label, items, icon }) => {
            const totalReg = items.reduce((s, c) => s + c.registrations, 0);
            const totalRev = items.reduce((s, c) => s + c.totalRevenue, 0);
            // Build a combined displayName for the category modal
            const categoryDisplayName = label;
            // Use the first clinic shortName as a representative filter (modal accepts partial match)
            const representativeShortName = items[0]?.shortName || key;
            return (
              <div key={key} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(key)}`}>
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{label}</h3>
                    <p className="text-xs text-muted-foreground">{items.length} clinic types</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Registrations</p>
                    <button
                      onClick={() => setSelectedClinic({ shortName: '', displayName: categoryDisplayName, category: key as 'kids' | 'adults' | 'family' })}
                      className="text-lg font-bold text-primary hover:underline cursor-pointer transition-colors block"
                      title="Click to view participant list"
                    >
                      {totalReg}
                    </button>
                    <p className="text-xs text-muted-foreground">click to view list</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold text-[#3DB855]">${totalRev.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lesson-by-Lesson Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Lesson-by-Lesson Breakdown
        </h2>
        <div className="space-y-4">
          {clinics.map((clinic) => {
            const clinicSourcesSorted = Object.entries(clinic.sourceBreakdown)
              .sort(([, a], [, b]) => b - a);
            const clinicExpSorted = Object.entries(clinic.experienceLevels)
              .sort(([, a], [, b]) => b - a);

            return (
              <div
                key={clinic.shortName}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(clinic.category)}`}>
                      {getCategoryIcon(clinic.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{clinic.shortName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {clinic.ageGroup} · {clinic.dayOfWeek}s · 4-Week Program
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(clinic.category)}`}>
                    {clinic.category}
                  </span>
                </div>

                {/* Clinic KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Registrations</p>
                    <button
                      onClick={() => setSelectedClinic({ shortName: clinic.shortName, displayName: clinic.shortName })}
                      className="text-lg font-bold text-primary hover:underline cursor-pointer transition-colors block"
                      title="Click to view contact list"
                    >
                      {clinic.registrations}
                    </button>
                    <p className="text-xs text-muted-foreground">{clinic.uniqueStudents} unique · click to view</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold text-[#3DB855]">${clinic.totalRevenue.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">${clinic.avgRevenuePerStudent.toFixed(0)} avg</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Avg Age</p>
                    <p className="text-lg font-bold">
                      {clinic.avgStudentAge ? clinic.avgStudentAge.toFixed(1) : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">{clinic.ageGroup}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Rev/Student</p>
                    <p className="text-lg font-bold text-[#3DB855]">
                      ${clinic.uniqueStudents > 0 ? (clinic.totalRevenue / clinic.uniqueStudents).toFixed(0) : '0'}
                    </p>
                    <p className="text-xs text-muted-foreground">per unique</p>
                  </div>
                </div>

                {/* Source & Experience Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sources */}
                  {clinicSourcesSorted.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Acquisition Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {clinicSourcesSorted.map(([source, count]) => (
                          <span
                            key={source}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted border border-border"
                          >
                            <span className={`w-2 h-2 rounded-full ${sourceColors[source] || 'bg-gray-400'}`} />
                            {source}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {clinicExpSorted.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Experience Levels</p>
                      <div className="flex flex-wrap gap-1.5">
                        {clinicExpSorted.map(([level, count]) => (
                          <span
                            key={level}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted border border-border"
                          >
                            <span className={`w-2 h-2 rounded-full ${experienceColors[level] || experienceColors[level.toLowerCase()] || 'bg-gray-400'}`} />
                            {level}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {clinics.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No Winter Clinic registrations found for this period.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Marketing Intelligence ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Marketing Intelligence</h2>
          <p className="text-sm text-muted-foreground mt-1">Meta Ads, Instagram, and newsletter efforts for PBGA Winter Clinics.</p>
        </div>
        <ProgramMarketingPanel
          programName="PBGA Winter Clinic"
          programKeywords={["winter clinic", "pbga winter"]}
        />
      </div>
      {/* AI Marketing Intelligence */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-yellow-400">✦</span> AI Marketing Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-1">AI-generated multi-channel marketing strategy based on program performance data.</p>
        </div>
        <ProgramAIIntelligence campaignId={3} programName="PBGA Winter Clinics" />
      </div>

      {/* Attendee List Modal */}
      {selectedClinic && (
        <WinterClinicAttendeeModal
          open={true}
          onClose={() => setSelectedClinic(null)}
          clinicShortName={selectedClinic.shortName}
          clinicDisplayName={selectedClinic.displayName}
          category={selectedClinic.category}
        />
      )}
    </div>
  );
}
