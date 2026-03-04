import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, RefreshCw, TrendingUp, Users, DollarSign, Target, Mail,
  CheckCircle2, AlertCircle, FileText, Copy, UserCheck, UserX,
  Sparkles, ChevronDown, ChevronUp, BarChart2, MapPin, Star, Zap, Building2
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useToast } from "@/hooks/use-toast";

// Golf VX style palette — gray-tones + accent colors from design guide
const GVX_COLORS = {
  yellow: "#F5C72C",
  black: "#111111",
  charcoal: "#545A60",
  gray600: "#888888",
  gray400: "#AAAAAA",
  gray200: "#E0E0E0",
  gray100: "#F2F2F7",
  green: "#3DB855",
  greenBg: "#E8F5EB",
  blue: "#007AFF",
};

// Palette for charts — using Golf VX gray-tones + accent colors
const CHART_PALETTE = [
  "#545A60", "#888888", "#F5C72C", "#AAAAAA", "#3DB855",
  "#007AFF", "#C0C0C8", "#2C2C2C", "#D4A017", "#6B7280"
];

// Funnel steps from ClickFunnels screenshot
const FUNNEL_STEPS = [
  { label: "Entry Page", allViews: 998, uniqueViews: 875, optIns: 4, optInRate: "0.46%" },
  { label: "Application Page", allViews: 252, uniqueViews: 187, optIns: 88, optInRate: "47.06%" },
  { label: "Offer | Swing Saver", allViews: 175, uniqueViews: 118, optIns: 0, optInRate: "0.00%" },
];

