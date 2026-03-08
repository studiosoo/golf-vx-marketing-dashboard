import NotFound from "./NotFound";
import { DEFAULT_VENUE_SLUG, appRoutes } from "@/lib/routes";

type PlaceholderPageProps = {
  title: string;
  description: string;
  homePath?: string;
};

function PlaceholderPage({
  title,
  description,
  homePath = appRoutes.venue(DEFAULT_VENUE_SLUG).dashboard,
}: PlaceholderPageProps) {
  return <NotFound title={title} description={description} homePath={homePath} />;
}

export function ReportsTemplatesPlaceholder() {
  return (
    <PlaceholderPage
      title="Report Templates"
      description="Phase 1 placeholder: this workspace will define reusable report templates for administrators and recurring branch reporting."
    />
  );
}

export function ReportsSchedulesPlaceholder() {
  return (
    <PlaceholderPage
      title="Report Schedules"
      description="Phase 1 placeholder: this workspace will manage scheduled report generation, delivery timing, and recipients."
    />
  );
}

export function ReportsArchivePlaceholder() {
  return (
    <PlaceholderPage
      title="Report Archive"
      description="Phase 1 placeholder: this workspace will store previously generated reports, exports, and historical snapshots."
    />
  );
}

export function ReportsBriefsPlaceholder() {
  return (
    <PlaceholderPage
      title="Report Briefs"
      description="Phase 1 placeholder: this workspace will capture reporting requests, business questions, and brief-to-report workflows."
    />
  );
}

export function OperationsThisWeekPlaceholder() {
  return (
    <PlaceholderPage
      title="Operations · This Week"
      description="Phase 1 placeholder: this page will become the weekly execution view for Arlington Heights with priorities, owners, and deadlines."
    />
  );
}

export function OperationsInboxPlaceholder() {
  return (
    <PlaceholderPage
      title="Operations · Inbox"
      description="Phase 1 placeholder: this Inbox is the triage and normalization layer for messy updates. It will ingest incoming coordination signals, normalize them, assign ownership, convert them into tasks/issues/briefs/updates, and expose unresolved coordination gaps."
    />
  );
}

export function OperationsIssuesPlaceholder() {
  return (
    <PlaceholderPage
      title="Operations · Issues"
      description="Phase 1 placeholder: this page will track execution blockers, unresolved ownership gaps, and branch coordination issues."
    />
  );
}

export function AudienceSegmentsPlaceholder() {
  return (
    <PlaceholderPage
      title="Audience · Segments"
      description="Phase 1 placeholder: this workspace will centralize audience segments, filters, and reusable branch-scoped cohort definitions."
    />
  );
}

export function InsightsAlertsPlaceholder() {
  return (
    <PlaceholderPage
      title="Insights · Alerts"
      description="Phase 1 placeholder: this page will surface urgent alerts, anomalies, and high-priority business intelligence signals."
    />
  );
}

export function AccountProfilePlaceholder() {
  return (
    <PlaceholderPage
      title="Account · Profile"
      description="Phase 1 placeholder: this route is reserved for personal account and profile settings, separate from org/system administration."
      homePath={appRoutes.accountProfile}
    />
  );
}

export function AdminOverviewPlaceholder() {
  return (
    <PlaceholderPage
      title="Admin · Overview"
      description="Phase 1 placeholder: this page will become the system administration control surface across users, venues, sync health, and reporting configuration."
      homePath={appRoutes.admin.overview}
    />
  );
}

export function AdminUsersPlaceholder() {
  return (
    <PlaceholderPage
      title="Admin · Users"
      description="Phase 1 placeholder: this page will manage organization users, access, and assignments."
      homePath={appRoutes.admin.overview}
    />
  );
}

export function AdminRolesPlaceholder() {
  return (
    <PlaceholderPage
      title="Admin · Roles"
      description="Phase 1 placeholder: this page will manage permissions and role definitions across HQ and venue users."
      homePath={appRoutes.admin.overview}
    />
  );
}

export function AdminVenuesPlaceholder() {
  return (
    <PlaceholderPage
      title="Admin · Venues"
      description="Phase 1 placeholder: this page will manage venue records, future multi-location support, and venue-scoped configuration."
      homePath={appRoutes.admin.overview}
    />
  );
}

export function AdminKpiDefinitionsPlaceholder() {
  return (
    <PlaceholderPage
      title="Admin · KPI Definitions"
      description="Phase 1 placeholder: this page will centralize KPI definitions, naming, formulas, and reporting standards."
      homePath={appRoutes.admin.overview}
    />
  );
}

export function AdminSyncHealthPlaceholder() {
  return (
    <PlaceholderPage
      title="Admin · Sync Health"
      description="Phase 1 placeholder: this page will monitor source sync status, ingestion issues, and integration health across systems."
      homePath={appRoutes.admin.overview}
    />
  );
}

export function AdminReportSettingsPlaceholder() {
  return (
    <PlaceholderPage
      title="Admin · Report Settings"
      description="Phase 1 placeholder: this page will manage organization-level report defaults, exports, schedules, and sharing controls."
      homePath={appRoutes.admin.overview}
    />
  );
}

export function AdminAuditLogPlaceholder() {
  return (
    <PlaceholderPage
      title="Admin · Audit Log"
      description="Phase 1 placeholder: this page will capture administrative changes, approvals, and operational audit history."
      homePath={appRoutes.admin.overview}
    />
  );
}

export function SharedReportPlaceholder() {
  return (
    <PlaceholderPage
      title="Shared Report"
      description="Phase 1 placeholder: this route is reserved for externally shared report views addressed by share ID."
    />
  );
}
