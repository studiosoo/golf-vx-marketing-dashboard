import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, ArrowLeft, DollarSign, BarChart3, Target, Calendar, Loader2, Image as ImageIcon, Users } from "lucide-react";
import { ROASBadge } from "@/components/ROASBadge";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type CategoryId = "trial_conversion" | "membership_acquisition" | "member_retention" | "corporate_events";

const categoryInfo: Record<CategoryId, { name: string; description: string; color: string }> = {
  trial_conversion: {
    name: "Trial Conversion Campaign",
    description: "Converting prospects to members",
    color: "oklch(0.65 0.25 142)",
  },
  membership_acquisition: {
    name: "Membership Acquisition Campaign",
    description: "Annual and monthly membership giveaways",
    color: "oklch(0.70 0.20 30)",
  },
  member_retention: {
    name: "Member Retention + Community Flywheel",
    description: "Drive days, tournaments, and member engagement",
    color: "oklch(0.60 0.20 250)",
  },
  corporate_events: {
    name: "Corporate Events & B2B Sales Campaign",
    description: "Corporate bookings and B2B partnerships",
    color: "oklch(0.65 0.20 60)",
  },
};

export default function CategoryDetail() {
  const params = useParams();
  const categoryId = params.id as CategoryId;
  const category = categoryInfo[categoryId];

  const { data: campaigns, isLoading } = trpc.campaigns.getByCategory.useQuery({ category: categoryId });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/10 text-[#3DB855] dark:text-[#3DB855] border-green-500/20",
      completed: "bg-[#888888]/100/10 text-[#888888] dark:text-[#888888] border-blue-500/20",
      planned: "bg-yellow-500/10 text-yellow-700 dark:text-[#F5C72C] border-yellow-500/20",
      paused: "bg-[#F5F5F5] text-[#888888] border-[#E0E0E0]",
    };
    return colors[status] || colors.planned;
  };

  if (!category) {
    return (
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground">Category not found</h2>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
    );
  }

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  // Calculate category totals
  const totals = campaigns?.reduce(
    (acc, campaign) => ({
      budget: acc.budget + Number(campaign.budget || 0),
      spend: acc.spend + Number(campaign.actualSpend || 0),
      revenue: acc.revenue + Number(campaign.actualRevenue || 0),
      metaAdsSpend: acc.metaAdsSpend + Number(campaign.metaAdsSpend || 0),
    }),
    { budget: 0, spend: 0, revenue: 0, metaAdsSpend: 0 }
  ) || { budget: 0, spend: 0, revenue: 0, metaAdsSpend: 0 };

  const roi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;

  return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-12 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {category.name}
                </h1>
                <p className="text-muted-foreground mt-1">{category.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totals.budget)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {campaigns?.length || 0} promotions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spend</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totals.spend)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta Ads: {formatCurrency(totals.metaAdsSpend)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totals.revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From Acuity bookings
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Category ROI</CardTitle>
              {roi >= 0 ? (
                <TrendingUp className="h-4 w-4 text-[#3DB855] dark:text-[#3DB855]" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-[#E8453C]" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${roi >= 0 ? 'text-[#3DB855] dark:text-[#3DB855]' : 'text-red-600 dark:text-[#E8453C]'}`}>
                {formatPercent(roi)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {roi >= 0 ? 'Profitable' : 'Loss'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Promotions List */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Promotions</h2>
          {campaigns && campaigns.length > 0 ? (
            <div className="grid gap-4">
              {campaigns.map((campaign) => {
                const campaignRoi = Number(campaign.actualSpend) > 0
                  ? ((Number(campaign.actualRevenue) - Number(campaign.actualSpend)) / Number(campaign.actualSpend)) * 100
                  : 0;

                return (
                  <Card key={campaign.id} className="bg-card border-border hover:border-primary/50 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg font-bold text-foreground">
                              {campaign.name}
                            </CardTitle>
                            <Badge variant="outline" className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                          </div>
                          {campaign.description && (
                            <CardDescription className="text-sm">
                              {campaign.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Visual Assets */}
                      {(campaign.landingPageUrl || campaign.posterImageUrl || campaign.reelThumbnailUrl) && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {campaign.landingPageUrl && (
                            <a 
                              href={campaign.landingPageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="relative group flex-shrink-0 cursor-pointer"
                            >
                              <img
                                src={campaign.posterImageUrl || campaign.landingPageUrl}
                                alt="Landing page"
                                className="h-24 w-36 object-cover rounded-lg border border-border"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <span className="text-xs text-white font-medium">Landing Page</span>
                              </div>
                            </a>
                          )}
                          {campaign.posterImageUrl && (
                            <div className="relative group flex-shrink-0">
                              <img
                                src={campaign.posterImageUrl}
                                alt="Poster"
                                className="h-24 w-24 object-cover rounded-lg border border-border"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <span className="text-xs text-white font-medium">Poster</span>
                              </div>
                            </div>
                          )}
                          {campaign.reelThumbnailUrl && (
                            <div className="relative group flex-shrink-0">
                              <img
                                src={campaign.reelThumbnailUrl}
                                alt="Reel"
                                className="h-24 w-24 object-cover rounded-lg border border-border"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <span className="text-xs text-white font-medium">Reel</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}
                        </span>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-3 border-t border-border">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Budget</div>
                          <div className="text-sm font-semibold text-foreground">
                            {formatCurrency(campaign.budget)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Spend</div>
                          <div className="text-sm font-semibold text-foreground">
                            {formatCurrency(campaign.actualSpend)}
                          </div>
                          {campaign.metaAdsSpend && Number(campaign.metaAdsSpend) > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Ads: {formatCurrency(campaign.metaAdsSpend)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                          <div className="text-sm font-semibold text-foreground">
                            {formatCurrency(campaign.actualRevenue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Conversions</div>
                          <div className="text-sm font-semibold text-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.actualConversions || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">ROI</div>
                          <div className={`text-sm font-semibold ${campaignRoi >= 0 ? 'text-[#3DB855] dark:text-[#3DB855]' : 'text-red-600 dark:text-[#E8453C]'}`}>
                            {formatPercent(campaignRoi)}
                          </div>
                        </div>
                      </div>

                      {/* ROAS Badge (for campaigns with Meta Ads) */}
                      {campaign.metaAdsSpend && Number(campaign.metaAdsSpend) > 0 && (
                        <div className="pt-3 border-t border-border">
                          <ROASBadge 
                            roas={Number(campaign.actualRevenue) > 0 && Number(campaign.metaAdsSpend) > 0 
                              ? (Number(campaign.actualRevenue) / Number(campaign.metaAdsSpend)) * 100 
                              : 0}
                            revenue={Number(campaign.actualRevenue)}
                            adSpend={Number(campaign.metaAdsSpend)}
                          />
                        </div>
                      )}

                      {/* Meta Ads Link */}
                      {campaign.metaAdsCampaignId && (
                        <div className="pt-3 border-t border-border">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/meta-ads?campaign=${campaign.metaAdsCampaignId}`}>
                              View Meta Ads Details
                            </Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No promotions in this category yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  );
}
