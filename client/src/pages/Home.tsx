import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Target, DollarSign, BarChart3, Loader2, ChevronRight, RefreshCw, Users, Sparkles, Share2, Wallet } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: categories, isLoading } = trpc.campaigns.getCategorySummary.useQuery();
  const syncMutation = trpc.autonomous.syncAllData.useMutation();
  const utils = trpc.useUtils();

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      utils.invalidate();
      alert("All marketing data synced successfully!");
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Calculate totals from categories
  const totalSpend = categories?.reduce((sum, c) => sum + c.totalSpend, 0) ?? 0;
  const totalBudget = categories?.reduce((sum, c) => sum + c.totalBudget, 0) ?? 0;
  const totalActiveCampaigns = categories?.reduce((sum, c) => sum + c.activeCampaigns, 0) ?? 0;
  const totalCompletedCampaigns = categories?.reduce((sum, c) => sum + c.completedCampaigns, 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Marketing <span className="text-primary">HQ</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Golf VX Arlington Heights — Campaign Command Center
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync All Data'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Programs</p>
                  <p className="text-2xl font-bold">{totalActiveCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{totalCompletedCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSpend)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/marketing-intelligence">
            <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg mt-3">Marketing Intelligence</CardTitle>
                <CardDescription>AI-powered campaign analysis, auto-optimization, and approval queue</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/programs">
            <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg mt-3">Programs</CardTitle>
                <CardDescription>
                  {totalActiveCampaigns} active, {totalCompletedCampaigns} completed — manage all marketing programs
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/meta-ads">
            <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg mt-3">Meta Ads</CardTitle>
                <CardDescription>Live campaign performance, spend tracking, and optimization insights</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/members">
            <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg mt-3">Members</CardTitle>
                <CardDescription>Member database, Acuity bookings, Boomerang loyalty, and email captures</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/budget">
            <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-orange-600" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg mt-3">Budget Manager</CardTitle>
                <CardDescription>Track expenses, allocate budgets, and monitor spend across all programs</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/strategic-campaigns">
            <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-red-600" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg mt-3">Strategic Campaigns</CardTitle>
                <CardDescription>Category-level performance view aligned with Asana Marketing Timeline</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
