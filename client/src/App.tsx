import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import PromoLanding from "./pages/PromoLanding";
import TrialSession from "./pages/TrialSession";
import AnniversaryGiveaway from "./pages/AnniversaryGiveaway";
import AnniversaryGiveawayApplication from "./pages/AnniversaryGiveawayApplication";
import AnniversaryGiveawayThankYou from "./pages/AnniversaryGiveawayThankYou";
import CampaignDetail from "./pages/CampaignDetail";
import MetaAdsCampaignDetail from "./pages/MetaAdsCampaignDetail";
import ProgramDetailRouter from "./pages/ProgramDetailRouter";
import MemberProfile from "./pages/MemberProfile";
import { SharedReportPlaceholder } from "./pages/ControlTowerPlaceholders";
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
import {
  DEFAULT_VENUE_SLUG,
  appRoutes,
  getDefaultVenueRoute,
  publicRoutes,
} from "./lib/routes";

function Redirect({ to }: { to: string }) {
  window.location.replace(to);
  return null;
}

function DashboardAppRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/app/account/profile">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>

        <Route path="/app/admin/integrations" component={AdminIntegrationsWrapper} />
        <Route path="/app/admin/overview">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>
        <Route path="/app/admin/users">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>
        <Route path="/app/admin/roles">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>
        <Route path="/app/admin/venues">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>
        <Route path="/app/admin/kpi-definitions">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>
        <Route path="/app/admin/sync-health">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>
        <Route path="/app/admin/report-settings">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>
        <Route path="/app/admin/audit-log">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>
        <Route path="/app/admin">{() => <Redirect to={appRoutes.admin.integrations} />}</Route>

        <Route path="/app/:venueSlug/dashboard" component={DashboardPageWrapper} />

        <Route path="/app/:venueSlug/reports" component={ReportsPageWrapper} />
        <Route path="/app/:venueSlug/reports/templates">{params => <Redirect to={appRoutes.venue(params.venueSlug).reports.home} />}</Route>
        <Route path="/app/:venueSlug/reports/schedules">{params => <Redirect to={appRoutes.venue(params.venueSlug).reports.home} />}</Route>
        <Route path="/app/:venueSlug/reports/archive">{params => <Redirect to={appRoutes.venue(params.venueSlug).reports.home} />}</Route>
        <Route path="/app/:venueSlug/reports/briefs">{params => <Redirect to={appRoutes.venue(params.venueSlug).reports.home} />}</Route>

        <Route path="/app/:venueSlug/performance" component={PerformancePageWrapper} />

        <Route path="/app/:venueSlug/operations">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/this-week">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/inbox">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/issues">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/tasks" component={OperationsTasksWrapper} />
        <Route path="/app/:venueSlug/operations/calendar" component={OperationsCalendarWrapper} />
        <Route path="/app/:venueSlug/operations/campaigns" component={OperationsCampaignsWrapper} />
        <Route path="/app/:venueSlug/operations/campaigns/:id" component={CampaignDetail} />
        <Route path="/app/:venueSlug/operations/paid-media" component={OperationsPaidMediaWrapper} />
        <Route path="/app/:venueSlug/operations/paid-media/:id" component={MetaAdsCampaignDetail} />
        <Route path="/app/:venueSlug/operations/programs" component={OperationsProgramsWrapper} />
        <Route path="/app/:venueSlug/operations/programs/:slug" component={ProgramDetailRouter} />
        <Route path="/app/:venueSlug/operations/promotions" component={OperationsPromotionsWrapper} />
        <Route path="/app/:venueSlug/operations/communications" component={OperationsCommunicationsWrapper} />
        <Route path="/app/:venueSlug/operations/content" component={OperationsContentWrapper} />

        <Route path="/app/:venueSlug/audience">{params => <Redirect to={appRoutes.venue(params.venueSlug).audience.people} />}</Route>
        <Route path="/app/:venueSlug/audience/people" component={AudiencePeopleWrapper} />
        <Route path="/app/:venueSlug/audience/segments">{params => <Redirect to={appRoutes.venue(params.venueSlug).audience.people} />}</Route>
        <Route path="/app/:venueSlug/audience/duplicates" component={AudienceDuplicatesWrapper} />
        <Route path="/app/:venueSlug/audience/:id" component={MemberProfile} />

        <Route path="/app/:venueSlug/insights">{params => <Redirect to={appRoutes.venue(params.venueSlug).insights.recommendations} />}</Route>
        <Route path="/app/:venueSlug/insights/alerts">{params => <Redirect to={appRoutes.venue(params.venueSlug).insights.recommendations} />}</Route>
        <Route path="/app/:venueSlug/insights/recommendations" component={InsightsRecommendationsWrapper} />
        <Route path="/app/:venueSlug/insights/ask" component={InsightsAskWrapper} />
        <Route path="/app/:venueSlug/insights/research" component={InsightsResearchWrapper} />

        <Route path="/app/:venueSlug">{params => <Redirect to={appRoutes.venue(params.venueSlug).dashboard} />}</Route>

        <Route path="/404">{() => <NotFound />}</Route>
        <Route>{() => <NotFound />}</Route>
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
      <Route path="/intelligence/performance">{() => <Redirect to={venue.performance} />}</Route>
      <Route path="/intelligence/revenue">{() => <Redirect to={venue.performance} />}</Route>
      <Route path="/intelligence/reports">{() => <Redirect to={venue.reports.home} />}</Route>
      <Route path="/intelligence/ai-actions">{() => <Redirect to={venue.insights.recommendations} />}</Route>
      <Route path="/intelligence/action-plan">{() => <Redirect to={venue.insights.recommendations} />}</Route>
      <Route path="/workspace">{() => <Redirect to={venue.insights.ask} />}</Route>
      <Route path="/marketing-intelligence">{() => <Redirect to={venue.insights.recommendations} />}</Route>

      <Route path="/reports">{() => <Redirect to={venue.reports.home} />}</Route>
      <Route path="/revenue">{() => <Redirect to={venue.performance} />}</Route>
      <Route path="/roi">{() => <Redirect to={venue.performance} />}</Route>

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
      <Route path="/programs/winter-clinics">{() => <Redirect to={venue.operations.programDetail("winter-clinics")} />}</Route>
      <Route path="/programs/drive-day">{() => <Redirect to={venue.operations.programDetail("drive-day")} />}</Route>
      <Route path="/programs/sunday-clinic">{() => <Redirect to={venue.operations.programDetail("sunday-clinic")} />}</Route>
      <Route path="/programs/summer-camp">{() => <Redirect to={venue.operations.programDetail("summer-camp")} />}</Route>
      <Route path="/programs/leagues">{() => <Redirect to={venue.operations.programDetail("leagues")} />}</Route>
      <Route path="/programs/annual-giveaway">{() => <Redirect to={venue.operations.programDetail("annual-giveaway")} />}</Route>
      <Route path="/programs/trial-session">{() => <Redirect to={venue.operations.programDetail("trial-session")} />}</Route>
      <Route path="/programs/:id">{params => <Redirect to={venue.operations.programDetail(params.id!)} />}</Route>
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

      <Route path="/r/:shareId" component={SharedReportPlaceholder} />

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
