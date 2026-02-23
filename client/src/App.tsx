import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// ─── New Hub Pages (6 sidebar items) ─────────────────────────────────────────
import CampaignHQ from "./pages/CampaignHQ";
import CampaignsHub from "./pages/CampaignsHub";
import ChannelsHub from "./pages/ChannelsHub";
import ScheduleHub from "./pages/ScheduleHub";
import MembersPage from "./pages/MembersPage";
import RevenueReportsHub from "./pages/RevenueReportsHub";

// ─── Detail / Sub-pages (direct routes preserved) ───────────────────────────
import MetaAdsCampaignDetail from "./pages/MetaAdsCampaignDetail";
import CategoryDetail from "./pages/CategoryDetail";
import CampaignDetail from "./pages/CampaignDetail";
import MemberProfile from "./pages/MemberProfile";
import Duplicates from "./pages/Duplicates";
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
import WebsiteViewer from "./pages/WebsiteViewer";

function Router() {
  return (
    <Switch>
      {/* ─── 6 Main Hub Routes ──────────────────────────────────────────── */}
      <Route path={"/"} component={CampaignHQ} />
      <Route path={"/campaigns"} component={CampaignsHub} />
      <Route path={"/channels"} component={ChannelsHub} />
      <Route path={"/schedule"} component={ScheduleHub} />
      <Route path={"/members"} component={MembersPage} />
      <Route path={"/revenue-reports"} component={RevenueReportsHub} />

      {/* ─── Detail & Sub-pages ─────────────────────────────────────────── */}
      <Route path={"/meta-ads/campaign/:id"} component={MetaAdsCampaignDetail} />
      <Route path={"/category/:id"} component={CategoryDetail} />
      <Route path={"/campaign/:id"} component={CampaignDetail} />
      <Route path={"/members/:id"} component={MemberProfile} />
      <Route path={"/duplicates"} component={Duplicates} />
      <Route path={"/annual-giveaway-actions"} component={AnnualGiveawayActions} />
      <Route path={"/sunday-clinic"} component={SundayClinicDetail} />
      <Route path={"/winter-clinic"} component={WinterClinicDetail} />
      <Route path={"/trial-session"} component={TrialSession} />
      <Route path={"/drive-day"} component={DriveDay} />
      <Route path={"/junior-summer-camp"} component={JuniorSummerCamp} />
      <Route path={"/summer-camp"} component={SummerCamp} />
      <Route path={"/anniversary-giveaway"} component={AnniversaryGiveaway} />
      <Route path={"/anniversary-giveaway-application"} component={AnniversaryGiveawayApplication} />
      <Route path={"/anniversary-giveaway-thank-you"} component={AnniversaryGiveawayThankYou} />
      <Route path={"/website"} component={WebsiteViewer} />

      {/* ─── Fallback ───────────────────────────────────────────────────── */}
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
