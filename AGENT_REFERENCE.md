# Golf VX Marketing Dashboard — Agent Reference Guide

> **Purpose:** This document is a self-reference guide for the AI agent working on this project. It maps the full router architecture, documents recurring error patterns, records user preferences, and establishes rules to prevent repeated mistakes.

---

## 1. Project Architecture Overview

| Layer | Technology | Key Files |
|---|---|---|
| Frontend | React 19 + Tailwind 4 + shadcn/ui | `client/src/pages/`, `client/src/components/` |
| API Layer | tRPC 11 (type-safe RPC) | `server/routers.ts` |
| Database | MySQL/TiDB via Drizzle ORM | `drizzle/schema.ts`, `server/db.ts` |
| Auth | Manus OAuth (session cookie) | `server/_core/context.ts` |
| External APIs | Acuity, Meta Ads, Encharge, Boomerang, Toast, ClickFunnels | `server/*.ts` helpers |

---

## 2. Complete tRPC Router Map

Every router registered in `appRouter` (in `server/routers.ts`) and the procedures it exposes. **Before adding a new frontend call, verify the procedure exists here.**

### 2.1 Core / Auth

| Router | Procedures |
|---|---|
| `auth` | `me`, `logout` |
| `public` | `trackPageEvent` |

### 2.2 Campaign & Program Routers

| Router | Procedures | Notes |
|---|---|---|
| `campaigns` | `list`, `create`, `getByCategory`, `getByStatus`, `getCategorySummary`, `getSundayClinicMetrics`, `getSundayClinicAttendeeList`, `getSundayClinicAttendeesByEvent`, `getSundayClinicAttendeesBySource`, `getWinterClinicMetrics`, `getWinterClinicAttendeeList`, `getJuniorCampMetrics`, `generateEmailDraft`, `updateVisuals`, `generateInsights` | General campaign data |
| `strategicCampaigns` | `getOverview` | Groups campaigns by category with KPI aggregates |
| `giveaway` | `getApplications`, `getApplicationsFiltered`, `getStats`, `getLastSyncInfo`, `getConversions`, `sync`, `syncToEncharge`, `updateStatus`, `checkVisitHistory`, `generateEmailDraft`, `generateProgramInsights` | Annual Membership Giveaway |
| `anniversaryGiveaway` | `submitEntry`, `submitApplication` | Public-facing entry forms |
| `preview` | `getSnapshot`, `getDriveDaySessions` | Program preview data |

### 2.3 Intelligence & AI Routers

| Router | Procedures | Notes |
|---|---|---|
| `intelligence` | `generateActionPlan`, `getStrategicKPIs` | Strategic KPI analysis |
| `aiWorkspace` | `analyze` | AI Workspace chat/analysis |
| `workspace` | `chat`, `getSuggestedPrompts` | General AI chat |
| `autonomous` | `getAllActions`, `getApprovalCards`, `getArchivedActions`, `getAutoExecuted`, `getMonitoring`, `getSyncStatus`, `approveAction`, `rejectAction`, `dismissAction`, `undoAction`, `clearStaleActions`, `syncAllData` | Autonomous agent actions |
| `dailyActions` | `getTodayPlan`, `generatePlan`, `completeAction`, `skipAction` | Daily action planner |

### 2.4 Revenue & Finance Routers

| Router | Procedures | Notes |
|---|---|---|
| `revenue` | `getToastSummary`, `getAcuityRevenue`, `getSummary`, `getToastDaily`, `getTrialSessionDetail` | Revenue aggregation |
| `budgets` | `getCampaignBudgetSummary`, `getCampaignExpenses`, `syncMetaAdsBudgets`, `autoLinkMetaAdsCampaigns`, `addExpense`, `deleteExpense` | Budget management |
| `reports` | *(internal reporting procedures)* | Historical reports |

### 2.5 Member & Contact Routers

| Router | Procedures | Notes |
|---|---|---|
| `members` | `list`, `getStats`, `getById`, `getGuestContacts`, `findDuplicates`, `mergeMembers` | Member management |
| `conversion` | `getMemberAppointments` | Trial-to-member conversion tracking |
| `encharge` | `getAccount`, `getMetrics`, `getPeople`, `getSegments` | Encharge email marketing |

### 2.6 Marketing & Ads Routers

