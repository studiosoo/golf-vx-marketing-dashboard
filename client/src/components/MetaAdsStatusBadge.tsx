import { trpc } from "@/lib/trpc";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

/**
 * MetaAdsStatusBadge
 * Shows a small inline badge indicating whether Meta Ads data is live,
 * stale, or unavailable. Use in page headers near Meta Ads data.
 */
export function MetaAdsStatusBadge() {
  const { data, isLoading, isError } = trpc.metaAds.getAllCampaignsWithInsights.useQuery(
    { datePreset: "last_7d" },
    {
      refetchInterval: 300000,
      retry: 1,
      staleTime: 60000,
    }
  );

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#888888]">
        <Loader2 className="h-3 w-3 animate-spin" />
        Meta Ads…
      </span>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#E8453C]">
        <WifiOff className="h-3 w-3" />
        Meta Ads offline
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#72B84A]">
      <Wifi className="h-3 w-3" />
      Meta Ads live
    </span>
  );
}
