/**
 * ProgramDetailRouter — routes /app/:venueSlug/operations/programs/:slug
 * to the appropriate detail page based on slug.
 *
 * Known programs have dedicated Acuity/campaign-backed detail pages.
 * Unknown slugs (including numeric IDs for generic programs) show a
 * DB-backed summary with honest "Awaiting source data" for missing fields.
 */
import { useParams } from "wouter";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import WinterClinicDetail from "./WinterClinicDetail";
import SundayClinicDetail from "./SundayClinicDetail";
import Leagues from "./Leagues";
import AnnualGiveaway from "./AnnualGiveaway";
import { appRoutes, DEFAULT_VENUE_SLUG } from "@/lib/routes";

// Slug aliases for known detail pages
const SLUG_MAP: Record<string, "winter" | "sunday" | "leagues" | "giveaway"> = {
  "winter-clinics":               "winter",
  "winter-clinic":                "winter",
  "drive-day":                    "sunday",   // Drive Day sessions run via Sunday Clinic Acuity calendar
  "sunday-clinic":                "sunday",
  "sunday-clinics":               "sunday",
  "annual-giveaway":              "giveaway", // Annual Membership Giveaway — Google Sheets-backed
  "annual-membership-giveaway":   "giveaway",
};

function BackToProgramsButton() {
  const [, setLocation] = useLocation();
  return (
    <button
      onClick={() => setLocation(appRoutes.venue(DEFAULT_VENUE_SLUG).operations.programs)}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
    >
      <ArrowLeft size={14} />
      Back to Programs
    </button>
  );
}

function GiveawayProgramDetail() {
  return (
    <div>
      <BackToProgramsButton />
      <AnnualGiveaway />
    </div>
  );
}

function GenericProgramDetail({ slug }: { slug: string }) {
  // Try to load from campaigns table (programs are stored there)
  const numericId = /^\d+$/.test(slug) ? parseInt(slug, 10) : undefined;
  const { data: program, isLoading } = trpc.campaigns.getById.useQuery(
    { id: numericId! },
    { enabled: numericId !== undefined }
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl">
        <BackToProgramsButton />
        <div className="space-y-3">
          <div className="h-6 bg-muted animate-pulse rounded w-48" />
          <div className="h-4 bg-muted animate-pulse rounded w-32" />
        </div>
      </div>
    );
  }

  // Numeric ID that doesn't exist in the DB
  if (numericId !== undefined && !program) {
    return (
      <div className="p-6 space-y-4 max-w-3xl">
        <BackToProgramsButton />
        <div className="rounded-lg border border-border bg-muted/20 p-6 text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">Program not found</p>
          <p className="text-xs text-muted-foreground">No program with ID {numericId} exists. It may have been deleted or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const programName = program
    ? (program as any).name
    : slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <BackToProgramsButton />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">{programName}</h1>
        {program && (
          <p className="text-sm text-muted-foreground">
            {(program as any).description || (program as any).category || "Program"}
          </p>
        )}
      </div>

      {program && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Status", value: (program as any).status },
            { label: "Category", value: (program as any).category },
            { label: "Start", value: (program as any).startDate ? new Date((program as any).startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
            { label: "End", value: (program as any).endDate ? new Date((program as any).endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
            { label: "Budget", value: (program as any).budget ? `$${parseFloat(String((program as any).budget)).toLocaleString()}` : "—" },
            { label: "Actual Spend", value: (program as any).actualSpend ? `$${parseFloat(String((program as any).actualSpend)).toLocaleString()}` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
              <p className="text-sm font-semibold text-foreground capitalize">{value || "—"}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-2">Performance Data</p>
        <p>Awaiting source data — attendance, revenue, and lead metrics will appear here once connected to Acuity or a manual data sheet.</p>
      </div>
    </div>
  );
}

export default function ProgramDetailRouter() {
  const params = useParams<{ venueSlug: string; slug: string }>();
  const slug = (params.slug ?? "").toLowerCase();

  const knownType = SLUG_MAP[slug];

  if (knownType === "winter") return <WinterClinicDetail />;
  if (knownType === "sunday") return <SundayClinicDetail />;
  if (knownType === "giveaway") return <GiveawayProgramDetail />;
  if (slug === "leagues") return <Leagues />;

  return <GenericProgramDetail slug={slug} />;
}