| Router | Procedures | Notes |
|---|---|---|
| `metaAds` | `getAllCampaignsWithInsights`, `getCampaignDailyInsights`, `getCampaignCreatives`, `getCampaignAudience` | Meta Ads Manager |
| `instagram` | `getInsights`, `getRecommendations`, `generateRecommendations`, `syncInsights`, `implementRecommendation` | Instagram business insights |
| `funnels` | `summary`, `submissions`, `syncNow`, `updateUvPv` | ClickFunnels data |
| `emailCampaigns` | `list`, `summary`, `syncNow` | Email campaign tracking |

### 2.7 Content & Outreach Routers

| Router | Procedures | Notes |
|---|---|---|
| `influencer` | `list`, `create`, `update`, `delete` | Influencer partnership tracking |
| `outreach` | `list`, `getSummary`, `create`, `update`, `updateStatus`, `delete` | Community outreach |
| `printAd` | `list`, `create`, `update`, `delete` | Print advertising |
| `eventAd` | `list`, `create`, `update`, `delete` | Event advertising |

### 2.8 System Routers

| Router | Procedures | Notes |
|---|---|---|
| `communication` | `sendEmail`, `sendSMS` | Registered via `communicationRouter` import |
| `dashboard` | `getOverview` | Integration status overview |
| `priorities` | *(priority management)* | Priority tracking |
| `research` | *(research procedures)* | Research tools |

### 2.9 Externally Registered Routers (imported)

These routers are imported from separate files and registered in `appRouter`:

```ts
import { emailCaptureRouter } from "./emailCaptureRouter";   // → emailCapture
import { boomerangRouter } from "./boomerangRouter";         // → boomerang
import { communicationRouter } from "./communicationRouter"; // → communication
```

---

## 3. Recurring Error Patterns & Prevention Rules

### 3.1 Missing tRPC Procedure (404 "No procedure found on path")

**Root cause:** A frontend page calls `trpc.routerName.procedureName` but the procedure was never added to `appRouter` in `server/routers.ts`.

**How to prevent:**
1. Before writing any `trpc.*` call in a frontend page, check Section 2 of this document to confirm the procedure exists.
2. When adding a new page, run this check first:
   ```bash
   grep -n "routerName: router" server/routers.ts
   ```
