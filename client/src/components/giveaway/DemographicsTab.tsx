import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Star, UserCheck } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { CHART_PALETTE } from "./constants";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#DEDEDA] rounded-lg shadow-sm p-2 text-xs">
        <p className="font-semibold text-[#222222]">{label}</p>
        <p className="text-[#888888]">{payload[0].value} applicants</p>
      </div>
    );
  }
  return null;
}

interface StatsData {
  totalApplications?: number;
  ageRangeDistribution?: Record<string, number>;
  genderDistribution?: Record<string, number>;
  cityDistribution?: Record<string, number>;
  golfExperienceDistribution?: Record<string, number>;
  visitedBeforeDistribution?: Record<string, number>;
  howDidTheyHearDistribution?: Record<string, number>;
  indoorGolfFamiliarityDistribution?: Record<string, number>;
  bestTimeToCallDistribution?: Record<string, number>;
  applicationsByDate?: { date: string; count: number }[];
}

interface DemographicsTabProps {
  stats: StatsData | undefined;
}

export function DemographicsTab({ stats }: DemographicsTabProps) {
  const ageData = useMemo(() =>
    Object.entries(stats?.ageRangeDistribution || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    [stats]
  );
  const genderData = useMemo(() =>
    Object.entries(stats?.genderDistribution || {})
      .map(([name, value]) => ({ name, value })),
    [stats]
  );
  const cityData = useMemo(() =>
    Object.entries(stats?.cityDistribution || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    [stats]
  );
  const experienceData = useMemo(() =>
    Object.entries(stats?.golfExperienceDistribution || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    [stats]
  );
  const visitedData = useMemo(() =>
    Object.entries(stats?.visitedBeforeDistribution || {})
      .map(([name, value]) => ({ name, value })),
    [stats]
  );
  const hearData = useMemo(() =>
    Object.entries(stats?.howDidTheyHearDistribution || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    [stats]
  );
  const familiarityData = useMemo(() =>
    Object.entries(stats?.indoorGolfFamiliarityDistribution || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    [stats]
  );
  const callTimeData = useMemo(() =>
    Object.entries(stats?.bestTimeToCallDistribution || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    [stats]
  );
  const timelineData = useMemo(() =>
    (stats?.applicationsByDate || []).map(d => ({
      date: d.date,
      count: d.count,
      label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
    [stats]
  );
  const sourceData = useMemo(() =>
    Object.entries(stats?.howDidTheyHearDistribution || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    [stats]
  );

  return (
    <div className="space-y-4">
      {/* Timeline: Applications Per Day */}
      {timelineData.length > 0 && (
        <Card className="border border-[#DEDEDA] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#222222]">Applications Per Day</CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">Daily submission count over the campaign period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timelineData} margin={{ left: 4, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#AAAAAA" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: "#AAAAAA" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {timelineData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#545A60" : "#888888"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Row 1: Age + Gender */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-[#DEDEDA] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#222222]">Age Distribution</CardTitle>
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
                    <Cell key={i} fill={i === 0 ? "#F2DD48" : i === 1 ? "#545A60" : CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-[#DEDEDA] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#222222]">Gender Distribution</CardTitle>
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
                  label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#545A60" : i === 1 ? "#F2DD48" : CHART_PALETTE[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} applicants`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-1">
              {genderData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-[#545A60]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === 0 ? "#545A60" : i === 1 ? "#F2DD48" : CHART_PALETTE[i] }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: City + Visited Before */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-[#DEDEDA] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#222222] flex items-center gap-1.5">
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
                    <Cell key={i} fill={i === 0 ? "#F2DD48" : i < 3 ? "#545A60" : "#888888"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-[#DEDEDA] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#222222] flex items-center gap-1.5">
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
                  label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {visitedData.map((entry, i) => {
                    const v = entry.name.toLowerCase();
                    const color = v === "yes" || v === "existing" ? "#72B84A"
                      : v === "no" || v === "new" ? "#545A60"
                      : "#AAAAAA";
                    return <Cell key={i} fill={color} />;
                  })}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} applicants`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {visitedData.map((d, i) => {
                const v = d.name.toLowerCase();
                const color = v === "yes" || v === "existing" ? "#72B84A" : v === "no" || v === "new" ? "#545A60" : "#AAAAAA";
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
        <Card className="border border-[#DEDEDA] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#222222] flex items-center gap-1.5">
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
                    <Cell key={i} fill={i === 0 ? "#545A60" : i === 1 ? "#888888" : i === 2 ? "#F2DD48" : "#AAAAAA"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-[#DEDEDA] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#222222]">Indoor Golf Familiarity</CardTitle>
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
                  <div className="h-1.5 bg-[#F1F1EF] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(d.value / (stats?.totalApplications || 1)) * 100}%`,
                        backgroundColor: i === 0 ? "#545A60" : i === 1 ? "#888888" : i === 2 ? "#F2DD48" : "#AAAAAA"
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
        <Card className="border border-[#DEDEDA] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#222222]">Source Breakdown</CardTitle>
            <CardDescription className="text-xs text-[#AAAAAA]">How applicants heard about the giveaway (top 8)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sourceData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#AAAAAA" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#545A60" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#F2DD48" : i === 1 ? "#545A60" : i < 4 ? "#888888" : "#AAAAAA"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-[#DEDEDA] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#222222]">Best Time to Call</CardTitle>
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
