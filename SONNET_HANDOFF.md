# Golf VX Marketing Dashboard — Sonnet 4.6 Handoff Guide

## Project Overview

This is a **React 19 + Express 4 + tRPC 11 + Drizzle ORM** marketing dashboard for **Golf VX Arlington Heights**, an indoor golf facility. The dashboard manages marketing campaigns, member data, Meta Ads analytics, email marketing (Encharge), appointment scheduling (Acuity), loyalty programs (Boomerang), and an autonomous AI marketing intelligence engine.

**Total codebase:** ~34,400 lines of TypeScript/TSX across 120+ files.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, Recharts, Wouter (routing) |
| Backend | Express 4, tRPC 11, Superjson |
| Database | MySQL (TiDB) via Drizzle ORM |
| Auth | Manus OAuth (cookie-based sessions) |
| File Storage | AWS S3 (via built-in helpers) |
| LLM | Built-in `invokeLLM()` helper (server-side only) |
| Testing | Vitest |
| Build | Vite 7 |

---

## Project Structure

```
golf-vx-marketing-dashboard/
├── client/
│   ├── src/
│   │   ├── pages/           ← 30+ page components
│   │   ├── components/      ← Reusable UI + shadcn/ui
│   │   ├── contexts/        ← ThemeContext
│   │   ├── hooks/           ← Custom hooks
│   │   ├── lib/trpc.ts      ← tRPC client binding
│   │   ├── App.tsx           ← Routes (Wouter)
│   │   ├── main.tsx          ← Providers
│   │   └── index.css         ← Global theme (OKLCH colors)
│   └── public/              ← Static assets
├── server/
│   ├── _core/               ← DO NOT EDIT (OAuth, context, LLM, etc.)
│   ├── routers.ts           ← All tRPC endpoints (2200 lines)
│   ├── db.ts                ← Query helpers (1000 lines)
│   ├── autonomous.ts        ← AI marketing engine (922 lines)
│   ├── metaAds.ts           ← Meta Ads API client
│   ├── metaAdsCache.ts      ← Meta Ads cache layer
│   ├── encharge.ts          ← Encharge email marketing
│   ├── acuity.ts            ← Acuity Scheduling API
│   ├── scheduler.ts         ← 8am/6pm CST cron jobs
│   ├── seed-demo.ts         ← Demo data seeder
│   ├── storage.ts           ← S3 file storage
│   └── *.test.ts            ← Vitest test files
├── drizzle/
│   ├── schema.ts            ← Database tables (1191 lines)
│   └── relations.ts         ← Table relationships
├── shared/                  ← Shared types/constants
└── .meta-ads-cache/         ← Meta Ads cached data
```

---

## Database Schema (Key Tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Auth users | id, openId, name, email, role (admin/user) |
| `campaigns` | Marketing programs | id, name, category, type, status, metaAdsCampaignId, budget, actualSpend, goalType, goalTarget |
| `programCampaigns` | Program-to-strategic-campaign mapping | programId, strategicCampaign |
| `members` | Customer records | id, name, email, membershipTier, enchargeUserId, acuityClientId, boomerangCustomerId |
| `memberAppointments` | Acuity booking history | memberId, acuityAppointmentId, appointmentType, price |
| `memberTransactions` | Toast POS purchases | memberId, toastOrderGuid, amount |
| `giveawayApplications` | Anniversary giveaway entries | name, email, golfExperienceLevel, status |
| `revenue` | Revenue tracking | date, amount, source |
| `channels` | Marketing channels | name, type, isActive |
| `channelMetrics` | Channel performance | channelId, impressions, clicks, conversions |
| `campaignExpenses` | Manual expense tracking | campaignId, category, amount |
| `autonomousSyncStatus` | AI engine sync state | source, status, lastSyncAt |
| `autonomousActions` | AI-generated marketing actions | campaignId, actionType, riskLevel, status |
| `landingPages` | Landing page configs | slug, title, heroConfig |
| `pageAnalytics` | Page view tracking | pageId, eventType, sessionId |
| `aiRecommendations` | AI marketing recommendations | type, title, priority, status |
| `userActions` | User action log | userId, actionType, details |
| `anniversaryGiveawayEntries` | Simple giveaway form | name, email, phone |

---

## Current Programs (Database State)

| ID | Name | Status | Meta Ad ID | Meta Spend | Budget |
|----|------|--------|------------|------------|--------|
| 1 | PBGA Junior Summer Camp | active | 120239269191520217 | $293.16 | $100 |
| 2 | Sunday Clinic | active | NULL | $0 | $500 |
| 3 | PBGA Winter Clinic | completed | NULL | $0 | $300 |
| 4 | $25 1-Hour Trial Session | active | NULL | $0 | $200 |
| 5 | Annual Membership Giveaway | active | 120239570172470217, 120239627905950217 | $467.59 | $3,000 |
| 7 | Instagram Follower Growth | completed | 120238971719500217 | $43.24 | $200 |
| 30001 | Superbowl Watch Party | completed | 120238976291690217 | $75.43 | $100 |

**Other data:** 54 members, 43 giveaway applications (37 real + 6 test)