3. If the router doesn't exist, add it to `server/routers.ts` **before** writing the frontend code.
4. After adding procedures, verify with:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/trpc/routerName.procedureName?batch=1&input=%7B%7D"
   # 401 = exists (auth required) ✓
   # 405 = exists (mutation, needs POST) ✓
   # 404 = missing ✗
   ```

**Common mistake:** Creating a new page that calls `trpc.newRouter.someProc` without adding `newRouter` to `appRouter`. The frontend will silently fail with a 404 until the user reports it.

### 3.2 Stale TypeScript Watcher Errors (False Positives)

**Symptom:** `webdev_check_status` shows TypeScript errors like `Module '"../drizzle/schema"' has no exported member 'X'` with a frozen timestamp (e.g., "6:05:00 PM").

**Root cause:** The `tsc --watch` process is NOT running. The health check system is reading a cached log from a previous session. The actual `tsx watch` server compiles and runs correctly.

**How to verify:** Run `ps aux | grep tsc | grep -v grep` — if empty, no watcher is running. The errors are stale.

**How to confirm the server is healthy:**
```bash
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/trpc/auth.me?batch=1&input=%7B%7D"
# 200 = server is running fine
```

**Prevention:** Do not spend time debugging TypeScript watcher errors unless `ps aux | grep tsc` shows an active process. The `tsx watch` server handles compilation at runtime.

### 3.3 Frontend Calls Wrong Router Name

**Symptom:** Page calls `trpc.giveaway.*` but procedures are registered under `trpc.anniversaryGiveaway.*` or `trpc.campaigns.*`.

**Root cause:** When building new pages, the frontend developer (or AI) assumes a router name that doesn't match the actual registered key in `appRouter`.

**Prevention:** Always grep for the actual router key before writing frontend code:
```bash
grep -n "routerName: router\|routerName:" server/routers.ts
```

**Known mappings to remember:**

| Frontend calls | Actual router key |
|---|---|
| `trpc.giveaway.*` | `giveaway` (added 2026-03-04) |
| `trpc.communication.*` | `communication` (via `communicationRouter`) |
| `trpc.strategicCampaigns.*` | `strategicCampaigns` (added 2026-03-04) |
| `trpc.revenue.*` | `revenue` (added 2026-03-04) |
| `trpc.members.*` | `members` (added 2026-03-04) |
| `trpc.metaAds.*` | `metaAds` (added 2026-03-04) |
| `trpc.encharge.*` | `encharge` (added 2026-03-04) |
| `trpc.budgets.*` | `budgets` (added 2026-03-04) |
| `trpc.dashboard.*` | `dashboard` (added 2026-03-04) |
| `trpc.conversion.*` | `conversion` (added 2026-03-04) |

### 3.4 Schema Exports Not Found

**Symptom:** Import statement in `routers.ts` line 32 imports tables that don't exist in `schema.ts`.

**Prevention:** When adding new tables to `drizzle/schema.ts`, always:
1. Export the table: `export const myTable = mysqlTable(...)`
2. Export the types: `export type MyTable = typeof myTable.$inferSelect`
3. Run `pnpm db:push` to apply the migration
4. Verify the export: `grep -n "^export const myTable" drizzle/schema.ts`

### 3.5 Revenue Data Confusion

**Known data sources and their freshness:**

| Source | Router | Freshness | Notes |
|---|---|---|---|
| Toast POS | `revenue.getToastSummary`, `revenue.getToastDaily` | Daily at 5 AM EST | Not live |
| Acuity Scheduler | `revenue.getAcuityRevenue`, `revenue.getTrialSessionDetail` | Live API call | Rate limited |
| Boomerang | `members.list` | Live API call | Membership payments |
| Stripe | `revenue.getSummary` | DB (paid only) | Only count `paymentStatus = 'paid'` |

**Rule:** Never count unpaid transactions. Always filter by `paymentStatus = 'paid'` for revenue calculations.

---

## 4. User Preferences & Business Rules

### 4.1 Annual Membership Giveaway Goals

| Form Type | Goal | Description |
|---|---|---|
| Entry (short form) | **1,000** | Quick entry — name, email, basic info |
| Application (long form) | **250** | Full application — demographics, golf experience |

**Never use 500 as the goal.** The correct goals are 1,000 entries and 250 applications.

### 4.2 KPI vs ROI

Strategic Campaigns should display **KPIs as the primary metric**, not ROI. ROI is a supplementary metric. KPIs include:
- Membership Goal % (Membership Acquisition campaigns)
- Trial Conversion Rate (Trial Conversion campaigns)
- Retention Rate (Member Retention campaigns)
- B2B Events Count (Corporate Events campaigns)

### 4.3 Meta Ads Account

**Do not analyze or include** anything related to the "Studio Soo portrait business" Meta ad account. Only use the Golf VX Arlington Heights ad account.

### 4.4 Member Count Expectations

Active member count for All Access Ace + Swing Saver combined should be **100–150**. If Boomerang data is unavailable, use Encharge tag/segment data as a fallback.

### 4.5 Chicago City Targeting

The Annual Giveaway AI Intelligence tab should always flag the **Chicago city applicant gap**. Target neighborhoods: Lincoln Park, Wicker Park, River North, West Loop, Logan Square. The AI prompt includes a `chicagoOpportunity` JSON block for this purpose.

### 4.6 Dashboard Structure

| Section | Route | Notes |
|---|---|---|
| Dashboard | `/` | Unified view — replaces "Command Center". Includes Revenue Snapshot + Reports Summary |
| Revenue | `/revenue` | Accessible via Dashboard "Revenue →" link |
| Reports | `/reports` | Accessible via Dashboard "Full Report →" link |

Revenue and Reports are **not in the sidebar** — they are accessed from the Dashboard.

### 4.7 AI Intelligence on Program Pages

All program pages must have an AI Intelligence tab/panel. Current status:

| Program Page | AI Intelligence | Component |
|---|---|---|
| Annual Giveaway | Full tab with Chicago Opportunity card | `AIIntelligenceTab` (inline) |
| Drive Day / Sunday Clinic | `ProgramAIIntelligence` component | `campaignId: 2` |
| Winter Clinic | `ProgramAIIntelligence` component | `campaignId: 3` |
| Junior Summer Camp | `ProgramAIIntelligence` component | `campaignId: 4` |
| Leagues | `ProgramAIIntelligence` component | `campaignId: 5` |

### 4.8 Action Plan Location

The Action Plan is part of **AI Workspace** (`/workspace`), not a standalone page under AI Analysis. The route `/intelligence/action-plan` redirects to `/workspace`.

---

## 5. External API Integration Notes

### 5.1 Acuity Scheduler

- API credentials: `ACUITY_USER_ID` + `ACUITY_API_KEY`
- Helper file: `server/acuity.ts`
- Key functions: `getAppointments()`, `getAllRevenueByType()`, `getSundayClinicData()`
- Rate limit: Be conservative — avoid calling on every page load. Cache results in DB when possible.

### 5.2 Encharge

- API credentials: `ENCHARGE_API_KEY` + `ENCHARGE_WRITE_KEY`
- Helper file: `server/enchargeSync.ts`
- Key function: `upsertEnchargePerson(person)` — syncs a contact to Encharge
- Used for: Giveaway applicant syncing, member lifecycle emails

### 5.3 Meta Ads

- API credentials: `META_ADS_ACCESS_TOKEN` + `META_ADS_ACCOUNT_ID`
- Helper file: `server/metaAdsSync.ts`
- **Exclude** Studio Soo portrait business account

### 5.4 Boomerang

- API credentials: `BOOMERANG_API_TOKEN`
- Helper file: `server/boomerangRouter.ts`
- Used for: Membership management, upcoming payment tracking

### 5.5 Toast POS

- Data arrives daily at **5 AM EST** — not live
- Table: `toastDailySummary` in schema
- Router: `revenue.getToastDaily`, `revenue.getToastSummary`

### 5.6 ClickFunnels

- API credentials: `CLICKFUNNELS_API_KEY` + `CLICKFUNNELS_SUBDOMAIN`
- Router: `funnels.*`

---

## 6. Database Schema Quick Reference

Key tables and their purpose:

| Table | Purpose |
|---|---|
| `campaigns` | All marketing campaigns with category, status, budget |
| `giveawayApplications` | Annual Giveaway entries and applications |
| `members` | Member records (All Access Ace, Swing Saver, Pro) |
| `memberTransactions` | Toast POS transaction records |
| `toastDailySummary` | Daily Toast POS revenue summaries |
| `influencerPartnerships` | Influencer deal tracking |
| `communityOutreach` | Community outreach event tracking |
| `printAdvertising` | Print ad campaigns |
| `eventAdvertising` | Event advertising records |
| `aiRecommendations` | AI-generated recommendations |
| `userActions` | User action tracking |
| `priorities` | Priority items |

**Member tiers:** `allAccessAce`, `swingSaver`, `pro`

**Campaign categories:** `membershipAcquisition`, `trialConversion`, `memberRetention`, `corporateEvents`

---

## 7. Page → Router Dependency Map

Use this to quickly find which routers a page depends on before making changes:

| Page | File | Routers Used |
|---|---|---|
| Dashboard | `Home.tsx` | `campaigns`, `reports`, `revenue`, `strategicCampaigns` |
| Strategic Campaigns | `StrategicCampaigns.tsx` | `strategicCampaigns`, `intelligence`, `campaigns` |
| Annual Giveaway | `AnnualGiveaway.tsx` | `giveaway`, `anniversaryGiveaway` |
| Giveaway Applications | `GiveawayApplications.tsx` | `giveaway` |
| Members | `Members.tsx` | `members` |
| Member Profile | `MemberProfile.tsx` | `members`, `conversion` |
| Revenue | `Revenue.tsx` | `revenue` |
| Reports | `Reports.tsx` | `reports`, `campaigns`, `members` |
| Meta Ads | `MetaAds.tsx` | `metaAds`, `budgets` |
| Performance | `Performance.tsx` | `metaAds`, `campaigns` |
| Email Marketing | `EmailMarketing.tsx` | `emailCampaigns`, `encharge` |
| Automations | `Automations.tsx` | `encharge` |
| Communications Hub | `CommunicationsHub.tsx` | `communication`, `members` |
| AI Workspace | `AIWorkspace.tsx` | `workspace`, `aiWorkspace`, `intelligence` |
| Integrations | `Integrations.tsx` | `dashboard` |
| Budget Manager | `BudgetManager.tsx` | `budgets`, `campaigns` |

---

## 8. Checklist Before Every Code Change

Before writing any new frontend `trpc.*` call:

- [ ] Verify the router exists in Section 2 of this document
- [ ] Verify the specific procedure exists in the router
- [ ] If missing, add the procedure to `server/routers.ts` first
- [ ] Test with `curl` to confirm 401/405 (not 404)

Before adding a new database table:

- [ ] Add `export const tableName = mysqlTable(...)` to `drizzle/schema.ts`
- [ ] Add `export type TableName = typeof tableName.$inferSelect`
- [ ] Run `pnpm db:push`
- [ ] Verify export: `grep -n "^export const tableName" drizzle/schema.ts`

Before saving a checkpoint:

- [ ] Read `todo.md` and mark completed items as `[x]`
- [ ] Verify server is running: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/trpc/auth.me?batch=1&input=%7B%7D`
- [ ] Check for any obvious 404 errors in browser console logs

