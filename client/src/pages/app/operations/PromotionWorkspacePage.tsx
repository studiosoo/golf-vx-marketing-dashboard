import InitiativeWorkspacePage from "./InitiativeWorkspacePage";
import { appRoutes, DEFAULT_VENUE_SLUG } from "@/lib/routes";

export default function PromotionWorkspacePage({ venueSlug = DEFAULT_VENUE_SLUG, promotionId }: { venueSlug?: string; promotionId: string }) {
  return (
    <InitiativeWorkspacePage
      venueSlug={venueSlug}
      initiativeKind="promotion"
      initiativeId={promotionId}
      initiativeSummary={{
        id: promotionId,
        name: `Promotion ${promotionId}`,
        description: "Promotion workspace for offer execution, blocker tracking, and brief/report linkage.",
        owner: "HQ support",
        blocker: "Promotion copy, venue readiness, and follow-up timing need one linked operational record view.",
        nextAction: "Capture remaining blockers and hand off the latest status through a linked promotion brief.",
        linkedReportLabel: "Promotion Status Brief / Weekly Executive Report",
        linkedReportHref: appRoutes.venue(venueSlug).reports.briefs,
        status: "Tracking",
      }}
    />
  );
}
