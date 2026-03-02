import { Route, Switch } from "wouter";
import { Toaster } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import GuestDashboardLayout from "@/components/GuestDashboardLayout";

// Core pages
import Home from "@/pages/Home";
import Overview from "@/pages/Overview";
import Performance from "@/pages/Performance";
import Revenue from "@/pages/Revenue";
import Preview from "@/pages/Preview";

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

// ─── Guest Preview Pages ───────────────────────────────────────────────────
import GuestHome from "@/pages/guest/GuestHome";
import GuestOverview from "@/pages/guest/GuestOverview";
import GuestPerformance from "@/pages/guest/GuestPerformance";
import GuestRevenue from "@/pages/guest/GuestRevenue";
import GuestMarketingIntelligence from "@/pages/guest/GuestMarketingIntelligence";
import GuestAIActions from "@/pages/guest/GuestAIActions";
import GuestNewsManager from "@/pages/guest/GuestNewsManager";
import GuestMembers from "@/pages/guest/GuestMembers";
import GuestGuests from "@/pages/guest/GuestGuests";
import GuestLeads from "@/pages/guest/GuestLeads";
import GuestCampaigns from "@/pages/guest/GuestCampaigns";
import GuestMetaAds from "@/pages/guest/GuestMetaAds";
import GuestEmailCampaigns from "@/pages/guest/GuestEmailCampaigns";
import GuestFunnels from "@/pages/guest/GuestFunnels";
import GuestAutomations from "@/pages/guest/GuestAutomations";
import GuestDripCampaigns from "@/pages/guest/GuestDripCampaigns";
import GuestAnnouncements from "@/pages/guest/GuestAnnouncements";
import GuestPrograms from "@/pages/guest/GuestPrograms";
import GuestLeagues from "@/pages/guest/GuestLeagues";
import GuestPrivateEvents from "@/pages/guest/GuestPrivateEvents";
import GuestSiteControl from "@/pages/guest/GuestSiteControl";
import GuestIntegrations from "@/pages/guest/GuestIntegrations";
import GuestAccountSettings from "@/pages/guest/GuestAccountSettings";

export default function App() {
  return (
    <>
      <Switch>
        {/* Public preview - no auth required */}
        <Route path="/preview" component={Preview} />

        {/* ─── Guest Preview Routes (no auth required) ─── */}
        <Route path="/guest/:rest*">
          <GuestDashboardLayout>
            <Switch>
              <Route path="/guest" component={GuestHome} />
              <Route path="/guest/overview" component={GuestOverview} />
              <Route path="/guest/performance" component={GuestPerformance} />
              <Route path="/guest/revenue" component={GuestRevenue} />
              {/* Intelligence */}
              <Route path="/guest/intelligence" component={GuestMarketingIntelligence} />
              <Route path="/guest/intelligence/ai-actions" component={GuestAIActions} />
              <Route path="/guest/intelligence/news" component={GuestNewsManager} />
              {/* Members */}
              <Route path="/guest/members" component={GuestMembers} />
              <Route path="/guest/guests" component={GuestGuests} />
              <Route path="/guest/leads" component={GuestLeads} />
              {/* Campaigns */}
              <Route path="/guest/campaigns" component={GuestCampaigns} />
              <Route path="/guest/campaigns/meta-ads" component={GuestMetaAds} />
              <Route path="/guest/campaigns/email" component={GuestEmailCampaigns} />
              <Route path="/guest/campaigns/funnels" component={GuestFunnels} />
              <Route path="/guest/campaigns/automations" component={GuestAutomations} />
              <Route path="/guest/campaigns/drip" component={GuestDripCampaigns} />
              <Route path="/guest/announcements" component={GuestAnnouncements} />
              {/* Programs */}
              <Route path="/guest/programs" component={GuestPrograms} />
              <Route path="/guest/programs/leagues" component={GuestLeagues} />
              <Route path="/guest/programs/events" component={GuestPrivateEvents} />
              {/* Tools */}
              <Route path="/guest/site-control" component={GuestSiteControl} />
              <Route path="/guest/integrations" component={GuestIntegrations} />
              <Route path="/guest/settings" component={GuestAccountSettings} />
              {/* Fallback to guest home */}
              <Route component={GuestHome} />
            </Switch>
          </GuestDashboardLayout>
        </Route>

        {/* Also handle exact /guest path */}
        <Route path="/guest">
          <GuestDashboardLayout>
            <GuestHome />
          </GuestDashboardLayout>
        </Route>

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