---

## 9. Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-03-04 | Added `giveaway` router (10 procedures) | Frontend called `trpc.giveaway.*` but router didn't exist |
| 2026-03-04 | Added `strategicCampaigns` router | Frontend called `trpc.strategicCampaigns.getOverview` |
| 2026-03-04 | Added `revenue` router extensions (`getSummary`, `getToastDaily`, `getTrialSessionDetail`) | Revenue page called missing procedures |
| 2026-03-04 | Added `members`, `metaAds`, `encharge`, `budgets`, `dashboard`, `conversion` routers | Multiple pages had missing router errors |
| 2026-03-04 | Added `giveaway.getApplicationsFiltered` | GiveawayApplications.tsx called missing procedure |
| 2026-03-04 | Fixed Annual Giveaway goals (1000 entry, 250 application) | User reported incorrect goals |
| 2026-03-04 | Merged Action Plan into AI Workspace | User feedback: consolidate navigation |
| 2026-03-04 | Renamed Command Center → Dashboard, removed Revenue/Reports from sidebar | User feedback: consolidate views |
| 2026-03-04 | Added Chicago Opportunity card to AI Intelligence tab | User feedback: demographic-based ad targeting |
| 2026-03-04 | Updated Strategic Campaigns to show KPIs over ROI | User feedback: KPI should be primary metric |

