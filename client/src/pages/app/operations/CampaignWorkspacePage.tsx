import InitiativeWorkspacePage from "./InitiativeWorkspacePage";
import { appRoutes, DEFAULT_VENUE_SLUG } from "@/lib/routes";

export default function CampaignWorkspacePage({ venueSlug = DEFAULT_VENUE_SLUG, campaignId }: { venueSlug?: string; campaignId: string }) {
  return (
    <InitiativeWorkspacePage
      venueSlug={venueSlug}
      initiativeKind="campaign"
      initiativeId={campaignId}
      initiativeSummary={{
        id: campaignId,
        name: `Campaign ${campaignId}`,
        description: "Strategic campaign workspace linking operations work, open blockers, and reporting context.",
        owner: "Studio Soo",
        blocker: "Need current campaign execution blockers and owner follow-up aligned across venue and HQ.",
        nextAction: "Review latest issue/task linkage and update the weekly brief if status changes.",
        linkedReportLabel: "Weekly Executive Report / Branch Update Brief",
        linkedReportHref: appRoutes.venue(venueSlug).reports.home,
        status: "Active workspace",
      }}
    />
  );
}
