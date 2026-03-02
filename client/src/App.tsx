import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// ── Core pages ──
import Home from "./pages/Home";
import Overview from "./pages/Overview";

// ── MARKETING & PROGRAMS / Campaigns ──
import StrategicCampaigns from "./pages/StrategicCampaigns";
import MetaAds from "./pages/MetaAds";
import MetaAdsCampaignDetail from "./pages/MetaAdsCampaignDetail";
import CampaignDetail from "./pages/CampaignDetail";
import CategoryDetail from "./pages/CategoryDetail";
import CampaignVisuals from "./pages/CampaignVisuals";
import CalendarViewer from "./pages/CalendarViewer";
import CampaignTimeline from "./pages/CampaignTimeline";
import BudgetManager from "./pages/BudgetManager";

// ── MARKETING & PROGRAMS / Intelligence ──
import MarketingIntelligence from "./pages/MarketingIntelligence";
import AIActions from "./pages/AIActions";
import Performance from "./pages/Performance";
import MarketResearch from "./pages/MarketResearch";
import ROI from "./pages/ROI";
import Revenue from "./pages/Revenue";
import Reports from "./pages/Reports";

// ── MARKETING & PROGRAMS / Programs ──
import Programs from "./pages/Programs";
import DriveDay from "./pages/DriveDay";
import SundayClinicDetail from "./pages/SundayClinicDetail";
import WinterClinicDetail from "./pages/WinterClinicDetail";
import JuniorSummerCamp from "./pages/JuniorSummerCamp";
import JuniorCampDashboard from "./pages/JuniorCampDashboard";
import SummerCamp from "./pages/SummerCamp";
import Leagues from "./pages/Leagues";
import PrivateEvents from "./pages/PrivateEvents";

// ── AUDIENCE / List ──
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import Duplicates from "./pages/Duplicates";
import Leads from "./pages/Leads";
import Guests from "./pages/Guests";

// ── AUDIENCE / Communication ──
import Announcements from "./pages/Announcements";
import Automations from "./pages/Automations";
import DripCampaigns from "./pages/DripCampaigns";
import EmailMarketing from "./pages/EmailMarketing";
import Channels from "./pages/Channels";
import CommunicationsHub from "./pages/CommunicationsHub";

// ── WEBSITE ──
import SiteControl from "./pages/SiteControl";
import InstagramViewer from "./pages/InstagramViewer";
import InstagramSync from "./pages/InstagramSync";
import InstagramAnalytics from "./pages/InstagramAnalytics";
import WebsiteViewer from "./pages/WebsiteViewer";
import NewsManager from "./pages/NewsManager";

// ── SETTINGS ──
import Integrations from "./pages/Integrations";
import AccountSettings from "./pages/AccountSettings";

// ── Public preview (no auth) ──
import Preview from "./pages/Preview";

// ── Email Campaigns (Encharge sync) ──
import EmailCampaigns from "./pages/EmailCampaigns";

// ── Funnels / Landing Pages (ClickFunnels sync) ──
import Funnels from "./pages/Funnels";

// ── Special / Legacy public pages ──
import TrialSession from "./pages/TrialSession";
import AnniversaryGiveaway from "./pages/AnniversaryGiveaway";
import AnniversaryGiveawayApplication from "./pages/AnniversaryGiveawayApplication";
import AnniversaryGiveawayThankYou from "./pages/AnniversaryGiveawayThankYou";
import AnnualGiveaway from "./pages/AnnualGiveaway";
import AnnualGiveawayActions from "./pages/AnnualGiveawayActions";
import Tasks from "./pages/Tasks";


