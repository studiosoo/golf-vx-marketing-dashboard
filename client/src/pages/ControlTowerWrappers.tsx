import { lazy } from "react";

const Home            = lazy(() => import("./Home"));
const Reports         = lazy(() => import("./Reports"));
const StrategicCampaigns = lazy(() => import("./StrategicCampaigns"));
const Production      = lazy(() => import("./Production"));
const Programs        = lazy(() => import("./Programs"));
const PromotionsHub   = lazy(() => import("./PromotionsHub"));
const CalendarViewer  = lazy(() => import("./CalendarViewer"));
const InstagramFeed   = lazy(() => import("./InstagramFeed"));
const Members         = lazy(() => import("./Members"));
const Autopilot       = lazy(() => import("./Autopilot"));
const Assistant       = lazy(() => import("./Assistant"));
const MarketResearch  = lazy(() => import("./MarketResearch"));
const Integrations    = lazy(() => import("./Integrations"));
const LocalMarketing  = lazy(() => import("./LocalMarketing"));

export function DashboardPageWrapper()           { return <Home />; }
export function ReportsPageWrapper()             { return <Reports />; }
export function StudioSooAutopilotWrapper()      { return <Autopilot />; }
export function StudioSooProductionWrapper()     { return <Production />; }
export function OperationsCampaignsWrapper()     { return <StrategicCampaigns />; }
export function OperationsProgramsWrapper()      { return <Programs />; }
export function OperationsPromotionsWrapper()    { return <PromotionsHub />; }
export function OperationsLocalMarketingWrapper(){ return <LocalMarketing />; }
export function OperationsContentWrapper()       { return <InstagramFeed />; }
export function OperationsCalendarWrapper()      { return <CalendarViewer />; }
export function AudiencePeopleWrapper()          { return <Members />; }
export function InsightsAskWrapper()             { return <Assistant />; }
export function InsightsResearchWrapper()        { return <MarketResearch />; }
export function AdminIntegrationsWrapper()       { return <Integrations />; }
