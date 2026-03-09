import Home from "./Home";
import Reports from "./Reports";
import Performance from "./Performance";
import StrategicCampaigns from "./StrategicCampaigns";
import MetaAds from "./MetaAds";
import Programs from "./Programs";
import PromotionsHub from "./PromotionsHub";
import CommunicationsHub from "./CommunicationsHub";
import CalendarViewer from "./CalendarViewer";
import Tasks from "./Tasks";
import InstagramFeed from "./InstagramFeed";
import Members from "./Members";
import Duplicates from "./Duplicates";
import Autopilot from "./Autopilot";
import Assistant from "./Assistant";
import MarketResearch from "./MarketResearch";
import Integrations from "./Integrations";
import LocalMarketing from "./LocalMarketing";

export function DashboardPageWrapper() {
  return <Home />;
}

export function ReportsPageWrapper() {
  return <Reports />;
}

export function PerformancePageWrapper() {
  return <Performance />;
}

export function OperationsCampaignsWrapper() {
  return <StrategicCampaigns />;
}

export function OperationsPaidMediaWrapper() {
  return <MetaAds />;
}

export function OperationsProgramsWrapper() {
  return <Programs />;
}

export function OperationsPromotionsWrapper() {
  return <PromotionsHub />;
}

export function OperationsCommunicationsWrapper() {
  return <CommunicationsHub />;
}

export function OperationsLocalMarketingWrapper() {
  return <LocalMarketing />;
}

export function OperationsContentWrapper() {
  return <InstagramFeed />;
}

export function OperationsCalendarWrapper() {
  return <CalendarViewer />;
}

export function OperationsTasksWrapper() {
  return <Tasks />;
}

export function AudiencePeopleWrapper() {
  return <Members />;
}

export function AudienceDuplicatesWrapper() {
  return <Duplicates />;
}

export function InsightsRecommendationsWrapper() {
  return <Autopilot />;
}

export function InsightsAskWrapper() {
  return <Assistant />;
}

export function InsightsResearchWrapper() {
  return <MarketResearch />;
}

export function AdminIntegrationsWrapper() {
  return <Integrations />;
}