---

## 10. Post-Modification QA Checklist

**MANDATORY: After every code change, dashboard update, or new feature, run through this checklist before saving a checkpoint.**

### 10.1 Side-Page Verification (Check ALL pages, not just the one modified)

After any modification, verify the following pages load without errors:

| Page | Route | Key Checks |
|---|---|---|
| Dashboard | `/` | Member count > 0, revenue figures present |
| Campaigns | `/strategic-campaigns` | KPIs show real values (not 0), member count from DB |
| AI Analysis | `/ai-analysis` | No tRPC errors, tabs load |
| AI Workspace | `/ai-workspace` | Chat interface loads |
| Programs & Events | `/programs` | Program list loads |
| Summer Camp | `/programs/summer-camp` | Participant count, Meta Ads section |
| Drive Day | `/programs/drive-day` | Booking data loads |
| Annual Giveaway | `/programs/annual-giveaway` | Applications count, 250 target, AI section visible |
| Advertising | `/advertising` | Meta Ads tab (not "Paid Digital"), active ads first |
| Meta Ads Detail | `/campaigns/meta-ads` | Campaign cards clickable, AI Insights button |
| Promotions | `/promotions` | No 404 |
| Social & Content | `/social` | No 404 |
| Communications | `/communications` | No 404 |
| Members | `/members` | Member list loads, no 0 count |
| **Pro Members** | `/pro-members` | **Must not 404 — route registered in App.tsx** |
| Guests & Leads | `/guests` | Guest list loads |
| Site Control | `/site-control` | No 404 |
| Settings | `/settings` | No 404 |
| Marketing Intelligence | `/intelligence` | Three sections: Auto-Executed, Awaiting Approval, Monitoring |

### 10.2 Zero/Empty Value Checks

**Never display $0, 0 members, or empty KPI cards.** Before checkpoint:

- [ ] Strategic Campaigns → Membership Acquisition KPI shows actual member count from `db.getMemberStats()` (NOT `database.execute()`)
- [ ] Strategic Campaigns → Member Retention KPI shows retention rate (%), not raw member count
- [ ] Dashboard → Total Members > 0 (currently ~91 active members)
- [ ] Revenue page → figures populated from Acuity/Toast APIs
- [ ] All progress bars show correct targets (Giveaway = 250 applications, NOT 1000)

### 10.3 Real-Time Data Verification

- [ ] Meta Ads cache at `/tmp/golf-vx-meta-ads-insights.json` is fresh (< 2 hours old)
- [ ] Superbowl Watch Party status = COMPLETED (not ACTIVE) in cache
- [ ] IG_$100 Giveaway_Feb2026 status = COMPLETED (not ACTIVE) in cache
- [ ] Acuity sync returns bookings for the current date range
- [ ] Scheduler logs show `[Scheduler] Started — will run at 8am and 6pm CST`

### 10.4 Metadata Accuracy Checks