function StatCard({ title, value, sub, icon: Icon, accent }: {
  title: string; value: string | number; sub: string; icon: any; accent?: boolean;
}) {
  return (
    <Card className="border border-[#E0E0E0] shadow-none hover:shadow-sm transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#888888]">{title}</CardTitle>
        <Icon className="h-4 w-4 text-[#AAAAAA]" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tracking-tight ${accent ? "text-[#F5C72C]" : "text-[#111111]"}`}>{value}</div>
        <p className="text-xs text-[#AAAAAA] mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value, max, label, color = "#F5C72C" }: { value: number; max: number; label?: string; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-xs text-[#888888]"><span>{label}</span><span>{value} / {max}</span></div>}
      <div className="h-2 bg-[#F2F2F7] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="text-xs text-[#AAAAAA] text-right">{pct.toFixed(1)}%</div>
    </div>
  );
}

function DemographicsTab({ stats }: { stats: any }) {
  const ageData = useMemo(() =>
    Object.entries(stats?.ageRangeDistribution || {})
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value),
    [stats]
  );
  const genderData = useMemo(() =>
    Object.entries(stats?.genderDistribution || {})
      .map(([name, value]) => ({ name, value: value as number })),
    [stats]
  );
  const cityData = useMemo(() =>
    Object.entries(stats?.cityDistribution || {})
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    [stats]
  );
  const experienceData = useMemo(() =>
    Object.entries(stats?.golfExperienceDistribution || {})
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value),
    [stats]
  );
  const visitedData = useMemo(() =>
    Object.entries(stats?.visitedBeforeDistribution || {})
      .map(([name, value]) => ({ name, value: value as number })),
    [stats]
  );
  const hearData = useMemo(() =>
    Object.entries(stats?.howDidTheyHearDistribution || {})
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value),
    [stats]
  );
  const familiarityData = useMemo(() =>
    Object.entries(stats?.indoorGolfFamiliarityDistribution || {})
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value),
    [stats]
  );
  const callTimeData = useMemo(() =>
    Object.entries(stats?.bestTimeToCallDistribution || {})
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value),
    [stats]
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E0E0E0] rounded-lg shadow-sm p-2 text-xs">
          <p className="font-semibold text-[#111111]">{label}</p>
          <p className="text-[#888888]">{payload[0].value} applicants</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Age + Gender */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-[#E0E0E0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111111]">Age Distribution</CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">Applicants by age group</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ageData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#AAAAAA" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#545A60" }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {ageData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#F5C72C" : i === 1 ? "#545A60" : CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-[#E0E0E0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111111]">Gender Distribution</CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">Applicants by gender</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#545A60" : i === 1 ? "#F5C72C" : CHART_PALETTE[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} applicants`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-1">
              {genderData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-[#545A60]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === 0 ? "#545A60" : i === 1 ? "#F5C72C" : CHART_PALETTE[i] }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: City + Visited Before */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-[#E0E0E0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#AAAAAA]" /> City Distribution
            </CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">Top 10 cities</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cityData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#AAAAAA" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#545A60" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#545A60" radius={[0, 4, 4, 0]}>
                  {cityData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#F5C72C" : i < 3 ? "#545A60" : "#888888"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-[#E0E0E0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-[#AAAAAA]" /> Visited Golf VX Before
            </CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">Prior venue experience</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={visitedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {visitedData.map((entry, i) => {
                    const v = entry.name.toLowerCase();
                    const color = v === 'yes' || v === 'existing' ? "#3DB855"
                      : v === 'no' || v === 'new' ? "#545A60"
                      : "#AAAAAA";
                    return <Cell key={i} fill={color} />;
                  })}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} applicants`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {visitedData.map((d, i) => {
                const v = d.name.toLowerCase();
                const color = v === 'yes' || v === 'existing' ? "#3DB855" : v === 'no' || v === 'new' ? "#545A60" : "#AAAAAA";
                return (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-[#545A60]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {d.name}: {d.value}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Golf Experience + Indoor Golf Familiarity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-[#E0E0E0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[#AAAAAA]" /> Golf Experience Level
            </CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">Self-reported skill level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={experienceData} margin={{ left: 4, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#545A60" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#AAAAAA" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {experienceData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#545A60" : i === 1 ? "#888888" : i === 2 ? "#F5C72C" : "#AAAAAA"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-[#E0E0E0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111111]">Indoor Golf Familiarity</CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">Experience with indoor simulators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 pt-2">
              {familiarityData.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#545A60] font-medium truncate max-w-[60%]">{d.name}</span>
                    <span className="text-[#AAAAAA]">{d.value}</span>
                  </div>
                  <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(d.value / (stats?.totalApplications || 1)) * 100}%`,
                        backgroundColor: i === 0 ? "#545A60" : i === 1 ? "#888888" : i === 2 ? "#F5C72C" : "#AAAAAA"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: How Did They Hear + Best Time to Call */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-[#E0E0E0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111111]">How Did They Hear</CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">Acquisition source breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 pt-2">
              {hearData.slice(0, 8).map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#545A60] font-medium truncate max-w-[65%]">{d.name}</span>
                    <span className="text-[#AAAAAA]">{d.value}</span>
                  </div>
                  <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(d.value / (stats?.totalApplications || 1)) * 100}%`,
                        backgroundColor: i === 0 ? "#F5C72C" : i === 1 ? "#545A60" : i === 2 ? "#888888" : "#AAAAAA"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#E0E0E0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111111]">Best Time to Call</CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">Preferred contact window</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={callTimeData} margin={{ left: 4, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#545A60" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#AAAAAA" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#888888" radius={[4, 4, 0, 0]}>
                  {callTimeData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#545A60" : "#888888"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AIIntelligenceTab({ programId }: { programId?: number }) {
  const [insights, setInsights] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("keyInsights");
  const { toast } = useToast();

  const generateMutation = trpc.giveaway.generateProgramInsights.useMutation({
    onSuccess: (data) => {
      setInsights(data);
      toast({ title: "AI Analysis Complete", description: "Marketing intelligence report generated." });
    },
    onError: (err) => {
      toast({ title: "Analysis Failed", description: err.message, variant: "destructive" });
    },
  });

  const priorityColor = (p: string) =>
    p === "high" ? "bg-[#2C2C2C] text-white" : p === "medium" ? "bg-[#545A60] text-white" : "bg-[#F2F2F7] text-[#888888]";

  const channelIcon = (ch: string) => {
    const c = ch.toLowerCase();
    if (c.includes("meta") || c.includes("facebook") || c.includes("instagram")) return "📱";
    if (c.includes("email")) return "✉️";
    if (c.includes("sms") || c.includes("text")) return "💬";
    if (c.includes("venue") || c.includes("in-person")) return "🏌️";
    if (c.includes("partner")) return "🤝";
    if (c.includes("content") || c.includes("social")) return "📸";
    return "📣";
  };

  const toggle = (key: string) => setExpandedSection(prev => prev === key ? null : key);

  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#F2F2F7] flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-[#AAAAAA]" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-semibold text-[#111111]">AI Marketing Intelligence</p>
          <p className="text-sm text-[#888888] max-w-sm">
            Analyze your applicant demographics and generate a comprehensive multi-channel marketing strategy.
          </p>
        </div>
        <Button
          onClick={() => generateMutation.mutate({ programId })}
          disabled={generateMutation.isPending}
          className="bg-[#F5C72C] hover:bg-[#e6b820] text-[#111111] font-semibold"
        >
          {generateMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />Generate Marketing Intelligence</>
          )}
        </Button>
        {generateMutation.isPending && (
          <p className="text-xs text-[#AAAAAA]">This may take 15–30 seconds...</p>
        )}
      </div>
    );
  }

  const { insights: data, stats } = insights;

  return (
    <div className="space-y-4">
      {/* Header + Regenerate */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#111111]">Marketing Intelligence Report</h3>
          <p className="text-xs text-[#AAAAAA] mt-0.5">
            Generated {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : "just now"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateMutation.mutate({ programId })}
          disabled={generateMutation.isPending}
          className="border-[#E0E0E0] text-[#545A60] hover:bg-[#F2F2F7]"
        >
          {generateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          <span className="ml-1.5 text-xs">Refresh</span>
        </Button>
      </div>

      {/* Executive Summary */}
      <Card className="border border-[#E0E0E0] shadow-none bg-[#F2F2F7]">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-[#111111] leading-relaxed">{data.executiveSummary}</p>
          {stats && (
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-[#111111]">{stats.total}</div>
                <div className="text-xs text-[#AAAAAA]">Entries</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#F5C72C]">{stats.progressPct}%</div>
                <div className="text-xs text-[#AAAAAA]">of Goal</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#111111]">{stats.entryGoal}</div>
                <div className="text-xs text-[#AAAAAA]">Target</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chicago Opportunity — highlighted callout */}
      {data.chicagoOpportunity && (
        <Card className="border-2 border-[#F5C72C] shadow-none bg-[#FFFDF0]">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("chicago")}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#F5C72C]" /> Chicago City Opportunity
                <span className="text-[10px] font-semibold bg-[#F5C72C] text-[#111111] px-2 py-0.5 rounded-full">Untapped Market</span>
              </CardTitle>
              {expandedSection === "chicago" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
            </div>
          </CardHeader>
          {expandedSection === "chicago" && (
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-[#545A60] leading-relaxed">{data.chicagoOpportunity.summary}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Target Neighborhoods</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(data.chicagoOpportunity.targetNeighborhoods || []).map((n: string, i: number) => (
                      <span key={i} className="text-xs bg-[#F5C72C]/20 text-[#8B6E00] px-2 py-0.5 rounded font-medium">{n}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Target Demographic</p>
                  <p className="text-xs text-[#545A60]">{data.chicagoOpportunity.targetDemographic}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 rounded-lg bg-white border border-[#F5C72C]/30">
                  <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-1">Ad Strategy</p>
                  <p className="text-xs text-[#545A60]">{data.chicagoOpportunity.adStrategy}</p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-[#F5C72C]/30">
                  <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-1">Messaging Angle</p>
                  <p className="text-xs text-[#545A60]">{data.chicagoOpportunity.messagingAngle}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Key Insights */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardHeader
          className="pb-2 cursor-pointer"
          onClick={() => toggle("keyInsights")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#F5C72C]" /> Key Insights
            </CardTitle>
            {expandedSection === "keyInsights" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expandedSection === "keyInsights" && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {(data.keyInsights || []).map((item: any, i: number) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-[#F2F2F7]">
                  <Badge className={`${priorityColor(item.priority)} text-xs shrink-0 h-5 mt-0.5`}>{item.priority}</Badge>
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{item.insight}</p>
                    <p className="text-xs text-[#888888] mt-0.5">{item.implication}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Meta Ads Strategy */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("metaAds")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              📱 Meta Ads Strategy
            </CardTitle>
            {expandedSection === "metaAds" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expandedSection === "metaAds" && (
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Audience", items: data.metaAdsStrategy?.audienceRecommendations },
                { label: "Creative", items: data.metaAdsStrategy?.creativeRecommendations },
                { label: "Budget", items: data.metaAdsStrategy?.budgetRecommendations },
              ].map(({ label, items }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">{label}</p>
                  <ul className="space-y-1.5">
                    {(items || []).map((item: string, i: number) => (
                      <li key={i} className="flex gap-2 text-xs text-[#545A60]">
                        <span className="text-[#F5C72C] shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Multi-Channel Strategy */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("multiChannel")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              📣 Multi-Channel Strategy
            </CardTitle>
            {expandedSection === "multiChannel" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expandedSection === "multiChannel" && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {(data.multiChannelStrategy || []).map((ch: any, i: number) => (
                <div key={i} className="border border-[#E0E0E0] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{channelIcon(ch.channel)}</span>
                      <span className="font-semibold text-sm text-[#111111]">{ch.channel}</span>
                    </div>
                    <Badge className={`${priorityColor(ch.priority)} text-xs`}>{ch.priority}</Badge>
                  </div>
                  <p className="text-xs text-[#888888] mb-2">{ch.strategy}</p>
                  <ul className="space-y-1">
                    {(ch.tactics || []).map((t: string, j: number) => (
                      <li key={j} className="flex gap-2 text-xs text-[#545A60]">
                        <span className="text-[#AAAAAA] shrink-0">→</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Content Strategy */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("content")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              📸 Content Strategy
            </CardTitle>
            {expandedSection === "content" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expandedSection === "content" && (
          <CardContent className="pt-0 space-y-3">
            <div>
              <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Core Messaging</p>
              <p className="text-sm text-[#545A60]">{data.contentStrategy?.messaging}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {(data.contentStrategy?.themes || []).map((t: string, i: number) => (
                    <span key={i} className="text-xs bg-[#F2F2F7] text-[#545A60] px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-2">Formats</p>
                <div className="flex flex-wrap gap-1.5">
                  {(data.contentStrategy?.formats || []).map((f: string, i: number) => (
                    <span key={i} className="text-xs bg-[#F2F2F7] text-[#545A60] px-2 py-0.5 rounded">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 7-Day Action Plan */}
      <Card className="border border-[#E0E0E0] shadow-none">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle("sevenDay")}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              📅 7-Day Action Plan
            </CardTitle>
            {expandedSection === "sevenDay" ? <ChevronUp className="h-4 w-4 text-[#AAAAAA]" /> : <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />}
          </div>
        </CardHeader>
        {expandedSection === "sevenDay" && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {(data.sevenDayPlan || []).map((day: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="w-16 shrink-0">
                    <span className="text-xs font-semibold text-[#AAAAAA]">{day.day}</span>
                  </div>
                  <ul className="space-y-1 flex-1">
                    {(day.actions || []).map((a: string, j: number) => (
                      <li key={j} className="flex gap-2 text-xs text-[#545A60]">
                        <span className="text-[#F5C72C] shrink-0">✓</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function AnnualGiveaway() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: applications, isLoading: loadingApps, refetch: refetchApps } = trpc.giveaway.getApplications.useQuery(undefined, { refetchInterval: 30000 });
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = trpc.giveaway.getStats.useQuery(undefined, { refetchInterval: 30000 });
  const { data: lastSyncInfo } = trpc.giveaway.getLastSyncInfo.useQuery(undefined, { refetchInterval: 30000 });
  const { data: conversions } = trpc.giveaway.getConversions.useQuery(undefined, { refetchInterval: 60000 });

  const syncMutation = trpc.giveaway.sync.useMutation({
    onSuccess: () => { refetchApps(); refetchStats(); toast({ title: "Synced", description: "Data refreshed from Google Sheets." }); },
  });

  const enchargeSync = trpc.giveaway.syncToEncharge.useMutation({
    onSuccess: (data) => {
      toast({ title: "Encharge Sync Complete", description: `${data.synced} synced, ${data.errors} failed` });
      setSelectedIds(new Set());
    },
    onError: (err) => toast({ title: "Sync Failed", description: err.message, variant: "destructive" }),
  });

  const updateStatusMutation = trpc.giveaway.updateStatus.useMutation({
    onSuccess: () => refetchApps(),
  });

  const [emailDraftModal, setEmailDraftModal] = useState<{ open: boolean; applicantId: number | null; draft: any | null }>({ open: false, applicantId: null, draft: null });
  const [visitHistoryModal, setVisitHistoryModal] = useState<{ open: boolean; applicantId: number | null }>({ open: false, applicantId: null });

  const generateEmailDraft = trpc.giveaway.generateEmailDraft.useMutation({
    onSuccess: (draft) => setEmailDraftModal(prev => ({ ...prev, draft })),
    onError: (err) => toast({ title: 'Draft generation failed', description: err.message, variant: 'destructive' }),
  });

  const { data: visitHistory } = trpc.giveaway.checkVisitHistory.useQuery(
    { applicantId: visitHistoryModal.applicantId! },
    { enabled: visitHistoryModal.open && visitHistoryModal.applicantId !== null }
  );

  const filteredApplications = applications?.filter(app => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.city || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalApplications = stats?.totalApplications || 0;
  const ENTRY_GOAL = 250;    // Application target goal
  const LONG_FORM_GOAL = 250; // Long-form application goal
  const totalSpend = 467.59;
  const costPerSubmission = totalApplications > 0 ? (totalSpend / totalApplications).toFixed(2) : "0.00";
  const entryPageUV = 875;
  const funnelConversionRate = entryPageUV > 0 ? ((totalApplications / entryPageUV) * 100).toFixed(1) : "0.0";

  // Program health
  const entryProgress = (totalApplications / ENTRY_GOAL) * 100;
  const longFormProgress = (totalApplications / LONG_FORM_GOAL) * 100;
  const healthStatus = entryProgress >= 80 ? "on_track" : entryProgress >= 40 ? "behind" : "critical";
  const healthColor = healthStatus === "on_track" ? "#3DB855" : healthStatus === "behind" ? "#F5C72C" : "#888888";
  const healthLabel = healthStatus === "on_track" ? "On Track" : healthStatus === "behind" ? "Behind" : "Critical";

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  if (loadingApps || loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#AAAAAA]" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">Annual Membership Giveaway</h1>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${healthColor}20`, color: healthColor }}
              >
                {healthLabel}
              </span>
            </div>
            <p className="text-sm text-[#888888] mt-1">
              2026 Lead Generation Campaign
              {lastSyncInfo && <span className="ml-2 text-xs text-[#AAAAAA]">• Syncs 3× daily</span>}
            </p>
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            size="sm"
            className="bg-[#F5C72C] hover:bg-[#e6b820] text-[#111111] font-semibold"
          >
            {syncMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Syncing...</> : <><RefreshCw className="mr-2 h-4 w-4" />Refresh Data</>}
          </Button>
        </div>

        {/* Goal Progress */}
        <Card className="border border-[#E0E0E0] shadow-none">
          <CardContent className="pt-4 pb-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ProgressBar value={entryPageUV} max={ENTRY_GOAL} label="Entry Goal (Short-Form)" color="#F5C72C" />
              <ProgressBar value={totalApplications} max={LONG_FORM_GOAL} label="Application Goal (Long-Form)" color="#545A60" />
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard title="Applications (Long-Form)" value={totalApplications} sub={`Goal: ${LONG_FORM_GOAL} • ${Math.max(0, LONG_FORM_GOAL - totalApplications)} remaining`} icon={Users} />
          <StatCard title="Entry Page UV" value={entryPageUV} sub={`Goal: ${ENTRY_GOAL} entries • ${Math.max(0, ENTRY_GOAL - entryPageUV)} remaining`} icon={Target} accent />
          <StatCard title="Funnel Conversion" value={`${funnelConversionRate}%`} sub={`${totalApplications} long-form / ${entryPageUV} entry UV`} icon={TrendingUp} />
          <StatCard title="Cost per Application" value={`$${costPerSubmission}`} sub={`$${totalSpend.toFixed(2)} total ad spend`} icon={DollarSign} />
        </div>

        {/* Bottom Funnel Conversion */}
        <Card className="border border-[#E0E0E0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#F5C72C]" />
              Bottom Funnel Conversion
            </CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">
              Giveaway applicants who booked $9 Trial or Drive Day — matched by email via Acuity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-[#F2F2F7] rounded-lg">
                <div className="text-2xl font-bold text-[#111111]">{conversions?.total ?? 0}</div>
                <div className="text-xs text-[#888888] mt-0.5">Total Converted</div>
                <div className="text-xs text-[#AAAAAA] mt-0.5">{conversions && totalApplications > 0 ? ((conversions.total / totalApplications) * 100).toFixed(1) : '0.0'}% of applicants</div>
              </div>
              <div className="text-center p-3 bg-[#F2F2F7] rounded-lg">
                <div className="text-2xl font-bold text-[#545A60]">{conversions?.trialCount ?? 0}</div>
                <div className="text-xs text-[#888888] mt-0.5">$9 Trial</div>
                <div className="text-xs text-[#AAAAAA] mt-0.5">Anniversary Trial Sessions</div>
              </div>
              <div className="text-center p-3 bg-[#F2F2F7] rounded-lg">
                <div className="text-2xl font-bold text-[#545A60]">{conversions?.driveDayCount ?? 0}</div>
                <div className="text-xs text-[#888888] mt-0.5">Drive Day</div>
                <div className="text-xs text-[#AAAAAA] mt-0.5">Clinic bookings</div>
              </div>
            </div>
            {conversions && conversions.conversions.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-[#888888] mb-2">Converted Applicants</div>
                {conversions.conversions.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-[#F9F9F9] rounded text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#3DB855]" />
                      <span className="font-medium text-[#111111]">{c.applicantName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        c.conversionType === 'trial' ? 'bg-[#F5C72C]/20 text-[#8B6E00]' : 'bg-[#007AFF]/10 text-[#007AFF]'
                      }`}>
                        {c.conversionType === 'trial' ? '$9 Trial' : 'Drive Day'}
                      </span>
                      {c.appointmentDate && (
                        <span className="text-[#AAAAAA]">{new Date(c.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(!conversions || conversions.total === 0) && (
              <div className="text-center py-4 text-xs text-[#AAAAAA]">
                No conversions tracked yet — conversions appear when applicants book via Acuity
              </div>
            )}
          </CardContent>
        </Card>

        {/* ClickFunnels Funnel Steps */}
        <Card className="border border-[#E0E0E0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111111]">Funnel Analytics — Annual Membership Giveaway | Q1 2026</CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">ClickFunnels data (02/02/2026 – 03/03/2026)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E0E0E0]">
                    <th className="text-left py-2 text-[#AAAAAA] font-medium">Funnel Step</th>
                    <th className="text-right py-2 text-[#AAAAAA] font-medium">All Views</th>
                    <th className="text-right py-2 text-[#AAAAAA] font-medium">Unique Views</th>
                    <th className="text-right py-2 text-[#AAAAAA] font-medium">Opt-ins</th>
                    <th className="text-right py-2 text-[#AAAAAA] font-medium">Opt-in Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {FUNNEL_STEPS.map((step, i) => (
                    <tr key={i} className="border-b border-[#F0F0F0]">
                      <td className="py-2.5 font-medium text-[#111111]">{step.label}</td>
                      <td className="py-2.5 text-right text-[#545A60]">{step.allViews.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-[#545A60]">{step.uniqueViews.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-[#545A60]">{step.optIns}</td>
                      <td className="py-2.5 text-right">
                        <span className={`font-semibold ${parseFloat(step.optInRate) > 10 ? "text-[#3DB855]" : "text-[#888888]"}`}>
                          {step.optInRate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI Intelligence Standalone Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[#111111]">Campaign Analysis</div>
          <button
            onClick={() => {
              const el = document.getElementById('giveaway-ai-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #F5C72C 0%, #e6b820 100%)', color: '#111111', boxShadow: '0 2px 8px rgba(245,199,44,0.4)' }}
          >
            <Sparkles className="h-4 w-4" />
            AI Intelligence
          </button>
        </div>

        {/* Tabs: Demographics / Applications */}
        <Tabs defaultValue="demographics" className="space-y-4">
          <TabsList className="bg-[#F2F2F7] border border-[#E0E0E0]">
            <TabsTrigger value="demographics" className="data-[state=active]:bg-white data-[state=active]:text-[#111111] data-[state=active]:shadow-none text-[#888888]">
              Demographics
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-white data-[state=active]:text-[#111111] data-[state=active]:shadow-none text-[#888888]">
              Applications ({totalApplications})
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Demographics ── */}
          <TabsContent value="demographics">
            <DemographicsTab stats={stats} />
          </TabsContent>

          {/* ── Tab 2: Applications ── */}
          <TabsContent value="applications">
            <Card className="border border-[#E0E0E0] shadow-none">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-[#111111]">Applications</CardTitle>
                    <CardDescription className="text-[#AAAAAA]">Manage and track all giveaway submissions</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Input
                      placeholder="Search name, email, city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-48 border-[#E0E0E0] text-sm"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-36 border-[#E0E0E0] text-sm">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-[#F2F2F7] rounded-lg">
                    <span className="text-xs text-[#545A60]">{selectedIds.size} selected</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-[#E0E0E0]"
                      onClick={() => enchargeSync.mutate({ applicantIds: Array.from(selectedIds), tags: ["giveaway-2026"] })}
                      disabled={enchargeSync.isPending}
                    >
                      {enchargeSync.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                      <span className="ml-1">Sync to Encharge</span>
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-[#888888]" onClick={() => setSelectedIds(new Set())}>
                      Clear
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-[#E0E0E0]">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedIds.size === (filteredApplications?.length || 0) && (filteredApplications?.length || 0) > 0}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedIds(new Set(filteredApplications?.map(a => a.id) || []));
                              else setSelectedIds(new Set());
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-[#AAAAAA] text-xs">Name</TableHead>
                        <TableHead className="hidden md:table-cell text-[#AAAAAA] text-xs">Email</TableHead>
                        <TableHead className="hidden lg:table-cell text-[#AAAAAA] text-xs">City</TableHead>
                        <TableHead className="hidden md:table-cell text-[#AAAAAA] text-xs">Age</TableHead>
                        <TableHead className="hidden lg:table-cell text-[#AAAAAA] text-xs">Experience</TableHead>
                        <TableHead className="text-[#AAAAAA] text-xs">Status</TableHead>
                        <TableHead className="text-[#AAAAAA] text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(filteredApplications || []).map((app) => (
                        <TableRow key={app.id} className={`border-b border-[#F0F0F0] ${selectedIds.has(app.id) ? "bg-[#F5C72C]/5" : "hover:bg-[#F2F2F7]"}`}>
                          <TableCell>
                            <Checkbox checked={selectedIds.has(app.id)} onCheckedChange={() => toggleSelect(app.id)} />
                          </TableCell>
                          <TableCell className="font-medium text-sm text-[#111111]">
                            {app.name}
                            <span className="block md:hidden text-xs text-[#AAAAAA]">{app.email}</span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-[#545A60]">{app.email}</TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-[#545A60]">{app.city || "—"}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-[#545A60]">{app.ageRange || "—"}</TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-[#545A60]">{app.golfExperienceLevel || "—"}</TableCell>
                          <TableCell>
                            <Select
                              value={app.status || "pending"}
                              onValueChange={(val) => updateStatusMutation.mutate({ id: app.id, status: val as any })}
                            >
                              <SelectTrigger className="h-7 w-28 text-xs border-[#E0E0E0]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Converted</SelectItem>
                                <SelectItem value="declined">Declined</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-[#AAAAAA] hover:text-[#111111]"
                                title="Generate email draft"
                                onClick={() => {
                                  setEmailDraftModal({ open: true, applicantId: app.id, draft: null });
                                  generateEmailDraft.mutate({ applicantId: app.id });
                                }}
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-[#AAAAAA] hover:text-[#111111]"
                                title="Check visit history"
                                onClick={() => setVisitHistoryModal({ open: true, applicantId: app.id })}
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(filteredApplications?.length || 0) === 0 && (
                    <div className="text-center py-8 text-[#AAAAAA] text-sm">No applications found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* ── AI Intelligence Section (standalone) ── */}
        <div id="giveaway-ai-section" className="border-2 rounded-xl p-1" style={{ borderColor: '#F5C72C', background: 'linear-gradient(135deg, rgba(245,199,44,0.05) 0%, rgba(245,199,44,0.02) 100%)' }}>
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <Sparkles className="h-5 w-5" style={{ color: '#F5C72C' }} />
            <span className="text-base font-bold text-[#111111]">AI Intelligence</span>
            <span className="text-xs text-[#888888] ml-1">— Powered by Golf VX Marketing Engine</span>
          </div>
          <div className="px-1 pb-1">
            <AIIntelligenceTab programId={5} />
          </div>
        </div>
      </div>

      {/* Email Draft Modal */}
      <Dialog open={emailDraftModal.open} onOpenChange={(open) => setEmailDraftModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#111111]">
              <FileText className="h-5 w-5 text-[#F5C72C]" />
              AI Email Draft
            </DialogTitle>
          </DialogHeader>
          {generateEmailDraft.isPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#F5C72C]" />
              <span className="ml-3 text-[#888888] text-sm">Generating personalized email draft...</span>
            </div>
          ) : emailDraftModal.draft ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#E0E0E0] p-4 space-y-3">
                {emailDraftModal.draft?.draft?.emails?.[0] ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-1">Subject Line</p>
                      <p className="font-medium text-[#111111]">{emailDraftModal.draft.draft.emails[0].subject}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-1">Body</p>
                      <div className="bg-[#F2F2F7] rounded p-3 text-sm text-[#545A60] whitespace-pre-wrap">{emailDraftModal.draft.draft.emails[0].body}</div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#AAAAAA] uppercase tracking-wide mb-1">Call to Action</p>
                      <p className="text-sm font-medium text-[#F5C72C]">{emailDraftModal.draft.draft.emails[0].callToAction}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#888888]">No draft available.</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" className="border-[#E0E0E0] text-[#545A60]" onClick={() => {
                  const e = emailDraftModal.draft?.draft?.emails?.[0];
                  if (e) { navigator.clipboard.writeText(`Subject: ${e.subject}\n\n${e.body}\n\nCTA: ${e.callToAction}`); toast({ title: "Copied!" }); }
                }}>
                  <Copy className="h-4 w-4 mr-2" /> Copy Email
                </Button>
                <Button className="bg-[#F5C72C] hover:bg-[#e6b820] text-[#111111]" onClick={() => setEmailDraftModal({ open: false, applicantId: null, draft: null })}>Done</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Visit History Modal */}
      <Dialog open={visitHistoryModal.open} onOpenChange={(open) => setVisitHistoryModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#111111]">
              <UserCheck className="h-5 w-5 text-[#F5C72C]" /> Visit History
            </DialogTitle>
          </DialogHeader>
          {visitHistory ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border border-[#E0E0E0]">
                {visitHistory.hasVisited ? (
                  <UserCheck className="h-8 w-8 text-[#3DB855]" />
                ) : (
                  <UserX className="h-8 w-8 text-[#AAAAAA]" />
                )}
                <div>
                  <p className="font-semibold text-[#111111]">{visitHistory.hasVisited ? "Has visited Golf VX" : "New to Golf VX"}</p>
                  {visitHistory.visitCount > 0 && <p className="text-sm text-[#888888]">{visitHistory.visitCount} visits recorded</p>}
                  {visitHistory.lastVisit && <p className="text-xs text-[#AAAAAA]">Last: {new Date(visitHistory.lastVisit).toLocaleDateString()}</p>}
                  <p className="text-xs text-[#AAAAAA] mt-1">Self-reported: {visitHistory.selfReported}</p>
                </div>
              </div>
              {visitHistory.memberStatus && (
                <div className="p-3 bg-[#E8F5EB] rounded-lg">
                  <p className="text-sm font-medium text-[#3DB855]">Active Member</p>
                  <p className="text-xs text-[#3DB855]">{visitHistory.memberTier}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#AAAAAA]" /></div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
