import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { SharedReportPlaceholder } from "./pages/ControlTowerPlaceholders";
import {
  AdminIntegrationsWrapper,
  AudiencePeopleWrapper,
  DashboardPageWrapper,
  InsightsAskWrapper,
  InsightsResearchWrapper,
  OperationsCalendarWrapper,
  OperationsCampaignsWrapper,
  OperationsContentWrapper,
  OperationsLocalMarketingWrapper,
  OperationsProgramsWrapper,
  OperationsPromotionsWrapper,
  ReportsPageWrapper,
  StudioSooAutopilotWrapper,
  StudioSooProductionWrapper,
} from "./pages/ControlTowerWrappers";
import {
  DEFAULT_VENUE_SLUG,
  appRoutes,
  publicRoutes,
} from "./lib/routes";

const PromoLanding = lazy(() => import("./pages/PromoLanding"));
const TrialSession = lazy(() => import("./pages/TrialSession"));
const AnniversaryGiveaway = lazy(() => import("./pages/AnniversaryGiveaway"));
const AnniversaryGiveawayApplication = lazy(() => import("./pages/AnniversaryGiveawayApplication"));
const AnniversaryGiveawayThankYou = lazy(() => import("./pages/AnniversaryGiveawayThankYou"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"));
const ProgramDetailRouter = lazy(() => import("./pages/ProgramDetailRouter"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const Activities = lazy(() => import("./pages/Activities"));
const ActivityDetail = lazy(() => import("./pages/ActivityDetail"));

function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation(to, { replace: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const PageFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", color: "#A8A8A3", fontSize: "13px" }}>
    Loading…
  </div>
);

function DashboardAppRoutes() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageFallback />}>
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

        <Route path="/app/:venueSlug/performance">{params => <Redirect to={appRoutes.venue(params.venueSlug).dashboard} />}</Route>

        <Route path="/app/:venueSlug/operations">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/this-week">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/inbox">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/issues">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/tasks">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/calendar" component={OperationsCalendarWrapper} />
        <Route path="/app/:venueSlug/operations/campaigns" component={OperationsCampaignsWrapper} />
        <Route path="/app/:venueSlug/operations/campaigns/:id" component={CampaignDetail} />
        <Route path="/app/:venueSlug/operations/paid-media">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/paid-media/:id">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/programs" component={OperationsProgramsWrapper} />
        <Route path="/app/:venueSlug/operations/programs/:slug" component={ProgramDetailRouter} />
        <Route path="/app/:venueSlug/operations/promotions" component={OperationsPromotionsWrapper} />
        <Route path="/app/:venueSlug/operations/communications">{params => <Redirect to={appRoutes.venue(params.venueSlug).operations.campaigns} />}</Route>
        <Route path="/app/:venueSlug/operations/local-marketing" component={OperationsLocalMarketingWrapper} />
        <Route path="/app/:venueSlug/operations/content" component={OperationsContentWrapper} />

        <Route path="/app/:venueSlug/audience">{params => <Redirect to={appRoutes.venue(params.venueSlug).audience.people} />}</Route>
        <Route path="/app/:venueSlug/audience/people" component={AudiencePeopleWrapper} />
        <Route path="/app/:venueSlug/audience/segments">{params => <Redirect to={appRoutes.venue(params.venueSlug).audience.people} />}</Route>
        <Route path="/app/:venueSlug/audience/duplicates">{params => <Redirect to={appRoutes.venue(params.venueSlug).audience.people} />}</Route>
        <Route path="/app/:venueSlug/audience/:id" component={MemberProfile} />

        <Route path="/app/:venueSlug/studio-soo">{params => <Redirect to={appRoutes.venue(params.venueSlug).studioSoo.autopilot} />}</Route>
        <Route path="/app/:venueSlug/studio-soo/autopilot" component={StudioSooAutopilotWrapper} />
        <Route path="/app/:venueSlug/studio-soo/campaigns" component={OperationsCampaignsWrapper} />
        <Route path="/app/:venueSlug/studio-soo/campaigns/:id" component={CampaignDetail} />
        {/* Activities (replaces Programs / Promotions / Local Marketing / Content & Social) */}
        <Route path="/app/:venueSlug/studio-soo/activities/:tab/:id" component={ActivityDetail} />
        <Route path="/app/:venueSlug/studio-soo/activities/:tab" component={Activities} />
        <Route path="/app/:venueSlug/studio-soo/activities">{params => <Redirect to={appRoutes.venue(params.venueSlug).studioSoo.activityPrograms} />}</Route>

        {/* FIX 7 — Redirect old studio-soo routes to activities */}
        <Route path="/app/:venueSlug/studio-soo/programs">{params => <Redirect to={appRoutes.venue(params.venueSlug).studioSoo.activityPrograms} />}</Route>
        <Route path="/app/:venueSlug/studio-soo/programs/:slug">{params => <Redirect to={appRoutes.venue(params.venueSlug).studioSoo.activityPrograms} />}</Route>
        <Route path="/app/:venueSlug/studio-soo/promotions">{params => <Redirect to={appRoutes.venue(params.venueSlug).studioSoo.activityPromotions} />}</Route>
        <Route path="/app/:venueSlug/studio-soo/local-marketing">{params => <Redirect to={appRoutes.venue(params.venueSlug).studioSoo.activityLocal} />}</Route>
        <Route path="/app/:venueSlug/studio-soo/content">{params => <Redirect to={appRoutes.venue(params.venueSlug).studioSoo.activityPromotions} />}</Route>

        <Route path="/app/:venueSlug/studio-soo/production" component={StudioSooProductionWrapper} />

        <Route path="/app/:venueSlug/insights">{params => <Redirect to={appRoutes.venue(params.venueSlug).insights.ask} />}</Route>
        <Route path="/app/:venueSlug/insights/alerts">{params => <Redirect to={appRoutes.venue(params.venueSlug).insights.ask} />}</Route>
        <Route path="/app/:venueSlug/insights/recommendations">{params => <Redirect to={appRoutes.venue(params.venueSlug).studioSoo.autopilot} />}</Route>
        <Route path="/app/:venueSlug/insights/ask" component={InsightsAskWrapper} />
        <Route path="/app/:venueSlug/insights/research" component={InsightsResearchWrapper} />

        <Route path="/app/:venueSlug">{params => <Redirect to={appRoutes.venue(params.venueSlug).dashboard} />}</Route>

        <Route path="/404">{() => <NotFound />}</Route>
        <Route>{() => <NotFound />}</Route>
      </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function LegacyRoutes() {
  const venue = appRoutes.venue(DEFAULT_VENUE_SLUG);

  return (
    <Switch>
      <Route path="/">{() => <Redirect to={venue.dashboard} />}</Route>
      <Route path="/overview">{() => <Redirect to={venue.dashboard} />}</Route>

      <Route path="/intelligence">{() => <Redirect to={venue.studioSoo.autopilot} />}</Route>
      <Route path="/intelligence/autopilot">{() => <Redirect to={venue.studioSoo.autopilot} />}</Route>
      <Route path="/intelligence/assistant">{() => <Redirect to={venue.insights.ask} />}</Route>
      <Route path="/intelligence/strategy">{() => <Redirect to={venue.studioSoo.autopilot} />}</Route>
      <Route path="/intelligence/market-research">{() => <Redirect to={venue.insights.research} />}</Route>
      <Route path="/intelligence/performance">{() => <Redirect to={venue.dashboard} />}</Route>
      <Route path="/intelligence/revenue">{() => <Redirect to={venue.dashboard} />}</Route>
      <Route path="/intelligence/reports">{() => <Redirect to={venue.reports.home} />}</Route>
      <Route path="/intelligence/ai-actions">{() => <Redirect to={venue.studioSoo.autopilot} />}</Route>
      <Route path="/intelligence/action-plan">{() => <Redirect to={venue.studioSoo.autopilot} />}</Route>
      <Route path="/workspace">{() => <Redirect to={venue.insights.ask} />}</Route>
      <Route path="/marketing-intelligence">{() => <Redirect to={venue.studioSoo.autopilot} />}</Route>

      <Route path="/reports">{() => <Redirect to={venue.reports.home} />}</Route>
      <Route path="/revenue">{() => <Redirect to={venue.dashboard} />}</Route>
      <Route path="/roi">{() => <Redirect to={venue.dashboard} />}</Route>

      <Route path="/operations">{() => <Redirect to={venue.operations.campaigns} />}</Route>
      <Route path="/operations/campaigns">{() => <Redirect to={venue.operations.campaigns} />}</Route>
      <Route path="/operations/programs">{() => <Redirect to={venue.operations.programs} />}</Route>
      <Route path="/operations/programs/:id">{params => <Redirect to={venue.operations.programDetail(params.id!)} />}</Route>
      <Route path="/operations/promotions">{() => <Redirect to={venue.operations.promotions} />}</Route>
      <Route path="/operations/local-marketing">{() => <Redirect to={venue.operations.localMarketing} />}</Route>
      <Route path="/operations/content">{() => <Redirect to={venue.operations.content} />}</Route>
      <Route path="/operations/calendar">{() => <Redirect to={venue.operations.calendar} />}</Route>
      <Route path="/operations/paid-media">{() => <Redirect to={venue.operations.campaigns} />}</Route>

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

      <Route path="/activities/programs/:id">{params => <Redirect to={venue.studioSoo.activityProgramDetail(params.id!)} />}</Route>
      <Route path="/activities/promotions/black-friday">{() => <Redirect to={venue.studioSoo.activityPromotionDetail("swing-saver-promo")} />}</Route>
      <Route path="/activities/promotions/year-end-membership-special">{() => <Redirect to={venue.studioSoo.activityPromotionDetail("swing-saver-promo")} />}</Route>
      <Route path="/activities/promotions/:id">{params => <Redirect to={venue.studioSoo.activityPromotionDetail(params.id!)} />}</Route>
      <Route path="/activities/local/:id">{params => <Redirect to={venue.studioSoo.activityLocalDetail(params.id!)} />}</Route>
      <Route path="/activities/programs">{() => <Redirect to={venue.studioSoo.activityPrograms} />}</Route>
      <Route path="/activities/promotions">{() => <Redirect to={venue.studioSoo.activityPromotions} />}</Route>
      <Route path="/activities/local">{() => <Redirect to={venue.studioSoo.activityLocal} />}</Route>
      <Route path="/activities">{() => <Redirect to={venue.studioSoo.activityPrograms} />}</Route>
      <Route path="/programs">{() => <Redirect to={venue.studioSoo.activityPrograms} />}</Route>
      <Route path="/programs/:id">{() => <Redirect to={venue.studioSoo.activityPrograms} />}</Route>
      <Route path="/promotions/hub">{() => <Redirect to={venue.studioSoo.activityPromotions} />}</Route>
      <Route path="/local-marketing">{() => <Redirect to={venue.studioSoo.activityLocal} />}</Route>
      <Route path="/content-social">{() => <Redirect to={venue.studioSoo.activityPromotions} />}</Route>
      <Route path="/operations/programs">{() => <Redirect to={venue.studioSoo.activityPrograms} />}</Route>
      <Route path="/operations/programs/:id">{() => <Redirect to={venue.studioSoo.activityPrograms} />}</Route>
      <Route path="/operations/promotions">{() => <Redirect to={venue.studioSoo.activityPromotions} />}</Route>
      <Route path="/operations/local-marketing">{() => <Redirect to={venue.studioSoo.activityLocal} />}</Route>
      <Route path="/operations/content">{() => <Redirect to={venue.studioSoo.activityPromotions} />}</Route>
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
    <Suspense fallback={<PageFallback />}>
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
    </Suspense>
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
