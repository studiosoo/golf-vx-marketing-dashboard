import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import PromoLanding from "./pages/PromoLanding";
import TrialSession from "./pages/TrialSession";
import AnniversaryGiveaway from "./pages/AnniversaryGiveaway";
import AnniversaryGiveawayApplication from "./pages/AnniversaryGiveawayApplication";
import AnniversaryGiveawayThankYou from "./pages/AnniversaryGiveawayThankYou";
import MetaAdsCampaignDetail from "./pages/MetaAdsCampaignDetail";
import MemberProfile from "./pages/MemberProfile";
import NotFoundPage from "./pages/NotFound";
import {
  AdminIntegrationsWrapper,
  AudienceDuplicatesWrapper,
  AudiencePeopleWrapper,
  DashboardPageWrapper,
  InsightsAskWrapper,
  InsightsRecommendationsWrapper,
  InsightsResearchWrapper,
  OperationsCalendarWrapper,
  OperationsCampaignsWrapper,
  OperationsCommunicationsWrapper,
  OperationsContentWrapper,
  OperationsPaidMediaWrapper,
  OperationsProgramsWrapper,
  OperationsPromotionsWrapper,
  OperationsTasksWrapper,
  PerformancePageWrapper,
  ReportsPageWrapper,
} from "./pages/ControlTowerWrappers";
import TemplatesPage from "./pages/app/reports/TemplatesPage";
import SchedulesPage from "./pages/app/reports/SchedulesPage";
import ArchivePage from "./pages/app/reports/ArchivePage";
import BriefsPage from "./pages/app/reports/BriefsPage";
import ThisWeekPage from "./pages/app/operations/ThisWeekPage";
import InboxPage from "./pages/app/operations/InboxPage";
import IssuesPage from "./pages/app/operations/IssuesPage";
import CampaignWorkspacePage from "./pages/app/operations/CampaignWorkspacePage";
import ProgramWorkspacePage from "./pages/app/operations/ProgramWorkspacePage";
import PromotionWorkspacePage from "./pages/app/operations/PromotionWorkspacePage";
import AdminOverviewPage from "./pages/app/admin/AdminOverviewPage";
import UsersPage from "./pages/app/admin/UsersPage";
import RolesPage from "./pages/app/admin/RolesPage";
import VenuesPage from "./pages/app/admin/VenuesPage";
import KpiDefinitionsPage from "./pages/app/admin/KpiDefinitionsPage";
import SyncHealthPage from "./pages/app/admin/SyncHealthPage";
import ReportSettingsPage from "./pages/app/admin/ReportSettingsPage";
import AuditLogPage from "./pages/app/admin/AuditLogPage";
import ProfilePage from "./pages/app/account/ProfilePage";
import SharedReportPage from "./pages/shared/SharedReportPage";
import {
  DEFAULT_VENUE_SLUG,
  appRoutes,
  publicRoutes,
} from "./lib/routes";
import { Search, AlertTriangle } from "lucide-react";
import { createPlaceholderPage } from "./pages/app/placeholderFactory";

const AudienceSegmentsPageComponent = createPlaceholderPage({
  eyebrow: "Audience",
  title: "Audience Segments",
  description: "Audience remains a top-level workspace in Phase 1. This route reserves a dedicated place for segment-based people, filtering, and branch-scoped reporting contexts.",
  bullets: [
    "Centralize reusable venue-scoped segments and filter definitions.",
    "Support Arlington Heights audience review without turning this area into a full CRM rewrite.",
    "Keep people, segments, and duplicate resolution within one top-level audience context.",
  ],
  icon: Search,
});

function AudienceSegmentsPage() {
  return <AudienceSegmentsPageComponent />;
}

const InsightsAlertsPageComponent = createPlaceholderPage({
  eyebrow: "Insights",
  title: "Insights Alerts",
  description: "Phase 1 establishes Alerts as a canonical insights landing route while Autopilot is remapped to Recommendations.",
  bullets: [
    "Reserve a stable route for urgent alerts, anomalies, and surfaced intelligence signals.",
    "Keep alerts distinct from recommendations, research, and AI chat flows.",
    "Prepare for later prioritization and escalation logic without changing current insight internals.",
  ],
  icon: AlertTriangle,
});

function InsightsAlertsPage() {
  return <InsightsAlertsPageComponent />;
}

function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    setLocation(to, { replace: true });
  }, [setLocation, to]);

  return null;
}

function getPerformanceRoute(venueSlug: string, tab?: string) {
  const base = appRoutes.venue(venueSlug).performance;
  return tab ? `${base}?tab=${tab}` : base;
}

