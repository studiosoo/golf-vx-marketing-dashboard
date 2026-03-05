import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users, MousePointerClick, Eye, ArrowLeft, Calendar, Target } from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function CampaignDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const campaignId = params.id;

  // TODO: Replace with actual tRPC query
  const isLoading = false;
  
  // Mock data - replace with real API data
  const campaign = {
    id: campaignId,
    name: "Junior Golf Summer Camp 2026",
    status: "active",
    objective: "Lead Generation",
    startDate: "2026-01-21",
    endDate: "2026-05-31",
    totalSpend: 224.56,
    impressions: 89234,
    clicks: 1764,
    conversions: 1,
    leads: 587,
    ctr: 1.98,
    cpc: 0.13,
    cpl: 0.38,
    cpa: 224.56,
    dailyBudget: 7.50,
  };

  const performanceData = {
    labels: ["Jan 21", "Jan 28", "Feb 4", "Feb 11", "Feb 18"],
    datasets: [
      {
        label: "Daily Spend",
        data: [6.50, 7.20, 8.10, 7.80, 7.50],
        borderColor: "oklch(0.70 0.20 30)",
        backgroundColor: "oklch(0.70 0.20 30 / 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Leads",
        data: [45, 52, 61, 58, 55],
        borderColor: "oklch(0.65 0.25 142)",
        backgroundColor: "oklch(0.65 0.25 142 / 0.1)",
        fill: true,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const audienceData = {
    labels: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
    datasets: [
      {
        label: "Impressions by Age",
        data: [8234, 24567, 32145, 18923, 4567, 798],
        backgroundColor: [
          "oklch(0.70 0.20 30 / 0.8)",
          "oklch(0.65 0.25 142 / 0.8)",
          "oklch(0.60 0.20 250 / 0.8)",
          "oklch(0.65 0.20 60 / 0.8)",
          "oklch(0.60 0.15 200 / 0.8)",
          "oklch(0.55 0.15 300 / 0.8)",
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: {
          color: "oklch(0.25 0.01 240 / 0.1)",
        },
        ticks: {
          color: "oklch(0.60 0.01 240)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "oklch(0.60 0.01 240)",
        },
      },
      x: {
        grid: {
          color: "oklch(0.25 0.01 240 / 0.1)",
        },
        ticks: {
          color: "oklch(0.60 0.01 240)",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "oklch(0.70 0.01 240)",
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        grid: {
          color: "oklch(0.25 0.01 240 / 0.1)",
        },
        ticks: {
          color: "oklch(0.60 0.01 240)",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "oklch(0.60 0.01 240)",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/meta-ads")}
              className="gap-2 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Meta Ads
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {campaign.name}
              </h1>
              <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                {campaign.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {campaign.objective}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {campaign.startDate} → {campaign.endDate}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Spend</CardDescription>
              <CardTitle className="text-3xl">${campaign.totalSpend.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">${campaign.dailyBudget}/day budget</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Leads Generated</CardDescription>
              <CardTitle className="text-3xl">{campaign.leads}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4 text-[#3DB855]" />
                <span className="text-[#3DB855]">${campaign.cpl.toFixed(2)} per lead</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Click-Through Rate</CardDescription>
              <CardTitle className="text-3xl">{campaign.ctr.toFixed(2)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-[#3DB855]" />
                <span className="text-[#3DB855]">Above average</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Conversions</CardDescription>
              <CardTitle className="text-3xl">{campaign.conversions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-red-500">${campaign.cpa.toFixed(2)} per conversion</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Daily spend and lead generation over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={performanceData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Audience Breakdown */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Audience by Age</CardTitle>
              <CardDescription>Impressions distribution across age groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={audienceData} options={barChartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Optimization suggestions for this campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    ⚠️ High Cost Per Conversion
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                    Your cost per conversion ($224.56) is significantly higher than industry average ($20-50 for lead generation campaigns).
                  </p>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Recommendation: Reduce daily budget to $3-5 and focus on landing page optimization.
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    ✓ Strong Click-Through Rate
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                    Your CTR (1.98%) is above industry average (1-1.5%), indicating effective ad creative.
                  </p>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Recommendation: Keep current ad creative and test variations with similar messaging.
                  </p>
                </div>

                <div className="p-4 bg-[#888888]/10 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    💡 Opportunity: Email Nurture
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    You have 587 leads who haven't converted yet. Set up an email nurture sequence to convert them.
                  </p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Expected outcome: 30-60 additional registrations at $0 cost.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