// ── Guest Preview (no auth required) ──
import GuestDashboardLayout from "./components/GuestDashboardLayout";
import GuestHome from "./pages/guest/GuestHome";
import GuestOverview from "./pages/guest/GuestOverview";
import GuestMembers from "./pages/guest/GuestMembers";
import GuestCampaigns from "./pages/guest/GuestCampaigns";
import GuestRevenue from "./pages/guest/GuestRevenue";
import GuestMetaAds from "./pages/guest/GuestMetaAds";
import GuestEmailCampaigns from "./pages/guest/GuestEmailCampaigns";
import GuestFunnels from "./pages/guest/GuestFunnels";
import GuestPerformance from "./pages/guest/GuestPerformance";
import GuestAutomations from "./pages/guest/GuestAutomations";
import GuestMarketingIntelligence from "./pages/guest/GuestMarketingIntelligence";
import GuestAIActions from "./pages/guest/GuestAIActions";
import GuestGuests from "./pages/guest/GuestGuests";
import GuestLeads from "./pages/guest/GuestLeads";
import GuestLeagues from "./pages/guest/GuestLeagues";
import GuestNewsManager from "./pages/guest/GuestNewsManager";
import GuestDripCampaigns from "./pages/guest/GuestDripCampaigns";
import GuestPrograms from "./pages/guest/GuestPrograms";
import GuestPrivateEvents from "./pages/guest/GuestPrivateEvents";
import GuestSiteControl from "./pages/guest/GuestSiteControl";
import GuestIntegrations from "./pages/guest/GuestIntegrations";
import GuestAccountSettings from "./pages/guest/GuestAccountSettings";
import GuestAnnouncements from "./pages/guest/GuestAnnouncements";