---

## Meta Ads Cache (`.meta-ads-cache/insights.json`)

The cache stores live campaign data fetched from Meta Ads API via MCP. Current contents:

| Campaign ID | Name | Status | Spend |
|-------------|------|--------|-------|
| 120239570172470217 | Golf VX Annual Giveaway - A1 Local Awareness | ACTIVE | $342.64 |
| 120239627905950217 | Golf VX Annual Giveaway - A2 Social/Family | ACTIVE | $124.95 |
| 120238971719500217 | IG_$100 Giveaway_Feb2026 | PAUSED | $43.24 |
| 120239269191520217 | JUNIOR GOLF SUMMER CAMP 2026 | ACTIVE | $293.16 |
| 120238976291690217 | Superbowl Watch Party_Feb2026 | PAUSED | $75.43 |

**Meta Ads Account ID:** Stored in env as `META_ADS_ACCOUNT_ID`
**Note:** Direct API calls from sandbox are blocked by IP. Use MCP (`meta-marketing` server) for data fetching.

---

## tRPC Router Structure (server/routers.ts)

All endpoints are in a single file. Key routers:

| Router | Endpoints | Purpose |
|--------|-----------|---------|
| `public` | trackPageEvent, getLandingPage | Public landing page analytics |
| `auth` | me, logout | Authentication |
| `campaigns` | list, getById, create, update, getByStatus, getSundayClinicMetrics, getWinterClinicMetrics, getGoalTemplates, calculatePerformance | Program management |
| `strategicCampaigns` | getOverview, getProgramCampaigns, setProgramCampaigns | Strategic campaign categories |
| `members` | list, getById, create, update, delete, getStats, getSegments, importFromCSV, syncFromAcuity, findDuplicates, mergeMembers | Member management |
| `metaAds` | getAllCampaignsWithInsights, getCampaignInsights, getAccountInsights, refreshCache | Meta Ads data |
| `encharge` | getAccount | Encharge email marketing |
| `giveaway` | sync, getLastSyncInfo | Giveaway data sync |
| `intelligence` | getAlerts, markActionComplete, dismissAlert, getDailyBriefing, getRecommendation, executeRecommendation, getStrategicKPIs, generateReport, generateCampaignIdeas, getCampaignHistory | AI marketing intelligence |
| `autonomous` | getSyncStatus, getAutoExecuted, getApprovalCards, getMonitoring, getAllActions, syncAllData, approveAction, rejectAction, undoAction, seedDemo | Autonomous AI engine |
| `budgets` | getCampaignExpenses, addExpense, updateExpense, deleteExpense | Budget management |
| `instagram` | syncInsights, getInsights, generateRecommendations, getRecommendations, implementRecommendation | Instagram analytics |
| `dailyActions` | getTodayPlan, generatePlan, completeAction, skipAction | Daily action plans |
| `anniversaryGiveaway` | submitEntry, submitApplication | Public giveaway forms |
| `reports` | list, getById, generate | Report generation |

---

## Environment Variables

**System (auto-injected, DO NOT hardcode):**
- `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`
- `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`
- `OWNER_OPEN_ID`, `OWNER_NAME`

**Custom (configured via webdev_request_secrets):**
- `META_ADS_ACCESS_TOKEN` — Meta Graph API access token
- `META_ADS_ACCOUNT_ID` — Meta Ads account ID
- `ACUITY_USER_ID` — Acuity Scheduling User ID (37404654)
- `ACUITY_API_KEY` — Acuity Scheduling API Key
- `ENCHARGE_API_KEY` — Encharge email marketing API key
- `ENCHARGE_WRITE_KEY` — Encharge write key
- `BOOMERANG_API_TOKEN` — Boomerangme loyalty API token

---

## Design System