function ReportDetailRoute({ params }: { params: { venueSlug: string; reportId: string } }) {
  return <Redirect to={appRoutes.venue(params.venueSlug).reports.home} />;
}

function ProgramDetailRoute({ params }: { params: { venueSlug: string; programId: string } }) {
  return <ProgramWorkspacePage venueSlug={params.venueSlug} programId={params.programId} />;
}

function PromotionDetailRoute({ params }: { params: { venueSlug: string; promotionId: string } }) {
  return <PromotionWorkspacePage venueSlug={params.venueSlug} promotionId={params.promotionId} />;
}

function CommunicationDetailRoute({ params }: { params: { venueSlug: string; communicationId: string } }) {
  return <Redirect to={appRoutes.venue(params.venueSlug).operations.communications} />;
}

function AppNotFound() {
  return <NotFoundPage homePath={appRoutes.venue(DEFAULT_VENUE_SLUG).dashboard} />;
}

function DashboardAppRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/app/account/profile" component={ProfilePage} />

        <Route path="/app/admin/overview" component={AdminOverviewPage} />
        <Route path="/app/admin/users" component={UsersPage} />
        <Route path="/app/admin/roles" component={RolesPage} />
        <Route path="/app/admin/integrations" component={AdminIntegrationsWrapper} />
        <Route path="/app/admin/venues" component={VenuesPage} />
        <Route path="/app/admin/kpi-definitions" component={KpiDefinitionsPage} />
        <Route path="/app/admin/sync-health" component={SyncHealthPage} />
        <Route path="/app/admin/report-settings" component={ReportSettingsPage} />
        <Route path="/app/admin/audit-log" component={AuditLogPage} />
        <Route path="/app/admin">{() => <Redirect to={appRoutes.admin.overview} />}</Route>

        <Route path="/app/:venueSlug/dashboard" component={DashboardPageWrapper} />

        <Route path="/app/:venueSlug/reports" component={ReportsPageWrapper} />
        <Route path="/app/:venueSlug/reports/templates" component={TemplatesPage} />
        <Route path="/app/:venueSlug/reports/schedules" component={SchedulesPage} />
        <Route path="/app/:venueSlug/reports/archive">{({ venueSlug }) => <ArchivePage venueSlug={venueSlug} />}</Route>
        <Route path="/app/:venueSlug/reports/briefs">{({ venueSlug }) => <BriefsPage venueSlug={venueSlug} />}</Route>
        <Route path="/app/:venueSlug/reports/:reportId" component={ReportDetailRoute} />

        <Route path="/app/:venueSlug/performance" component={PerformancePageWrapper} />

        <Route path="/app/:venueSlug/operations">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.thisWeek} />}</Route>
        <Route path="/app/:venueSlug/operations/this-week">{({ venueSlug }) => <ThisWeekPage venueSlug={venueSlug} />}</Route>
        <Route path="/app/:venueSlug/operations/inbox">{({ venueSlug }) => <InboxPage venueSlug={venueSlug} />}</Route>
        <Route path="/app/:venueSlug/operations/issues">{({ venueSlug }) => <IssuesPage venueSlug={venueSlug} />}</Route>
        <Route path="/app/:venueSlug/operations/tasks" component={OperationsTasksWrapper} />
        <Route path="/app/:venueSlug/operations/calendar" component={OperationsCalendarWrapper} />
        <Route path="/app/:venueSlug/operations/campaigns" component={OperationsCampaignsWrapper} />
        <Route path="/app/:venueSlug/operations/campaigns/:campaignId">{({ venueSlug, campaignId }) => <CampaignWorkspacePage venueSlug={venueSlug} campaignId={campaignId} />}</Route>
        <Route path="/app/:venueSlug/operations/paid-media" component={OperationsPaidMediaWrapper} />
        <Route path="/app/:venueSlug/operations/paid-media/:id" component={MetaAdsCampaignDetail} />
        <Route path="/app/:venueSlug/operations/programs" component={OperationsProgramsWrapper} />
        <Route path="/app/:venueSlug/operations/programs/:programId" component={ProgramDetailRoute} />
        <Route path="/app/:venueSlug/operations/promotions" component={OperationsPromotionsWrapper} />
        <Route path="/app/:venueSlug/operations/promotions/:promotionId" component={PromotionDetailRoute} />
        <Route path="/app/:venueSlug/operations/communications" component={OperationsCommunicationsWrapper} />
        <Route path="/app/:venueSlug/operations/communications/:communicationId" component={CommunicationDetailRoute} />
        <Route path="/app/:venueSlug/operations/content" component={OperationsContentWrapper} />

        <Route path="/app/:venueSlug/audience">{params => <Redirect to={appRoutes.venue(params.venueSlug).audience.people} />}</Route>
        <Route path="/app/:venueSlug/audience/people" component={AudiencePeopleWrapper} />
        <Route path="/app/:venueSlug/audience/segments" component={AudienceSegmentsPage} />
        <Route path="/app/:venueSlug/audience/duplicates" component={AudienceDuplicatesWrapper} />
        <Route path="/app/:venueSlug/audience/:id" component={MemberProfile} />

        <Route path="/app/:venueSlug/insights">{params => <Redirect to={appRoutes.venue(params.venueSlug).insights.alerts} />}</Route>
        <Route path="/app/:venueSlug/insights/alerts" component={InsightsAlertsPage} />
        <Route path="/app/:venueSlug/insights/recommendations" component={InsightsRecommendationsWrapper} />
        <Route path="/app/:venueSlug/insights/ask" component={InsightsAskWrapper} />
        <Route path="/app/:venueSlug/insights/research" component={InsightsResearchWrapper} />

        <Route path="/app/:venueSlug">{params => <Redirect to={appRoutes.venue(params.venueSlug).dashboard} />}</Route>

        <Route path="/404">{() => <AppNotFound />}</Route>
        <Route>{() => <AppNotFound />}</Route>
      </Switch>
    </DashboardLayout>
  );
}

