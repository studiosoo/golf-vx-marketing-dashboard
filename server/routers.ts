import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { emailCaptureRouter } from "./emailCaptureRouter";
import { boomerangRouter } from "./boomerangRouter";
import { communicationRouter } from "./communicationRouter";

import { publicRouter, authRouter } from "./routers/auth";
import {
  campaignsRouter,
  reportsRouter,
  strategicCampaignsRouter,
  budgetsRouter,
  dashboardRouter,
} from "./routers/campaigns";
import { campaignsAiRouter } from "./routers/campaignsAi";
import { membersRouter, enchargeRouter } from "./routers/members";
import {
  intelligenceRouter,
  researchRouter,
  workspaceRouter,
  aiWorkspaceRouter,
  prioritiesRouter,
} from "./routers/intelligence";
import {
  anniversaryGiveawayRouter,
  giveawayRouter,
} from "./routers/programs";
import {
  instagramRouter,
  previewRouter,
  emailCampaignsRouter,
  funnelsRouter,
  newsRouter,
} from "./routers/content";
import {
  dailyActionsRouter,
  autonomousRouter,
  conversionRouter,
} from "./routers/automation";
import {
  influencerRouter,
  outreachRouter,
  printAdRouter,
  eventAdRouter,
  metaAdsRouter,
  revenueRouter,
} from "./routers/advertising";
import { asanaRouter } from "./routers/asana";
import { promosRouter } from "./routers/promos";
import { reportingRouter } from "./reportingRouter";

export const appRouter = router({
  system: systemRouter,
  emailCapture: emailCaptureRouter,
  boomerang: boomerangRouter,
  communication: communicationRouter,

  public: publicRouter,
  auth: authRouter,

  campaigns: campaignsRouter,
  campaignsAi: campaignsAiRouter,
  reports: reportsRouter,
  strategicCampaigns: strategicCampaignsRouter,
  budgets: budgetsRouter,
  dashboard: dashboardRouter,

  members: membersRouter,
  encharge: enchargeRouter,

  intelligence: intelligenceRouter,
  research: researchRouter,
  workspace: workspaceRouter,
  aiWorkspace: aiWorkspaceRouter,
  priorities: prioritiesRouter,

  anniversaryGiveaway: anniversaryGiveawayRouter,
  giveaway: giveawayRouter,

  instagram: instagramRouter,
  preview: previewRouter,
  emailCampaigns: emailCampaignsRouter,
  funnels: funnelsRouter,
  news: newsRouter,

  dailyActions: dailyActionsRouter,
  autonomous: autonomousRouter,
  conversion: conversionRouter,

  influencer: influencerRouter,
  outreach: outreachRouter,
  printAd: printAdRouter,
  eventAd: eventAdRouter,
  metaAds: metaAdsRouter,
  asana: asanaRouter,
  promos: promosRouter,
  revenue: revenueRouter,
  reporting: reportingRouter,
});

export type AppRouter = typeof appRouter;