- **Theme:** Light mode (Golf VX brand)
- **Primary color:** Yellow (`oklch(0.80 0.18 90)` / #FFD700)
- **Font:** Inter (Google Fonts CDN)
- **Layout:** DashboardLayout with sidebar navigation
- **Components:** shadcn/ui (Radix primitives + Tailwind)
- **Charts:** Recharts + Chart.js

---

## Build Loop (How to Add Features)

1. **Schema:** Edit `drizzle/schema.ts`, then run `pnpm db:push`
2. **Query helpers:** Add to `server/db.ts`
3. **tRPC procedures:** Add to `server/routers.ts` (use `protectedProcedure` for auth-required)
4. **Frontend:** Create page in `client/src/pages/`, use `trpc.*.useQuery/useMutation`
5. **Route:** Register in `client/src/App.tsx`
6. **Sidebar:** Add to `menuItems` array in `client/src/components/DashboardLayout.tsx`
7. **Test:** Write vitest specs in `server/*.test.ts`, run `pnpm test`

---

## Testing

Run tests: `pnpm test` or `npx vitest run <file>`

**Currently passing (103 tests):**
- `autonomous.test.ts` (28) — AI engine logic
- `programs.test.ts` (13) — Program CRUD
- `strategicCampaigns.test.ts` (8) — Strategic campaigns
- `metaAdsEnhancements.test.ts` (11) — Meta Ads cache
- `anniversaryGiveaway.test.ts` (4) — Giveaway forms
- `giveawaySync.test.ts` (5) — Giveaway sync
- `encharge.bidirectional.test.ts` (5) — Encharge sync
- `encharge.test.ts` (3) — Encharge API
- `budgets.test.ts` (9/10) — Budget management
- `auth.logout.test.ts` (1) — Auth
- `gemini.test.ts` (1) — LLM integration

**Known failures (20):** All from direct Meta Ads API calls blocked by sandbox IP. Not a code issue.

---

## Pending Work Items

### High Priority
1. **Fix Encharge API token** — Currently returns "Token without payload" errors. Need valid API key.
2. **Add Twilio/SendGrid credentials** — Communication panel (SMS/Email) is built but needs credentials.
3. **Configure second Meta Ads account** (ID: 624963382940798) — Historical campaigns from older account.

### Feature Improvements
4. **Programs page data accuracy** — Some programs may need description/budget updates.
5. **Instagram Insights integration** — Instagram sync page exists but needs API credentials.
6. **Member sync from Acuity** — "Sync from Acuity" button on Members page needs testing with real data.
7. **Toast POS integration** — Transaction sync module exists but needs Toast API credentials.
8. **ClickFunnels integration** — Module exists but needs credentials.
9. **GA4 integration** — Module exists but needs credentials.

### UI/UX Improvements
10. **Mobile responsiveness** — Dashboard is desktop-first, mobile experience needs polish.
11. **Loading states** — Some pages could use better skeleton loading.
12. **Error boundaries** — Add more granular error handling per section.

---

## Critical Rules for Code Changes

1. **NEVER edit files under `server/_core/`** — Framework plumbing, will break everything.
2. **NEVER hardcode port numbers** — Server uses dynamic port assignment.
3. **NEVER use `rclone`** — Sandbox-only utility, not available in deployed environment.
4. **NEVER store file bytes in database** — Use S3 (`storagePut()`) for files, store URL in DB.
5. **Always use `protectedProcedure`** for authenticated endpoints, `publicProcedure` for public ones.
6. **Always use OKLCH color format** in Tailwind CSS 4's `@theme` blocks.
7. **Always use `trpc.*.useQuery/useMutation`** — Never use raw fetch/axios.
8. **Always stabilize references** in query inputs (use `useState`/`useMemo` to prevent infinite loops).
9. **Store timestamps as UTC milliseconds** in the database.
10. **Use `window.location.origin`** for redirect URLs — never hardcode domains.

---

## How to Use This Document with Sonnet 4.6

### Step 1: Share This Document
Copy-paste this entire document into Sonnet 4.6 as context.

### Step 2: Share the Specific File(s) You Want Changed
For each task, copy-paste the relevant file content. For example:
- To modify the Programs page → paste `client/src/pages/Programs.tsx`
- To add a new tRPC endpoint → paste `server/routers.ts` (relevant section)
- To modify the schema → paste `drizzle/schema.ts`

### Step 3: Give a Clear Task Prompt
Use this template:

```
I'm working on a Golf VX Marketing Dashboard (React 19 + tRPC 11 + Drizzle ORM).
Here is the project context: [paste this handoff doc]
Here is the current file I need modified: [paste file content]

Task: [describe what you want]

Rules:
- Use shadcn/ui components (import from @/components/ui/*)
- Use tRPC hooks (trpc.*.useQuery/useMutation) for data
- Use Tailwind CSS for styling
- Use OKLCH colors in theme blocks
- Return the complete modified file
```

### Step 4: Bring the Code Back to Manus
After Sonnet generates the code, come back to Manus and say:
"Apply this code to [filename]" and paste the generated code.

Manus will:
- Write the file to the sandbox
- Check TypeScript compilation
- Run tests
- Restart the dev server
- Save a checkpoint

---

## Example Prompts for Sonnet 4.6

### Add a new page
```
Create a new "Contacts" page (client/src/pages/Contacts.tsx) for the Golf VX Marketing Dashboard.
It should:
- Use DashboardLayout wrapper
- Show a table of contacts with name, email, phone, source, status columns
- Have a search/filter bar
- Have an "Add Contact" button that opens a dialog
- Use shadcn/ui Table, Dialog, Input, Button, Select components
- Call trpc.contacts.list.useQuery() for data
- Use the Golf VX yellow (#FFD700) as accent color
- Follow the same patterns as Members.tsx (attached below)

[paste Members.tsx content]
```

### Modify an existing endpoint
```
I need to update the campaigns.list endpoint in server/routers.ts to also return
the linked Meta Ads campaign status from the cache.

Current code:
[paste the relevant section of routers.ts]

The metaAdsCache module exports getCampaignsFromCache() which returns:
{ campaign_id, campaign_name, status, objective, spend, impressions, clicks, ctr, cpc }

Merge the cache status into each campaign result.
```

### Fix a bug
```
The Programs page shows incorrect spend values. Here's the current code:
[paste Programs.tsx]

The issue is that metaAdsSpend is showing as a string "293.16" instead of being
parsed as a number. Fix the display to properly format currency values.
```