- [ ] Campaign objectives display correctly (OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, etc.)
- [ ] Meta Ads sorted: ACTIVE campaigns first, COMPLETED/PAUSED/ARCHIVED last
- [ ] Member tiers display correctly (golf_vx_pro, golf_vx_plus, golf_vx_standard)
- [ ] Pro Members page at `/pro-members` shows pro-tier members only
- [ ] Annual Giveaway target = 250 applications (not 1000 entry page visits)
- [ ] AI Intelligence section on Giveaway page is a standalone yellow-bordered section (not a tab)

### 10.5 Critical Known Bugs to Re-Check After Any routers.ts Change

| Bug Pattern | Root Cause | Fix |
|---|---|---|
| Member KPI = 0 | `database.execute()` returns `[rows, fields]`; must use `[0][0]` not `[0]` | Use `db.getMemberStats()` from `server/db.ts` instead |
| `influencerPartnerships` TS error | Stale TS watcher cache from 6:05 PM | False positive — run `npx tsc --noEmit` to confirm zero actual errors |
| `entryGoal is not defined` | Template literal uses variable not in scope | Check prompt templates in `generateInsights` procedures |
| Pro Members 404 | Route not registered in `App.tsx` | Verify `<Route path="/pro-members">` exists |
| Superbowl shows ACTIVE | Meta Ads cache not updated | Update `/tmp/golf-vx-meta-ads-insights.json` status field |

### 10.6 mysql2 execute() Pattern (Critical)

When using `database.execute(sql\`...\`)` in Drizzle with mysql2 driver:

```ts
// ❌ WRONG — [0] is the rows array, not the first row
const result = await database.execute(sql`SELECT COUNT(*) as count FROM members`);
const count = (result as any)[0]?.count; // undefined!

// ✅ CORRECT — [0] = rows array, [0][0] = first row
const result = await database.execute(sql`SELECT COUNT(*) as count FROM members`);
const count = (result as any)[0][0]?.count; // correct!

// ✅ PREFERRED — use Drizzle ORM helpers from server/db.ts instead
const stats = await getMemberStats(database);
const count = stats.activeMembers; // correct!
```

---

## 11. Change Log (continued)

| Date | Change | Reason |
|---|---|---|
| 2026-03-04 | Fixed `getStrategicKPIs` mysql2 `[0][0]` pattern | Member KPI showed 0 due to wrong result access |
| 2026-03-04 | Fixed `memberRetention` KPI to show retention rate % | Was showing raw member count instead of % |
| 2026-03-04 | Added `/pro-members` route and `ProMembers.tsx` page | Pro Members sidebar link returned 404 |
| 2026-03-04 | Renamed "Paid Digital" tab to "Meta Ads" in Advertising | User requested Meta Ads branding |
| 2026-03-04 | Added AI Insights button + dialog to Meta Ads campaign cards | User requested per-campaign AI analysis |
| 2026-03-04 | Added active-first sorting to Meta Ads campaign list | User requested active ads shown first |
| 2026-03-04 | Fixed Superbowl Watch Party status to COMPLETED in cache | Was incorrectly showing as ACTIVE |
| 2026-03-04 | Changed Annual Giveaway target from 1000 to 250 applications | User clarified target is 250 applications |
| 2026-03-04 | Made AI Intelligence a standalone yellow-bordered section on Giveaway page | User requested it be more prominent |
| 2026-03-04 | Added `metaAds.generateCampaignInsights` procedure | New AI Insights button needed backend support |
| 2026-03-04 | Added Section 10 QA Checklist to AGENT_REFERENCE.md | User requested automatic QA verification |

## 11. 환경 변수 및 DB 마이그레이션 주의사항

### DATABASE_URL
- Manus 런타임이 앱 실행 시 자동 주입 — `.env` 파일에 없는 것이 정상
- `pnpm db:push`는 Manus 플랫폼 실행 환경에서만 동작
- Claude/로컬 환경에서는 DB 마이그레이션 불가 (코드 수정만 가능)

### 새 테이블 추가 워크플로우
1. `drizzle/schema.ts`에 테이블 정의 추가
2. `server/routers/*.ts`에 라우터 코드 작성
3. TypeScript 오류 없는지 확인 (`pnpm check`)
4. GitHub에 commit & push
5. Manus가 `pnpm db:push` 실행하여 DB에 테이블 생성

### 현재 DB에 생성 필요한 테이블
- `event_advertising` — schema.ts에 정의 완료, DB 생성 대기 중
