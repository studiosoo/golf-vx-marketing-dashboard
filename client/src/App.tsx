import { Route, Switch } from "wouter";
import { Toaster } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

// Core pages
import Home from "@/pages/Home";
import Overview from "@/pages/Overview";
import Performance from "@/pages/Performance";
import Revenue from "@/pages/Revenue";
import Preview from "@/pages/Preview";
import PreviewDriveDay from "@/pages/PreviewDriveDay";

// Intelligence
import MarketingIntelligence from "@/pages/MarketingIntelligence";
import AIActions from "@/pages/AIActions";
import NewsManager from "@/pages/NewsManager";

// Members / Leads
import Members from "@/pages/Members";
import Guests from "@/pages/Guests";
import Leads from "@/pages/Leads";

// Campaigns
import Campaigns from "@/pages/Campaigns";
import MetaAds from "@/pages/MetaAds";
import EmailCampaigns from "@/pages/EmailCampaigns";
import Funnels from "@/pages/Funnels";
import Automations from "@/pages/Automations";
import DripCampaigns from "@/pages/DripCampaigns";
import Announcements from "@/pages/Announcements";

// Programs
import Programs from "@/pages/Programs";
import Leagues from "@/pages/Leagues";
import PrivateEvents from "@/pages/PrivateEvents";

// Tools
import SiteControl from "@/pages/SiteControl";
import Integrations from "@/pages/Integrations";
import AccountSettings from "@/pages/AccountSettings";

export default function App() {
  return (
    <>
      <Switch>
        {/* Public preview - no auth required */}
        <Route path="/preview" component={Preview} />
        <Route path="/preview/drive-day" component={PreviewDriveDay} />

        {/* All dashboard routes wrapped in DashboardLayout */}
        <Route>
          <DashboardLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/overview" component={Overview} />
              <Route path="/performance" component={Performance} />
              <Route path="/revenue" component={Revenue} />

              {/* Intelligence */}
              <Route path="/intelligence" component={MarketingIntelligence} />
              <Route path="/intelligence/ai-actions" component={AIActions} />
              <Route path="/intelligence/news" component={NewsManager} />

              {/* Members */}
              <Route path="/members" component={Members} />
              <Route path="/guests" component={Guests} />
              <Route path="/leads" component={Leads} />

              {/* Campaigns */}
              <Route path="/campaigns" component={Campaigns} />
              <Route path="/campaigns/meta-ads" component={MetaAds} />
              <Route path="/campaigns/email" component={EmailCampaigns} />
              <Route path="/campaigns/funnels" component={Funnels} />
              <Route path="/campaigns/automations" component={Automations} />
              <Route path="/campaigns/drip" component={DripCampaigns} />
              <Route path="/announcements" component={Announcements} />

              {/* Programs */}
              <Route path="/programs" component={Programs} />
              <Route path="/programs/leagues" component={Leagues} />
              <Route path="/programs/events" component={PrivateEvents} />

              {/* Tools */}
              <Route path="/site-control" component={SiteControl} />
              <Route path="/integrations" component={Integrations} />
              <Route path="/settings" component={AccountSettings} />

              {/* Fallback 404 */}
              <Route>
                <div className="flex items-center justify-center h-full min-h-[60vh]">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
                    <p className="text-muted-foreground">Page not found</p>
                  </div>
                </div>
              </Route>
            </Switch>
          </DashboardLayout>
        </Route>
      </Switch>
      <Toaster theme="dark" position="top-right" richColors />
    </>
  );
}
