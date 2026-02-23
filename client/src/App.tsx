import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Programs from "./pages/Programs";
import StrategicCampaigns from "./pages/StrategicCampaigns";
import ROI from "./pages/ROI";
import Channels from "./pages/Channels";
import Members from "./pages/Members";
import Revenue from "./pages/Revenue";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import MetaAds from "./pages/MetaAds";
import MetaAdsCampaignDetail from "./pages/MetaAdsCampaignDetail";
import BudgetManager from "./pages/BudgetManager";
import CategoryDetail from "./pages/CategoryDetail";
import CampaignVisuals from "./pages/CampaignVisuals";
import InstagramViewer from "./pages/InstagramViewer";
import WebsiteViewer from "./pages/WebsiteViewer";
import CalendarViewer from "./pages/CalendarViewer";
import CampaignTimeline from "./pages/CampaignTimeline";
import MemberProfile from "./pages/MemberProfile";
import Duplicates from "./pages/Duplicates";
import AnnualGiveaway from "./pages/AnnualGiveaway";
import EmailMarketing from "./pages/EmailMarketing";
import CampaignDetail from "./pages/CampaignDetail";
import AnnualGiveawayActions from "./pages/AnnualGiveawayActions";
import SundayClinicDetail from "./pages/SundayClinicDetail";
import WinterClinicDetail from "./pages/WinterClinicDetail";
import TrialSession from "./pages/TrialSession";
import DriveDay from "./pages/DriveDay";
import JuniorSummerCamp from "./pages/JuniorSummerCamp";
import SummerCamp from "./pages/SummerCamp";
import AnniversaryGiveaway from "./pages/AnniversaryGiveaway";
import AnniversaryGiveawayApplication from "./pages/AnniversaryGiveawayApplication";
import AnniversaryGiveawayThankYou from "./pages/AnniversaryGiveawayThankYou";
import MarketingIntelligence from "./pages/MarketingIntelligence";
import InstagramSync from "./pages/InstagramSync";
import InstagramAnalytics from "./pages/InstagramAnalytics";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/trial-session"} component={TrialSession} />
      <Route path={"/drive-day"} component={DriveDay} />
      <Route path={"/junior-summer-camp"} component={JuniorSummerCamp} />
      <Route path={"/summer-camp"} component={SummerCamp} />
      <Route path={"/anniversary-giveaway"} component={AnniversaryGiveaway} />
      <Route path={"/anniversary-giveaway-application"} component={AnniversaryGiveawayApplication} />
      <Route path={"/anniversary-giveaway-thank-you"} component={AnniversaryGiveawayThankYou} />
      <Route path={"/programs"} component={Programs} />
      <Route path={"/strategic-campaigns"} component={StrategicCampaigns} />
      <Route path={"/roi"} component={ROI} />
      <Route path={"/channels"} component={Channels} />
      <Route path={"/members"} component={Members} />
      <Route path={"/members/:id"} component={MemberProfile} />
      <Route path={"/duplicates"} component={Duplicates} />
      <Route path={"/revenue"} component={Revenue} />
      <Route path={"/tasks"} component={Tasks} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/meta-ads"} component={MetaAds} />
      <Route path={"/meta-ads/campaign/:id"} component={MetaAdsCampaignDetail} />
      <Route path={"/budget"} component={BudgetManager} />
      <Route path={"/campaign-visuals"} component={CampaignVisuals} />
      <Route path={"/calendar"} component={CalendarViewer} />
      <Route path={"/timeline"} component={CampaignTimeline} />
      <Route path={"/instagram"} component={InstagramViewer} />
      <Route path={"/instagram-sync"} component={InstagramSync} />
      <Route path={"/instagram-analytics"} component={InstagramAnalytics} />
      <Route path={"/website"} component={WebsiteViewer} />
      <Route path={"/annual-giveaway"} component={AnnualGiveaway} />
      <Route path={"/sunday-clinic"} component={SundayClinicDetail} />
      <Route path={"/winter-clinic"} component={WinterClinicDetail} />
      <Route path={"/annual-giveaway-actions"} component={AnnualGiveawayActions} />
      <Route path={"/email-marketing"} component={EmailMarketing} />
      <Route path={"/marketing-intelligence"} component={MarketingIntelligence} />
      <Route path={"/category/:id"} component={CategoryDetail} />
      <Route path={"/campaign/:id"} component={CampaignDetail} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Golf VX uses dark theme by default per brand guidelines
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
