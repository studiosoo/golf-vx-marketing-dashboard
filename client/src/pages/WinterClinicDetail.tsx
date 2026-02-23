import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useMemo } from "react";
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
} from "lucide-react";

export default function WinterClinicDetail() {
  const [, setLocation] = useLocation();

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

  // Source colors
  const sourceColors: Record<string, string> = {
    "PBGA Links & Tees": "bg-emerald-500",
    "Social Media": "bg-blue-500",
    "Golf VX": "bg-primary",
    "Google Search": "bg-purple-500",
    "Friend / Family": "bg-orange-500",
    "Flyer / Signage": "bg-pink-500",
    "Unknown": "bg-gray-400",
  };

  // Experience colors
  const experienceColors: Record<string, string> = {
    "Beginner": "bg-green-500",
    "Intermediate": "bg-blue-500",
    "Advanced": "bg-purple-500",
    "beginner": "bg-green-500",
    "intermediate": "bg-blue-500",
    "advanced": "bg-purple-500",
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
      case 'kids': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'adults': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'family': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full border border-green-200">
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
          <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
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
            { key: 'kids', label: 'Kids Programs', items: categorySummary.kids, icon: <Baby className="h-5 w-5" /> },
            { key: 'adults', label: 'Adult Programs', items: categorySummary.adults, icon: <UserCheck className="h-5 w-5" /> },
            { key: 'family', label: 'Family Programs', items: categorySummary.family, icon: <Users className="h-5 w-5" /> },
          ].map(({ key, label, items, icon }) => {
            const totalReg = items.reduce((s, c) => s + c.registrations, 0);
            const totalRev = items.reduce((s, c) => s + c.totalRevenue, 0);
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
                    <p className="text-lg font-bold">{totalReg}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold text-green-600">${totalRev.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
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
                    <p className="text-lg font-bold">{clinic.registrations}</p>
                    <p className="text-xs text-muted-foreground">{clinic.uniqueStudents} unique</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold text-green-600">${clinic.totalRevenue.toFixed(0)}</p>
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
                    <p className="text-lg font-bold text-green-600">
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
    </div>
  );
}
