# Golf VX Marketing HQ — Sonnet 4.6 Complete Handoff

**Version:** `6f1a6078` (Feb 24, 2026)
**Project:** `golf-vx-marketing-dashboard`
**Stack:** React 19 + Tailwind CSS 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL (TiDB)
**Total Code:** ~26,185 lines across server, client, schema, and styles

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [File Structure](#2-file-structure)
3. [Design System & Theming](#3-design-system--theming)
4. [Database Schema](#4-database-schema)
5. [tRPC Router Endpoints](#5-trpc-router-endpoints)
6. [Server Modules](#6-server-modules)
7. [Frontend Pages & Routing](#7-frontend-pages--routing)
8. [Sidebar Navigation](#8-sidebar-navigation)
9. [Current Data State](#9-current-data-state)
10. [Environment Variables](#10-environment-variables)
11. [Build & Test Commands](#11-build--test-commands)
12. [Key Patterns & Conventions](#12-key-patterns--conventions)
13. [Pending Work (TODO)](#13-pending-work-todo)
14. [Prompt Templates for Sonnet](#14-prompt-templates-for-sonnet)

---

## 1. Architecture Overview

This is a **full-stack TypeScript monorepo** running on the Manus platform. The frontend is a React 19 SPA with Tailwind CSS 4 and shadcn/ui components. The backend is Express 4 with tRPC 11 for type-safe RPC. The database is MySQL (TiDB) managed via Drizzle ORM. Authentication uses Manus OAuth with session cookies.

**Key architectural decisions:**
- **tRPC-first**: All API calls go through `trpc.*` hooks — no REST endpoints, no Axios/fetch wrappers
- **Superjson**: Dates and Decimals serialize/deserialize automatically
- **DashboardLayout**: All pages wrap in a shared sidebar layout component
- **Meta Ads via MCP + Cache**: Direct Meta Ads API is IP-blocked from the sandbox. Data is fetched via MCP (Meta Marketing tool) and stored in `.meta-ads-cache/insights.json`. The dashboard reads from this cache.
- **Light theme**: ThemeProvider set to `defaultTheme="dark"` but both light/dark CSS variables are identical (light theme). The brand uses white/yellow.

**Data flow:**
```
User → React Page → trpc.*.useQuery/useMutation → tRPC Router (server/routers.ts)
  → Query Helper (server/db.ts) → Drizzle ORM → MySQL (TiDB)
  → External APIs (Meta Ads cache, Acuity, Encharge, Boomerang)
```

---

## 2. File Structure

```
golf-vx-marketing-dashboard/
├── client/
│   ├── index.html                    # Entry HTML (Google Fonts commented out)
│   ├── public/                       # Static assets (currently empty)
│   └── src/
│       ├── main.tsx                  # React root, tRPC provider, auth redirect
│       ├── App.tsx                   # Routes (wouter) — 30+ routes
│       ├── index.css                 # Tailwind theme (OKLCH colors, Golf VX brand)
│       ├── const.ts                  # getLoginUrl() helper
│       ├── lib/trpc.ts              # tRPC client binding
│       ├── _core/hooks/useAuth.ts   # Auth hook
│       ├── contexts/ThemeContext.tsx # Theme provider
│       ├── components/
│       │   ├── DashboardLayout.tsx   # Sidebar layout (291 lines)
│       │   ├── DashboardLayoutSkeleton.tsx
│       │   ├── ErrorBoundary.tsx
│       │   ├── PublicLayout.tsx
│       │   ├── AIChatBox.tsx         # Chat UI component
│       │   ├── Map.tsx               # Google Maps component
│       │   ├── ActionCenter.tsx
│       │   ├── AlertsBanner.tsx
│       │   ├── CampaignKPI.tsx
│       │   ├── ManusDialog.tsx
│       │   ├── ROASBadge.tsx
│       │   ├── TrendChart.tsx
│       │   └── ui/                   # 53 shadcn/ui components
│       └── pages/                    # 38 page components (11,073 lines total)
├── server/
│   ├── _core/                        # Framework plumbing (DO NOT EDIT)
│   │   ├── index.ts                  # Server entry, scheduler registration
│   │   ├── env.ts                    # Environment variables
│   │   ├── context.ts                # tRPC context (user injection)
│   │   ├── oauth.ts                  # Manus OAuth
│   │   ├── llm.ts                    # invokeLLM() helper
│   │   ├── notification.ts           # notifyOwner() helper
│   │   ├── imageGeneration.ts        # generateImage() helper
│   │   └── voiceTranscription.ts     # transcribeAudio() helper
│   ├── routers.ts                    # ALL tRPC endpoints (2,201 lines)
│   ├── db.ts                         # Query helpers (1,000 lines)
│   ├── autonomous.ts                 # AI marketing engine (922 lines)
│   ├── metaAds.ts                    # Meta Ads API client (484 lines)
│   ├── metaAdsCache.ts               # Cache reader (242 lines)
│   ├── metaAdsMCP.ts                 # MCP integration
│   ├── metaAdsRetry.ts               # Retry logic with exponential backoff
│   ├── metaAdsAlerts.ts              # Alert generation for campaign anomalies
│   ├── refreshMetaAdsCache.ts        # Cache refresh via direct API
│   ├── acuity.ts                     # Acuity Scheduling API (596 lines)
│   ├── encharge.ts                   # Encharge email marketing API (166 lines)
│   ├── scheduler.ts                  # 8am/6pm CST cron (68 lines)
│   ├── seed-demo.ts                  # Demo data seeder
│   ├── giveawaySync.ts               # Giveaway DB reader
│   ├── googleSheets.ts               # No-op (rclone removed)
│   ├── storage.ts                    # S3 helpers (storagePut/storageGet)
│   └── *.test.ts                     # 19 test files
├── drizzle/
│   └── schema.ts                     # Database schema (1,191 lines, 39 tables)
├── shared/
│   ├── types.ts                      # Re-exports from schema
│   └── _core/errors.ts
├── .meta-ads-cache/
│   └── insights.json                 # Meta Ads campaign data cache
├── todo.md                           # Project task tracker
├── vitest.config.ts                  # Test configuration
└── package.json
```

---

## 3. Design System & Theming

**Brand:** Golf VX — Yellow (#FFD700) on white, Inter font family, light theme.

**CSS Variables (OKLCH format in `client/src/index.css`):**
```css
--primary: oklch(0.80 0.18 90);           /* Bright Yellow #FFD700 */
--primary-foreground: oklch(0.20 0 0);    /* Dark text on yellow */
--background: oklch(0.98 0 0);            /* Off-white #FAFAFA */
--foreground: oklch(0.20 0 0);            /* Dark gray #2D2D2D */
--card: oklch(1 0 0);                     /* White */
--card-foreground: oklch(0.20 0 0);       /* Dark gray */
--muted: oklch(0.94 0 0);                 /* Light gray */
--muted-foreground: oklch(0.50 0 0);      /* Medium gray */
--destructive: oklch(0.55 0.25 25);       /* Red */
--border: oklch(0.88 0 0);               /* Light gray border */
--accent: oklch(0.94 0 0);               /* Light gray accent */
--accent-foreground: oklch(0.20 0 0);     /* Dark text on accent */
```

**Typography:**
- Body: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Headings: `Inter, font-weight: 900, letter-spacing: -0.02em`
- Note: Google Fonts CDN link is commented out in `client/index.html` — Inter loads from system fonts

**Path aliases:**
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

**53 shadcn/ui components available:** accordion, alert, avatar, badge, button, card, carousel, chart, checkbox, command, dialog, drawer, dropdown-menu, form, input, label, popover, progress, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, tooltip, etc.

---

## 4. Database Schema

**39 tables** in MySQL (TiDB). Key tables:

### `campaigns` (7 rows) — The core entity for marketing programs
```typescript
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "trial_conversion", "membership_acquisition",
    "member_retention", "corporate_events"
  ]).notNull(),
  type: mysqlEnum("type", [
    "trial_conversion", "membership_acquisition", "corporate_events",
    "member_retention", "pbga_programs", "event_specific"
  ]).notNull(),
  status: mysqlEnum("status", ["planned", "active", "completed", "paused"]).notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
  actualSpend: decimal("actualSpend", { precision: 10, scale: 2 }).notNull(),
  targetRevenue: decimal("targetRevenue", { precision: 10, scale: 2 }),
  actualRevenue: decimal("actualRevenue", { precision: 10, scale: 2 }).notNull(),
  targetApplications: int("targetApplications"),
  actualApplications: int("actualApplications").notNull(),
  targetConversions: int("targetConversions"),
  actualConversions: int("actualConversions").notNull(),
  metaAdsCampaignId: varchar("metaAdsCampaignId", { length: 64 }),
  metaAdsBudget: decimal("metaAdsBudget", { precision: 10, scale: 2 }),
  metaAdsSpend: decimal("metaAdsSpend", { precision: 10, scale: 2 }),
  // ... additional fields: goalType, goalTarget, kpiMetric, kpiTarget, etc.
});
```

### Other key tables (row counts):
| Table | Rows | Purpose |
|-------|------|---------|
| `members` | 54 | Customer/member database |
| `giveawayApplications` | 43 | Imported from Google Sheets (37 real, 6 test) |
| `anniversary_giveaway_entries` | 46 | Form submissions |
| `email_captures` | 55 | Lead capture records |
| `autonomous_actions` | 21 | AI-generated marketing actions |
| `autonomous_sync_status` | 1 | Data source sync tracking |
| `users` | 1 | Admin user (Studio Soo) |

### All 39 tables:
`__drizzle_migrations`, `aiRecommendations`, `anniversary_giveaway_entries`, `autonomous_actions`, `autonomous_sync_status`, `boost_schedule`, `campaignExpenses`, `campaignIdeas`, `campaign_actions`, `campaign_alerts`, `campaign_metrics`, `campaigns`, `channelMetrics`, `channels`, `communication_logs`, `content_queue`, `daily_action_plans`, `email_captures`, `giveawayApplications`, `instagram_insights`, `instagram_posts`, `instagram_recommendations`, `landing_pages`, `marketing_insights`, `media_categories`, `media_file_tags`, `media_files`, `media_tags`, `media_usage`, `memberAppointments`, `memberTransactions`, `members`, `page_analytics`, `program_campaigns`, `reports`, `revenue`, `tasks`, `userActions`, `users`

For the full schema, read `drizzle/schema.ts` (1,191 lines).

---

## 5. tRPC Router Endpoints

All endpoints are in `server/routers.ts` (2,201 lines). Router groups:

| Router Group | Key Endpoints | Auth |
|-------------|---------------|------|
| `auth` | `me`, `logout` | public |
| `campaigns` | `list`, `getById`, `create`, `update`, `getByStatus`, `getSundayClinicMetrics`, `getWinterClinicMetrics`, `getCategorySummary`, `getGoalTemplates`, `calculatePerformance` | protected |
| `strategicCampaigns` | `getOverview`, `getProgramCampaigns`, `setProgramCampaigns` | protected |
| `channels` | `list` | protected |
| `members` | `list`, `getById`, `create`, `update`, `delete`, `getStats`, `getSegments`, `importFromCSV`, `syncFromAcuity`, `findDuplicates`, `mergeMembers` | protected |
| `revenue` | (revenue tracking) | protected |
| `tasks` | `list` | protected |
| `dashboard` | (overview metrics) | protected |
| `budgets` | `getCampaignExpenses`, `addExpense`, `updateExpense`, `deleteExpense` | protected |
| `metaAds` | `getAllCampaignsWithInsights`, `getCampaignInsights`, `getAccountInsights`, `refreshCache`, `getActiveAlerts`, `checkAllCampaignAlerts` | protected |
| `encharge` | `getAccount`, `getSegments`, `getMetrics` | protected |
| `conversion` | (conversion tracking) | protected |
| `giveaway` | `getPerformanceWithROAS`, `getApplications`, `getStats`, `sync`, `getLastSyncInfo` | protected |
| `reports` | `list`, `getById`, `generate` | protected |
| `intelligence` | `getAlerts`, `markActionComplete`, `dismissAlert`, `getDailyBriefing`, `getRecommendation`, `executeRecommendation`, `getStrategicKPIs`, `generateReport`, `generateCampaignIdeas`, `getCampaignHistory` | protected |
| `anniversaryGiveaway` | `submitEntry`, `submitApplication` | public |
| `dailyActions` | `getTodayPlan`, `generatePlan`, `completeAction`, `skipAction` | protected |
| `instagram` | `syncInsights`, `getInsights`, `generateRecommendations`, `getRecommendations`, `implementRecommendation` | protected |
| `autonomous` | `getSyncStatus`, `getAutoExecuted`, `getApprovalCards`, `getMonitoring`, `getAllActions`, `syncAllData`, `approveAction`, `rejectAction`, `undoAction`, `seedDemo` | mixed |
| `system` | `notifyOwner` | protected |

---

## 6. Server Modules

| Module | Lines | Purpose |
|--------|-------|---------|
| `routers.ts` | 2,201 | All tRPC endpoints |
| `db.ts` | 1,000 | Database query helpers (Drizzle) |
| `autonomous.ts` | 922 | AI marketing engine (LLM analysis, action generation, execution) |
| `acuity.ts` | 596 | Acuity Scheduling API (appointments, types, availability) |
| `metaAds.ts` | 484 | Meta Ads API client (campaigns, insights, budget changes) |
| `metaAdsCache.ts` | 242 | Cache reader for `.meta-ads-cache/insights.json` |
| `encharge.ts` | 166 | Encharge email marketing API |
| `refreshMetaAdsCache.ts` | ~100 | Cache refresh via direct API (fallback: keeps existing cache) |
| `scheduler.ts` | 68 | node-cron: 8am/6pm CST sync jobs |
| `seed-demo.ts` | ~150 | Demo data seeder for autonomous engine |
| `giveawaySync.ts` | ~80 | Reads giveaway applications from DB |
| `metaAdsMCP.ts` | ~50 | MCP Meta Marketing integration |
| `metaAdsRetry.ts` | ~100 | Retry logic with exponential backoff |
| `metaAdsAlerts.ts` | ~150 | Alert generation for campaign anomalies |

---

## 7. Frontend Pages & Routing

All routes in `client/src/App.tsx`:

| Route | Component | In Sidebar? |
|-------|-----------|-------------|
| `/` | `Home` (Marketing HQ) | Yes |
| `/marketing-intelligence` | `MarketingIntelligence` | Yes |
| `/programs` | `Programs` | Yes |
| `/strategic-campaigns` | `StrategicCampaigns` | Yes |
| `/meta-ads` | `MetaAds` | Yes |
| `/meta-ads/campaign/:id` | `MetaAdsCampaignDetail` | No |
| `/budget` | `BudgetManager` | Yes |
| `/instagram` | `InstagramViewer` | Yes |
| `/members` | `Members` | Yes |
| `/members/:id` | `MemberProfile` | No |
| `/annual-giveaway` | `AnnualGiveaway` | No |
| `/sunday-clinic` | `SundayClinicDetail` | No |
| `/winter-clinic` | `WinterClinicDetail` | No |
| `/trial-session` | `TrialSession` | No |
| `/drive-day` | `DriveDay` | No |
| `/junior-summer-camp` | `JuniorSummerCamp` | No |
| `/anniversary-giveaway` | `AnniversaryGiveaway` | No |
| `/anniversary-giveaway-application` | `AnniversaryGiveawayApplication` | No |
| `/email-marketing` | `EmailMarketing` | No |
| `/roi` | `ROI` | No |
| `/channels` | `Channels` | No |
| `/revenue` | `Revenue` | No |
| `/tasks` | `Tasks` | No |
| `/reports` | `Reports` | No |
| `/campaign-visuals` | `CampaignVisuals` | No |
| `/calendar` | `CalendarViewer` | No |
| `/timeline` | `CampaignTimeline` | No |
| `/category/:id` | `CategoryDetail` | No |
| `/campaign/:id` | `CampaignDetail` | No |

---

## 8. Sidebar Navigation

```typescript
const menuItems = [
  { icon: LayoutDashboard, label: "Marketing HQ", path: "/" },
  { icon: Sparkles, label: "Marketing Intelligence", path: "/marketing-intelligence" },
  { icon: Target, label: "Programs", path: "/programs" },
  { icon: BarChart3, label: "Strategic Campaigns", path: "/strategic-campaigns" },
  { icon: Share2, label: "Meta Ads", path: "/meta-ads" },
  { icon: Wallet, label: "Budget Manager", path: "/budget" },
  { icon: Instagram, label: "Instagram", path: "/instagram" },
  { icon: Users, label: "Members", path: "/members" },
];
```

---

## 9. Current Data State

### Campaigns (Programs) in Database

| ID | Name | Status | Meta Ads ID | Budget | Actual Spend | Category |
|----|------|--------|-------------|--------|-------------|----------|
| 1 | PBGA Junior Summer Camp | active | 120239269191520217 | $100 | $293.16 | trial_conversion |
| 2 | Sunday Clinic | active | null | $500 | $120.00 | trial_conversion |
| 3 | PBGA Winter Clinic | completed | null | $300 | $266.00 | trial_conversion |
| 4 | $25 1-Hour Trial Session | active | null | $200 | $55.20 | trial_conversion |
| 5 | Annual Membership Giveaway | active | 120239570172470217, 120239627905950217 | $3,000 | $467.59 | membership_acquisition |
| 7 | Instagram Follower Growth | completed | 120238971719500217 | $200 | $43.24 | membership_acquisition |
| 30001 | Superbowl Watch Party | completed | 120238976291690217 | $100 | $75.43 | member_retention |

### Meta Ads Cache

| Campaign ID | Name | Status | Spend | Impressions | Reach | Clicks | CTR |
|-------------|------|--------|-------|-------------|-------|--------|-----|
| 120239570172470217 | Golf VX Annual Giveaway - A1 | ACTIVE | $342.64 | 38,651 | 13,833 | 448 | 1.16% |
| 120239627905950217 | Golf VX Annual Giveaway - A2 | ACTIVE | $124.95 | 8,825 | 4,464 | 283 | 3.21% |
| 120238971719500217 | IG_$100 Giveaway_Feb2026 | PAUSED | $43.24 | 15,528 | 14,788 | 47 | 0.30% |
| 120239269191520217 | JUNIOR GOLF SUMMER CAMP 2026 | ACTIVE | $293.16 | 57,557 | 34,131 | 1,104 | 1.92% |
| 120238976291690217 | Superbowl Watch Party_Feb2026 | PAUSED | $75.43 | 4,167 | 1,847 | 57 | 1.37% |

---

## 10. Environment Variables

**System (auto-injected):** `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, `OWNER_NAME`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`

**Configured & Working:**
- `META_ADS_ACCESS_TOKEN` — Meta Ads API token
- `META_ADS_ACCOUNT_ID` — Meta Ads account ID
- `ACUITY_USER_ID` — `37404654` (working, 3 tests pass)
- `ACUITY_API_KEY` — Acuity API key (working)
- `ENCHARGE_API_KEY` — Encharge API key (partially working)
- `ENCHARGE_WRITE_KEY` — Encharge write key
- `BOOMERANG_API_TOKEN` — Boomerang loyalty API token

**Referenced but NOT configured:** `CLICKFUNNELS_API_KEY`, `TOAST_API_TOKEN`, `TOAST_RESTAURANT_GUID`

---

## 11. Build & Test Commands

```bash
pnpm dev          # Start dev server (tsx watch)
pnpm build        # Production build (vite + esbuild)
pnpm check        # TypeScript type checking (tsc --noEmit)
pnpm test         # Run all vitest tests
pnpm db:push      # Generate + migrate database schema (drizzle-kit)
```

**Test Results:** 103 passing / 20 failing (all failures are external API issues — IP-blocked Meta Ads, unconfigured ClickFunnels/GA4/Instagram, deprecated dashboard endpoints)

---

## 12. Key Patterns & Conventions

### Adding a New Feature (Build Loop)
1. **Schema:** Add table in `drizzle/schema.ts`, run `pnpm db:push`
2. **Query helpers:** Add functions in `server/db.ts`
3. **Router:** Add tRPC procedures in `server/routers.ts`
4. **UI:** Create page in `client/src/pages/FeatureName.tsx`
5. **Route:** Register in `client/src/App.tsx`
6. **Sidebar (optional):** Add to `menuItems` in `DashboardLayout.tsx`
7. **Tests:** Write vitest specs in `server/featureName.test.ts`

### Page Component Pattern
```tsx
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function MyPage() {
  const { data, isLoading } = trpc.myFeature.list.useQuery();
  const utils = trpc.useUtils();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">My Feature</h1>
        {/* Content here */}
      </div>
    </DashboardLayout>
  );
}
```

### tRPC Mutation with Optimistic Update
```tsx
const deleteMutation = trpc.myFeature.delete.useMutation({
  onMutate: async (deletedId) => {
    await utils.myFeature.list.cancel();
    const prev = utils.myFeature.list.getData();
    utils.myFeature.list.setData(undefined, (old) =>
      old?.filter(item => item.id !== deletedId)
    );
    return { prev };
  },
  onError: (err, id, context) => {
    utils.myFeature.list.setData(undefined, context?.prev);
  },
  onSettled: () => {
    utils.myFeature.list.invalidate();
  },
});
```

### Server-Side LLM Call
```typescript
import { invokeLLM } from "./server/_core/llm";

const response = await invokeLLM({
  messages: [
    { role: "system", content: "You are a marketing analyst." },
    { role: "user", content: `Analyze this campaign: ${JSON.stringify(data)}` },
  ],
});
const analysis = response.choices[0].message.content;
```

### Critical Rules
1. **NEVER edit files under `server/_core/`**
2. **NEVER hardcode port numbers**
3. **NEVER use `rclone`** — sandbox-only, not available in deployed environment
4. **NEVER store file bytes in database** — use S3 (`storagePut()`)
5. **Always use `protectedProcedure`** for authenticated endpoints
6. **Always use OKLCH color format** in Tailwind CSS 4 `@theme` blocks
7. **Always use `trpc.*.useQuery/useMutation`** — never raw fetch/axios
8. **Stabilize references** in query inputs (use `useState`/`useMemo`)
9. **Store timestamps as UTC milliseconds** in the database
10. **Use `window.location.origin`** for redirect URLs

---

## 13. Pending Work (TODO)

### High Priority
- [ ] Fix Encharge API token (returning errors)
- [ ] Add Twilio/SendGrid credentials for SMS/Email communication
- [ ] Configure second Meta Ads account (624963382940798) for older campaigns
- [ ] Contacts page (CRM-style contact management)

### Feature Improvements
- [ ] Improve Programs detail pages with richer data visualization
- [ ] Instagram Insights integration (needs API credentials)
- [ ] Toast POS integration (needs credentials)
- [ ] ClickFunnels integration (needs credentials)
- [ ] GA4 integration (needs credentials)

### UI/UX
- [ ] Mobile responsiveness polish
- [ ] Better skeleton loading states
- [ ] Google Fonts CDN link (Inter) — currently commented out

---

## 14. Prompt Templates for Sonnet

### Template A: Create a New Page Component

```
I'm working on a React 19 + Tailwind CSS 4 + tRPC 11 project (Golf VX Marketing HQ).

TECH STACK:
- React 19, wouter for routing, Tailwind CSS 4 with OKLCH colors
- shadcn/ui components imported from @/components/ui/*
- tRPC hooks: trpc.*.useQuery(), trpc.*.useMutation()
- DashboardLayout wrapper for all pages (import from @/components/DashboardLayout)
- Icons: lucide-react

DESIGN SYSTEM:
- Primary color: oklch(0.80 0.18 90) — bright yellow (#FFD700)
- Background: oklch(0.98 0 0) — off-white
- Font: Inter (system), headings weight 900
- Light theme only
- Use Card, CardHeader, CardTitle, CardContent from @/components/ui/card

PATTERN:
- Every page wraps in <DashboardLayout>
- Loading: <Loader2 className="h-8 w-8 animate-spin text-primary" />
- Data: trpc.routerName.endpointName.useQuery()
- Mutations: trpc.routerName.endpointName.useMutation() with onSuccess invalidation

TASK: Create a new page component for [DESCRIBE FEATURE].

The page should:
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

Output ONLY the complete TSX file content. Do not include explanations.
```

### Template B: Create a New tRPC Router + DB Helper

```
I'm working on a tRPC 11 + Drizzle ORM + MySQL project.

EXISTING PATTERNS:
- Router file: server/routers.ts (add to the appRouter object)
- DB helpers: server/db.ts (Drizzle query functions)
- Schema: drizzle/schema.ts (Drizzle table definitions)
- Auth: protectedProcedure (requires login), publicProcedure (no auth)
- Input validation: zod (z.object, z.string, z.number, etc.)

EXAMPLE ENDPOINT:
```typescript
myFeature: router({
  list: protectedProcedure.query(async () => {
    return await db.select().from(myTable).orderBy(desc(myTable.createdAt));
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await db.insert(myTable).values({ name: input.name });
      return { success: true };
    }),
}),
```

TASK: Create router endpoints for [DESCRIBE FEATURE].

Output:
1. The Drizzle schema table definition (for drizzle/schema.ts)
2. The tRPC router code (for server/routers.ts)
3. Any DB helper functions (for server/db.ts)
```

### Template C: Modify an Existing Page

```
I'm modifying an existing React page in the Golf VX Marketing HQ project.

CURRENT FILE CONTENT:
[PASTE THE CURRENT FILE CONTENT HERE]

CHANGES NEEDED:
1. [Change 1]
2. [Change 2]

CONSTRAINTS:
- Keep the DashboardLayout wrapper
- Use shadcn/ui components (import from @/components/ui/*)
- Use trpc.* hooks for data (no fetch/axios)
- Use lucide-react for icons
- Tailwind CSS 4 with OKLCH color variables
- Primary yellow: text-primary, bg-primary/10

Output the COMPLETE modified file.
```

### Template D: Write Vitest Tests

```
I'm writing vitest tests for a tRPC + Drizzle project.

TEST PATTERN:
```typescript
import { describe, it, expect } from "vitest";

describe("Feature Name", () => {
  it("should do something", async () => {
    const result = await someFunction();
    expect(result).toBeDefined();
  });
});
```

MODULE BEING TESTED:
[PASTE THE MODULE CODE HERE]

Write comprehensive vitest tests covering happy path, edge cases, and error handling.
Output ONLY the test file content.
```

---

## Workflow: Using Sonnet Output with Manus

1. **Copy the appropriate template** from Section 14
2. **Fill in the specifics** (feature description, current code, requirements)
3. **Paste into Sonnet 4.6** (via Genspark or direct)
4. **Review the output** — check for correct imports, tRPC patterns, shadcn/ui usage
5. **Bring the code back to Manus** with instructions like:
   - "Replace `client/src/pages/Programs.tsx` with this code: [paste]"
   - "Add this router to `server/routers.ts` under the `myFeature` key: [paste]"
   - "Add this table to `drizzle/schema.ts` and run `pnpm db:push`: [paste]"
6. **Manus will:** apply the code, run TypeScript checks, run tests, fix any issues, and save a checkpoint

---

*Generated by Manus AI — Version 6f1a6078 — Feb 24, 2026*
