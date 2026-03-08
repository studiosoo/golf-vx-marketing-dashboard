import Home from "./Home";
import ReportsWorkspacePage from "./app/reports/ReportsWorkspacePage";
import Performance from "./Performance";
import StrategicCampaigns from "./StrategicCampaigns";
import MetaAds from "./MetaAds";
import Programs from "./Programs";
import PromotionsHub from "./PromotionsHub";
import CommunicationsHub from "./CommunicationsHub";
import CalendarViewer from "./CalendarViewer";
import InstagramFeed from "./InstagramFeed";
import Members from "./Members";
import Duplicates from "./Duplicates";
import Autopilot from "./Autopilot";
import Assistant from "./Assistant";
import MarketResearch from "./MarketResearch";
import Integrations from "./Integrations";
import TasksPage from "./app/operations/TasksPage";

export function DashboardPageWrapper() {
  return <Home />;
}

export function ReportsPageWrapper() {
  return <ReportsWorkspacePage />;
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

export function OperationsContentWrapper() {
  return <InstagramFeed />;
}

export function OperationsCalendarWrapper() {
  return <CalendarViewer />;
}

export function OperationsTasksWrapper() {
  return <TasksPage />;
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