function LegacyRoutes() {
  const venue = appRoutes.venue(DEFAULT_VENUE_SLUG);

  return (
    <Switch>
      <Route path="/">{() => <Redirect to={venue.dashboard} />}</Route>
      <Route path="/overview">{() => <Redirect to={venue.dashboard} />}</Route>

      <Route path="/intelligence">{() => <Redirect to={venue.insights.recommendations} />}</Route>
      <Route path="/intelligence/autopilot">{() => <Redirect to={venue.insights.recommendations} />}</Route>
      <Route path="/intelligence/assistant">{() => <Redirect to={venue.insights.ask} />}</Route>
      <Route path="/intelligence/strategy">{() => <Redirect to={venue.insights.recommendations} />}</Route>
      <Route path="/intelligence/market-research">{() => <Redirect to={venue.insights.research} />}</Route>
      <Route path="/intelligence/performance">{() => <Redirect to={getPerformanceRoute(DEFAULT_VENUE_SLUG, "overview")} />}</Route>
      <Route path="/intelligence/revenue">{() => <Redirect to={getPerformanceRoute(DEFAULT_VENUE_SLUG, "revenue")} />}</Route>
      <Route path="/intelligence/reports">{() => <Redirect to={venue.reports.home} />}</Route>
      <Route path="/intelligence/ai-actions">{() => <Redirect to={venue.insights.recommendations} />}</Route>
      <Route path="/intelligence/action-plan">{() => <Redirect to={venue.insights.recommendations} />}</Route>
      <Route path="/workspace">{() => <Redirect to={venue.insights.ask} />}</Route>
      <Route path="/marketing-intelligence">{() => <Redirect to={venue.insights.recommendations} />}</Route>

      <Route path="/reports">{() => <Redirect to={venue.reports.home} />}</Route>
      <Route path="/revenue">{() => <Redirect to={getPerformanceRoute(DEFAULT_VENUE_SLUG, "revenue")} />}</Route>
      <Route path="/roi">{() => <Redirect to={getPerformanceRoute(DEFAULT_VENUE_SLUG, "program-roi")} />}</Route>

      <Route path="/campaigns">{() => <Redirect to={venue.operations.campaigns} />}</Route>
      <Route path="/campaigns/strategic">{() => <Redirect to={venue.operations.campaigns} />}</Route>
      <Route path="/campaigns/meta-ads">{() => <Redirect to={venue.operations.paidMedia} />}</Route>
      <Route path="/campaigns/meta-ads/campaign/:id">{params => <Redirect to={venue.operations.paidMediaDetail(params.id)} />}</Route>
      <Route path="/advertising">{() => <Redirect to={venue.operations.paidMedia} />}</Route>
      <Route path="/campaign/:id">{params => <Redirect to={venue.operations.campaignDetail(params.id)} />}</Route>
      <Route path="/campaign-visuals">{() => <Redirect to={venue.operations.campaigns} />}</Route>
      <Route path="/calendar">{() => <Redirect to={venue.operations.calendar} />}</Route>
      <Route path="/timeline">{() => <Redirect to={venue.operations.calendar} />}</Route>
      <Route path="/budget">{() => <Redirect to={venue.operations.campaigns} />}</Route>
      <Route path="/strategic-campaigns">{() => <Redirect to={venue.operations.campaigns} />}</Route>
      <Route path="/meta-ads">{() => <Redirect to={venue.operations.paidMedia} />}</Route>
      <Route path="/meta-ads/campaign/:id">{params => <Redirect to={venue.operations.paidMediaDetail(params.id)} />}</Route>

      <Route path="/programs">{() => <Redirect to={venue.operations.programs} />}</Route>
      <Route path="/promotions/hub">{() => <Redirect to={venue.operations.promotions} />}</Route>
      <Route path="/communication">{() => <Redirect to={venue.operations.communications} />}</Route>
      <Route path="/communication/hub">{() => <Redirect to={venue.operations.communications} />}</Route>
      <Route path="/communication/email-marketing">{() => <Redirect to={venue.operations.communications} />}</Route>
      <Route path="/communication/announcements">{() => <Redirect to={venue.operations.communications} />}</Route>
      <Route path="/communication/automations">{() => <Redirect to={venue.operations.communications} />}</Route>
      <Route path="/communication/drip">{() => <Redirect to={venue.operations.communications} />}</Route>
      <Route path="/website">{() => <Redirect to={venue.operations.content} />}</Route>
      <Route path="/website/site-control">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>
      <Route path="/website/instagram">{() => <Redirect to={venue.operations.content} />}</Route>
      <Route path="/website/instagram/sync">{() => <Redirect to={appRoutes.admin.syncHealth} />}</Route>
      <Route path="/website/instagram/analytics">{() => <Redirect to={venue.operations.content} />}</Route>
      <Route path="/website/news">{() => <Redirect to={venue.operations.content} />}</Route>
      <Route path="/tasks">{() => <Redirect to={venue.operations.tasks} />}</Route>
      <Route path="/instagram">{() => <Redirect to={venue.operations.content} />}</Route>
      <Route path="/instagram-sync">{() => <Redirect to={appRoutes.admin.syncHealth} />}</Route>
      <Route path="/instagram-analytics">{() => <Redirect to={venue.operations.content} />}</Route>
      <Route path="/email-marketing">{() => <Redirect to={venue.operations.communications} />}</Route>

      <Route path="/list">{() => <Redirect to={venue.audience.people} />}</Route>
      <Route path="/list/members">{() => <Redirect to={venue.audience.people} />}</Route>
      <Route path="/list/members/:id">{params => <Redirect to={venue.audience.profile(params.id)} />}</Route>
      <Route path="/list/leads">{() => <Redirect to={venue.audience.segments} />}</Route>
      <Route path="/list/guests">{() => <Redirect to={venue.audience.segments} />}</Route>
      <Route path="/pro-members">{() => <Redirect to={venue.audience.segments} />}</Route>
      <Route path="/duplicates">{() => <Redirect to={venue.audience.duplicates} />}</Route>
      <Route path="/members">{() => <Redirect to={venue.audience.people} />}</Route>
      <Route path="/members/:id">{params => <Redirect to={venue.audience.profile(params.id)} />}</Route>

      <Route path="/settings">{() => <Redirect to={appRoutes.accountProfile} />}</Route>
      <Route path="/settings/account">{() => <Redirect to={appRoutes.accountProfile} />}</Route>
      <Route path="/settings/integrations">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>

      <Route path="/app/:rest*" component={DashboardAppRoutes} />
      <Route component={DashboardAppRoutes} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/public">{() => <Redirect to={publicRoutes.promotions} />}</Route>
      <Route path="/public/promotions/:slug" component={PromoLanding} />
      <Route path="/public/trials/:slug" component={TrialSession} />
      <Route path="/public/giveaways/anniversary" component={AnniversaryGiveaway} />
      <Route path="/public/giveaways/anniversary/apply" component={AnniversaryGiveawayApplication} />
      <Route path="/public/giveaways/anniversary/thank-you" component={AnniversaryGiveawayThankYou} />

      <Route path="/p/:slug">{params => <Redirect to={publicRoutes.promotion(params.slug)} />}</Route>
      <Route path="/trial-session">{() => <Redirect to={publicRoutes.trial()} />}</Route>
      <Route path="/anniversary-giveaway">{() => <Redirect to={publicRoutes.giveawayAnniversary} />}</Route>
      <Route path="/anniversary-giveaway-application">{() => <Redirect to={publicRoutes.giveawayAnniversaryApply} />}</Route>
      <Route path="/anniversary-giveaway-thank-you">{() => <Redirect to={publicRoutes.giveawayAnniversaryThankYou} />}</Route>

      <Route path="/r/:shareId" component={SharedReportPage} />

      <Route component={LegacyRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