function Router() {
  return (
    <Switch>
      {/* ── Root → Overview ── */}
      <Route path="/" component={Home} />
      <Route path="/overview" component={Overview} />

      {/* ── MARKETING & PROGRAMS / Campaigns ── */}
      <Route path="/campaigns" component={StrategicCampaigns} />
      <Route path="/campaigns/strategic" component={StrategicCampaigns} />
      <Route path="/campaigns/meta-ads" component={MetaAds} />
      <Route path="/campaigns/meta-ads/campaign/:id" component={MetaAdsCampaignDetail} />
      <Route path="/campaign/:id" component={CampaignDetail} />
      <Route path="/category/:id" component={CategoryDetail} />
      <Route path="/campaign-visuals" component={CampaignVisuals} />
      <Route path="/calendar" component={CalendarViewer} />
      <Route path="/timeline" component={CampaignTimeline} />
      <Route path="/budget" component={BudgetManager} />

      {/* ── MARKETING & PROGRAMS / Intelligence ── */}
      <Route path="/intelligence" component={MarketingIntelligence} />
      <Route path="/intelligence/ai-actions" component={AIActions} />
      <Route path="/intelligence/performance" component={Performance} />
      <Route path="/intelligence/research" component={MarketResearch} />
      <Route path="/intelligence/revenue" component={Revenue} />
      <Route path="/intelligence/reports" component={Reports} />

      {/* ── MARKETING & PROGRAMS / Programs ── */}
      <Route path="/programs" component={Programs} />
      <Route path="/programs/drive-day" component={SundayClinicDetail} />
      <Route path="/programs/winter-clinics" component={WinterClinicDetail} />
      <Route path="/programs/summer-camp" component={JuniorCampDashboard} />
      <Route path="/programs/junior-summer-camp" component={JuniorCampDashboard} />
      <Route path="/programs/leagues" component={Leagues} />
      <Route path="/programs/annual-giveaway" component={AnnualGiveaway} />

      {/* ── PROMOTIONS ── */}
      <Route path="/promotions/annual-giveaway" component={AnnualGiveaway} />

      {/* ── AUDIENCE / List ── */}
      <Route path="/list" component={Members} />
      <Route path="/list/members" component={Members} />
      <Route path="/list/members/:id" component={MemberProfile} />
      <Route path="/list/leads" component={Leads} />
      <Route path="/list/guests" component={Guests} />
      <Route path="/duplicates" component={Duplicates} />

      {/* ── AUDIENCE / Communication ── */}
      <Route path="/communication" component={CommunicationsHub} />
      <Route path="/communication/hub" component={CommunicationsHub} />
      <Route path="/communication/email-marketing" component={EmailMarketing} />
      <Route path="/communication/announcements" component={Announcements} />
      <Route path="/communication/automations" component={Automations} />
      <Route path="/communication/drip" component={DripCampaigns} />

      {/* ── WEBSITE ── */}
      <Route path="/website" component={WebsiteViewer} />
      <Route path="/website/site-control" component={SiteControl} />
      <Route path="/website/instagram" component={InstagramViewer} />
      <Route path="/website/instagram/sync" component={InstagramSync} />
      <Route path="/website/instagram/analytics" component={InstagramAnalytics} />
      <Route path="/website/news" component={NewsManager} />

      {/* ── SETTINGS ── */}
      <Route path="/settings" component={AccountSettings} />
      <Route path="/settings/integrations" component={Integrations} />
      <Route path="/settings/account" component={AccountSettings} />

      {/* ── Legacy / backward-compat routes (keep working) ── */}
      <Route path="/strategic-campaigns" component={StrategicCampaigns} />
      <Route path="/meta-ads" component={MetaAds} />
      <Route path="/meta-ads/campaign/:id" component={MetaAdsCampaignDetail} />
      <Route path="/roi" component={ROI} />
      <Route path="/channels" component={Channels} />
      <Route path="/members" component={Members} />
      <Route path="/members/:id" component={MemberProfile} />
      <Route path="/revenue" component={Revenue} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/reports" component={Reports} />
      <Route path="/instagram" component={InstagramViewer} />
      <Route path="/instagram-sync" component={InstagramSync} />
      <Route path="/instagram-analytics" component={InstagramAnalytics} />
      <Route path="/email-marketing" component={EmailMarketing} />
      <Route path="/marketing-intelligence" component={MarketingIntelligence} />
      <Route path="/drive-day" component={DriveDay} />
      <Route path="/junior-summer-camp" component={JuniorCampDashboard} />
      <Route path="/summer-camp" component={SummerCamp} />
      <Route path="/sunday-clinic" component={SundayClinicDetail} />
      <Route path="/winter-clinic" component={WinterClinicDetail} />
      <Route path="/annual-giveaway" component={AnnualGiveaway} />
      <Route path="/annual-giveaway-actions" component={AnnualGiveawayActions} />
      <Route path="/trial-session" component={TrialSession} />

      {/* ── Special campaign pages ── */}
      <Route path="/anniversary-giveaway" component={AnniversaryGiveaway} />
      <Route path="/anniversary-giveaway-application" component={AnniversaryGiveawayApplication} />
      <Route path="/anniversary-giveaway-thank-you" component={AnniversaryGiveawayThankYou} />

      {/* ── Public preview (no auth required) ── */}
      <Route path="/preview" component={Preview} />

      {/* ── Email Campaigns (Encharge sync) ── */}
      <Route path="/email-campaigns" component={EmailCampaigns} />
      <Route path="/communication/email-campaigns" component={EmailCampaigns} />

      {/* ── Funnels / Landing Pages (ClickFunnels sync) ── */}
      <Route path="/funnels" component={Funnels} />
      <Route path="/website/funnels" component={Funnels} />


      {/* ── Guest Preview routes (no auth required) ── */}
      <Route path="/guest">
        <GuestDashboardLayout>
          <GuestHome />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/overview">
        <GuestDashboardLayout>
          <GuestOverview />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/members">
        <GuestDashboardLayout>
          <GuestMembers />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/campaigns">
        <GuestDashboardLayout>
          <GuestCampaigns />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/revenue">
        <GuestDashboardLayout>
          <GuestRevenue />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/meta-ads">
        <GuestDashboardLayout>
          <GuestMetaAds />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/email-campaigns">
        <GuestDashboardLayout>
          <GuestEmailCampaigns />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/funnels">
        <GuestDashboardLayout>
          <GuestFunnels />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/performance">
        <GuestDashboardLayout>
          <GuestPerformance />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/automations">
        <GuestDashboardLayout>
          <GuestAutomations />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/intelligence">
        <GuestDashboardLayout>
          <GuestMarketingIntelligence />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/ai-actions">
        <GuestDashboardLayout>
          <GuestAIActions />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/guests">
        <GuestDashboardLayout>
          <GuestGuests />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/leads">
        <GuestDashboardLayout>
          <GuestLeads />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/leagues">
        <GuestDashboardLayout>
          <GuestLeagues />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/news">
        <GuestDashboardLayout>
          <GuestNewsManager />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/drip">
        <GuestDashboardLayout>
          <GuestDripCampaigns />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/programs">
        <GuestDashboardLayout>
          <GuestPrograms />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/private-events">
        <GuestDashboardLayout>
          <GuestPrivateEvents />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/site-control">
        <GuestDashboardLayout>
          <GuestSiteControl />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/integrations">
        <GuestDashboardLayout>
          <GuestIntegrations />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/settings">
        <GuestDashboardLayout>
          <GuestAccountSettings />
        </GuestDashboardLayout>
      </Route>
      <Route path="/guest/announcements">
        <GuestDashboardLayout>
          <GuestAnnouncements />
        </GuestDashboardLayout>
      </Route>

      {/* ── 404 ── */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
