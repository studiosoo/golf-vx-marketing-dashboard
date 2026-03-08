import InitiativeWorkspacePage from "./InitiativeWorkspacePage";
import { appRoutes, DEFAULT_VENUE_SLUG } from "@/lib/routes";

export default function ProgramWorkspacePage({ venueSlug = DEFAULT_VENUE_SLUG, programId }: { venueSlug?: string; programId: string }) {
  return (
    <InitiativeWorkspacePage
      venueSlug={venueSlug}
      initiativeKind="program"
      initiativeId={programId}
      initiativeSummary={{
        id: programId,
        name: `Program ${programId}`,
        description: "Program workspace for operational ownership, upcoming execution, and linked follow-up records.",
        owner: "Venue Admin",
        blocker: "Program delivery details and local dependencies need to stay visible to the weekly operations team.",
        nextAction: "Confirm local execution owners and roll linked work into the next branch update brief.",
        linkedReportLabel: "Branch Update Summary / Weekly Ops Brief",
        linkedReportHref: appRoutes.venue(venueSlug).reports.briefs,
        status: "In execution",
      }}
    />
  );
}
