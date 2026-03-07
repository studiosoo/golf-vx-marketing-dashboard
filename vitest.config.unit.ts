/**
 * Unit test config — runs only tests that do NOT require live DB, external APIs,
 * or environment credentials. Safe to run in CI without secrets.
 *
 * Usage: pnpm test:unit
 *
 * Env-dependent tests (DB writes, live API calls) are excluded here.
 * They can still be run with: pnpm test (uses vitest.config.ts which runs all tests)
 */
import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    // Only include tests that are pure unit tests (no live DB/API calls)
    include: [
      "server/advertising.test.ts",
      "server/asana.test.ts",
      "server/auth.logout.test.ts",
      "server/autonomous.test.ts",
      "server/boomerangWebhook.test.ts",
      "server/clickfunnelsSyncService.test.ts",
      "server/encharge.bidirectional.test.ts",
      "server/enchargeBroadcastSync.test.ts",
      "server/eventAd.test.ts",
      "server/giveawayFiltered.test.ts",
      "server/googleSheetsSync.test.ts",
      "server/marketResearch.test.ts",
      "server/members.mrr.test.ts",
      "server/membershipWebhook.test.ts",
      "server/metaAdsEnhancements.test.ts",
      "server/preview.auth.test.ts",
      "server/priorities.test.ts",
      "server/programs.test.ts",
      "server/toastRevenue.test.ts",
      "server/trialSession.test.ts",
    ],
    // Env-dependent tests excluded from this config (require live DB/API):
    // acuity.test.ts, anniversaryGiveaway.test.ts, budgets.test.ts,
    // clickfunnels.test.ts, dashboard.test.ts, encharge.test.ts,
    // ga4.test.ts, gemini.test.ts, giveawaySync.test.ts,
    // instagram.test.ts, instagram.token.test.ts, instagramFeed.test.ts,
    // metaAds.integration.test.ts, strategicCampaigns.test.ts
  },
});
