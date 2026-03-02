# Project TODO

## Database Schema
- [x] Create autonomous_sync_status table (sync state, timestamps, error tracking)
- [x] Create autonomous_actions table (action history, risk levels, approval status)
- [x] Run db:push migration
- [x] Fix DB column mismatch (actionStatus → status)

## Backend - Autonomous Engine
- [x] server/autonomous.ts - Autonomous analysis engine with LLM integration
- [x] server/scheduler.ts - 8am/6pm CST cron job scheduler
- [x] server/seed-demo.ts - Demo data seeding script
- [x] Meta Ads API integration (campaign data sync with lifetime date preset)
- [x] Risk-based execution logic (low-risk auto-execute, high-risk hold for approval)
- [x] Campaign performance analysis and action generation

## tRPC Router Endpoints
- [x] getSyncStatus endpoint
- [x] getAutoExecutedActions endpoint
- [x] getApprovalCards endpoint
- [x] getMonitoringItems endpoint
- [x] syncAllData endpoint
- [x] approveAction endpoint
- [x] undoAction endpoint
- [x] seedDemo endpoint

## Scheduler
- [x] 8am CST cron job for data sync
- [x] 6pm CST cron job for data sync
- [x] Scheduler registration in server startup

## Frontend UI - Marketing Intelligence
- [x] MarketingIntelligence.tsx with three sections (Auto-Executed, Awaiting Approval, Monitoring)
- [x] Auto-Executed Actions section with undo button
- [x] Awaiting Approval Cards section with approve/reject buttons and trigger metrics
- [x] Monitoring Items section with data status indicators
- [x] Sync status bar with data source info and next sync time
- [x] Summary cards (Total Actions, Auto-Executed, Awaiting Approval, Monitoring)
- [x] Load Demo and Sync Now buttons
- [x] Empty state with CTA buttons

## Testing
- [x] Vitest unit tests for autonomous engine (21 tests passing)
- [x] Seed test data for Junior Summer Camp campaign
- [x] Seed test data for Anniversary Giveaway campaign
- [x] UI verification - all 3 tabs working correctly

## Integration
- [x] Restore existing dashboard from ZIP (103367d8 codebase)
- [x] Merge autonomous router into existing routers.ts
- [x] Add autonomous tables to existing schema.ts
- [x] Register scheduler in server/_core/index.ts
- [x] All existing pages preserved (Overview, Meta Ads, Instagram, Members, etc.)

## Meta Ads API 실연동
- [x] autonomous.ts syncAllData를 실제 Meta Ads API와 연결
- [x] 기존 metaAds.ts의 getCampaigns/getCampaignInsights 활용
- [x] 실제 캠페인 데이터로 분석 엔진 구동
- [x] Studio Soo portrait business 계정 제외 로직

## Approve/Reject 후속 액션 연결
- [x] Meta Ads 예산 변경 API 연동 (budget increase/decrease)
- [x] Encharge 이메일 발송 연동 (nurture sequence trigger)
- [x] Owner 알림 발송 (notifyOwner)
- [x] Meta Ads 캠페인 일시정지 (pause_underperformer)
- [x] 액션 실행 결과를 DB에 기록 (executionResult 컬럼)
- [x] execution_failed 상태 처리
- [x] UI에 액션 실행 결과 표시 (성공/실패 배지)
- [x] Approve 시 실행 결과 토스트 알림
- [x] approveAction 라우터에 후속 액션 실행 로직 추가
- [x] Vitest 테스트 업데이트 (28 tests passing)

## Genspark Code Integration (FOR_MANUS.md)
- [x] email_captures DB table (source, status, Encharge sync tracking)
- [x] communication_logs DB table (channel, direction, cost, campaign tracking)
- [x] server/boomerang.ts — Boomerang API client module
- [x] server/enchargeSync.ts — Encharge bidirectional sync module
- [x] server/twilio.ts — Twilio SMS + SendGrid email module
- [x] emailCapture tRPC router (list, getById, create, update, updateStatus, delete, bulkImport, syncToEncharge, pullFromEncharge)
- [x] boomerang tRPC router (getTemplates, getAllMembers, syncMembers, getCardInfo, sendPush)
- [x] communication tRPC router (sendSMS, sendEmail, getHistory, getStats)
- [x] EmailCapturesTab.tsx — Leads management with filters, CSV import, Encharge sync
- [x] CommunicationPanel.tsx — SMS/Email composer with history viewer
- [x] BoomerangMembersTab.tsx — Boomerang members with summary cards, push notifications
- [x] Members.tsx — Wired new tabs (Email Captures, Boomerang) into existing tab structure
- [x] 20 vitest integration tests passing

## Programs Sidebar Restoration
- [x] Add Programs as separate sidebar nav item below Campaigns
- [x] Wrap Programs.tsx in DashboardLayout for standalone route
- [x] Seed 8 programs into campaigns table with correct data
- [x] Add Superbowl Watch Party as 9th program

## Meta Ads MCP Pipeline
- [x] Fetch campaign data via MCP server and write to .meta-ads-cache/insights.json
- [x] Add getCampaignsFromCache() to metaAdsCache.ts
- [x] Add cache fallback to getCampaigns router endpoint
- [x] Sync Meta Ads spend from cache to campaigns DB table
- [x] Auto-link Meta Ads campaigns to programs by name matching
- [x] Verify Meta Ads tab shows all 5 campaigns ($868.26 total spend)

## Boomerang API Integration
- [x] Set BOOMERANG_API_TOKEN environment variable
- [x] Fix API endpoint names (getClientsList, getPassesByEmail/Phone, sendPush with pushSegment)
- [x] Fix auth headers (X-API-Key + x-access-token, POST with JSON body)
- [x] Verify Boomerang Members tab shows real membership data (81 Swing Savers members)

## Meta Ads Data Refresh & Programs Cleanup
- [x] Refresh Meta Ads data from MCP with latest numbers
- [x] Remove fake programs: Corporate Events B2B (ID 8), Drive Day Competition (ID 6)
- [x] Fix Superbowl Watch Party status → completed
- [x] Fix PBGA Winter Clinic status → completed
- [x] Fix Instagram Follower Growth status → paused
- [x] Clear fake metaAdsCampaignId from programs without real Meta Ads links
- [x] Update Meta Ads spend: Junior Summer Camp $290.16, Giveaway $462.18, Superbowl $75.43
- [x] Fix TypeScript errors (0 errors)
- [x] Fix strategicCampaigns.test.ts assertion
- [x] Fix Home.tsx syncAllData router reference

## Pending
- [ ] Add Twilio/SendGrid credentials for SMS/Email communication
- [ ] Fix Encharge API token (returning "Token without payload" errors)
- [x] Set up Acuity Scheduling credentials
- [x] Verify Acuity API connectivity with real booking data
- [x] Run Acuity tests and confirm integration works
- [ ] Configure second Meta Ads account (624963382940798) for older campaigns

## Bug Fixes
- [x] Fix Annual Giveaway page error: rclone Google Drive sync fails in deployed environment
- [x] Import giveaway application data from Google Sheet into database (43 entries: 37 real, 6 test)
- [x] Verify all Meta Ads data is reflecting live in the dashboard
- [x] Check Meta Ads API connectivity and campaign data accuracy
- [x] Mark Superbowl Watch Party as completed in dashboard
- [x] Mark IG $100 Giveaway as completed in dashboard
- [x] Update Meta Ads cache with correct statuses
- [x] Clean up fake Meta IDs from programs without real ads
- [x] Update Meta Ads spend values from live MCP data
- [x] Prepare Sonnet 4.6 handoff package with full code and instructions (SONNET_HANDOFF.md)
- [x] Remove unnecessary sidebar tabs (Annual Giveaway, ROI Analytics, Email Marketing, Program Visuals, Calendar, Timeline, Revenue, Reports)
- [x] Rename and simplify Home page to "Marketing HQ" with clean summary cards and quick navigation

## Boomerang Clients Import (report_24.02.2026.xlsx)
- [ ] Import 1,049 Boomerang clients into members/email_captures tables
- [ ] Map card status (installed=348, not_installed=10, deleted=691)
- [ ] Preserve card serial numbers, device types, UTM sources
- [ ] Verify Boomerang Members tab shows correct stats

## Genspark v4 Integration (Phase 1 — Twilio A2P)
- [ ] Install twilio and @sendgrid/mail packages
- [ ] Create server/boomerang.ts from OUTPUT_boomerang.ts
- [ ] Create server/enchargeSync.ts from OUTPUT_enchargeSync.ts
- [ ] Create server/twilio.ts from OUTPUT_twilio.ts
- [ ] Merge router additions (emailCapture, boomerang, communication) into server/routers.ts
- [ ] Create client/src/components/tabs/ directory with EmailCapturesTab.tsx, BoomerangMembersTab.tsx, CommunicationsTab.tsx
- [ ] Update Members.tsx with 4-tab structure (Overview, Email Leads, Boomerang Cards, Communications)
- [ ] Run TypeScript check and tests

## Boomerang Webhook Integration (Express) v2
- [x] Convert Next.js webhook handler to Express format (server/boomerangWebhook.ts)
- [x] Add Boomerang webhook columns to email_captures table (boomerang_card_status, boomerang_template_id, boomerang_template_name, boomerang_device, boomerang_installed_at, boomerang_deleted_at)
- [x] Run DB migration for new columns via webdev_execute_sql
- [x] Register webhook at POST /api/webhooks/boomerang in server/_core/index.ts
- [x] Fix TypeScript errors (enchargeSubscriberId → enchargeId, name → firstName/lastName)
- [x] Fix schema column names (createdAt/updatedAt → created_at/updated_at for email_captures)
- [x] v2: Dual-format payload support (full nested .data AND flat Make.com selected-fields)
- [x] v2: Confirmed payload structure from Make.com Operation 1 screenshot
- [x] v2: Phone normalization (13175010143 → +13175010143 Boomerang format)
- [x] v2: Extended template map (10 membership types incl. 497225 All-Access Aces 325)
- [x] v2: Rich tag builder (#membership-{type}, #card-installed, #apple-wallet, #utm-{source})
- [x] v2: utm_source field support
- [x] Test CardIssuedEvent full payload → creates new record ✓
- [x] Test CardIssuedEvent flat payload → creates new record ✓
- [x] Test CardInstalledEvent → updates existing record ✓
- [x] Test CardDeletedEvent → updates with deleted status ✓
- [x] Test unauthorized request → 401 ✓
- [x] Test phone normalization ✓
- [x] Test template ID 497225 → All-Access Aces 325 ✓
- [x] Write 9 vitest unit tests (all passing)
- [x] TypeScript: 0 errors

## Navigation Structure Update (2026-02-24)
- [x] Replace App.tsx with new routing (collapsible sections + backward-compat aliases)
- [x] Replace DashboardLayout.tsx with new grouped sidebar navigation
- [x] Add new page stubs: AIActions, AccountSettings, Announcements, Automations, DripCampaigns, Guests, Integrations, Leads, Leagues, NewsManager, Overview, Performance, PrivateEvents, SiteControl
- [x] TypeScript: 0 errors
- [x] Dev server: 200 OK

## Handoff Package v2 — 14 Pages Implementation (2026-02-25)
- [x] Apply handoff package: App.tsx, DashboardLayout.tsx, Home.tsx replaced
- [x] Overview.tsx — dedicated high-level metrics view (member stats, campaign summary, quick links)
- [x] AIActions.tsx — autonomous action queue with approve/dismiss, risk badges, execution history
- [x] Performance.tsx — campaign KPI charts, channel performance, revenue metrics
- [x] Leads.tsx — email captures list with search, filter by source/status, stats bar
- [x] Guests.tsx — members/guests list with Acuity sync, membership type filter, stats
- [x] Announcements.tsx — bulk SMS/email broadcast with member targeting and history
- [x] Automations.tsx — Encharge sequences overview with status and subscriber counts
- [x] DripCampaigns.tsx — Encharge people/segments drip view with tag management
- [x] Leagues.tsx — Sunday Clinic + PBGA Winter Clinic metrics from Acuity, corporate events
- [x] PrivateEvents.tsx — giveaway applications table, stats, corporate event campaigns
- [x] SiteControl.tsx — quick access links (6 platforms), active campaign landing pages, analytics shortcuts
- [x] NewsManager.tsx — AI intelligence alerts + generated reports with one-click monthly summary
- [x] Integrations.tsx — 10 integration status cards (Meta, Encharge, Acuity, Boomerang, ClickFunnels, Make.com, Asana, Instagram, Twilio, GA4)
- [x] AccountSettings.tsx — user profile, system info, webhook config, security status
- [x] TypeScript: 0 errors
- [x] Tests: 112/132 passing (20 external API failures unchanged from before)

## Dashboard Fixes (2026-02-25)
- [x] Today's Priorities: remove checkbox/strikethrough, add creation date display, navigate to section on click
- [x] Boomerang member sync: import 303 missing members from report_24.02.2026.xlsx (54 → 359 total)
- [x] Drive Day Clinics: restore Acuity data view (SundayClinicDetail) instead of public landing page redirect
- [x] Programs sidebar: replace Private Events with Annual Membership Giveaway (Gift icon)
- [x] App.tsx: /programs/drive-day → SundayClinicDetail, /programs/annual-giveaway → AnnualGiveaway

## Today's Priorities DB Upgrade & Membership Tier Sync (2026-02-25)
- [x] Add priorities table to DB (created directly via SQL since migration was blocked by existing tables)
- [x] Add tRPC procedures: priorities.list, priorities.create, priorities.complete, priorities.delete
- [x] Rebuild Today's Priorities UI: DB-backed, add/complete/delete, creation date, navigate-on-click
- [x] Boomerang API tier sync: fetch card type per member, update membershipTier in DB (80 members updated)
- [x] Update member status: active (302) / trial (57) based on tier data
- [x] Membership Tier Breakdown card now uses real DB data (All-Access Aces: 37, Swing Savers: 28, Golf VX Pro: 10)
- [x] Write vitest tests for priorities router (12 tests passing)

## Toast Revenue Integration (2026-02-25)
- [x] Explore Toast SFTP CSV schemas (PaymentDetails, AllItemsReport, CheckDetails)
- [x] Generate new SSH key pair and register in Toast portal
- [x] Design and create toast_daily_summary, toast_payments, toast_sync_log tables
- [x] Build and run historical import script (207/211 days imported successfully)
- [x] Add tRPC procedures: getToastSummary, getToastMonthly, getToastDaily, getToastPaymentBreakdown, getToastSyncStatus
- [x] Build Revenue.tsx page with real Toast data (area chart, stacked bar, pie charts, KPI cards)
- [x] Add daily 4:30am CST (5:30am EST) Toast SFTP sync to scheduledJobs.ts
- [x] Write vitest tests for Toast revenue (10 tests passing)

## Revenue Sidebar & Home KPI Card (2026-02-25)
- [x] Move Revenue from Intelligence sub-item to top-level sidebar below Overview
- [x] Update App.tsx route for /revenue (keep backward compat alias from /intelligence/revenue)
- [x] Remove Revenue from Intelligence sub-menu in DashboardLayout.tsx
- [x] Add this month's Toast revenue KPI card to Home.tsx Marketing HQ
- [x] Add tRPC procedure for current month revenue summary (if not already available)

## Membership Tier Breakdown Update (2026-02-26)
- [x] Update Performance.tsx Membership Tier Breakdown to show 3 tiers clearly
- [x] Separate Regular Members (All-Access Aces, Swing Savers, Trial/Unclassified) from Pro Members (Coaches)
- [x] Add Pro Members billing details: $500/mo base, $25/session Bay credit, $25/hr overage after 20 sessions
- [x] Add Coach Chuck Lynch note in Pro Members section
- [x] Fix TypeScript: 0 errors

## Three Feature Sprint (2026-02-26)

### Feature 1: Pro Members Billing Panel
- [x] Add pro_member_sessions table to schema (member_id, session_date, session_type, bay_number, duration_hrs, notes)
- [x] Add pro_member_billing table (member_id, billing_month, base_fee, session_count, bay_credit_total, overage_amount, net_bill, stripe_payment_intent_id, status)
- [x] Run db:push migration for new tables
- [x] Add tRPC procedures: proMembers.getSessions, proMembers.getBillingHistory, proMembers.logSession, proMembers.getMonthlyBillSummary
- [x] Existing ProMembersPanel in Members.tsx shows coach list with PBGA Lead badge for Chuck Lynch
- [x] Update Revenue context: clarify Toast POS = non-member/overage bay usage; Stripe = membership fees
- [ ] Write vitest tests for Pro Members billing logic

### Feature 2: Revenue Decline Drill-Down
- [x] MoM category drill-down uses existing getToastMonthly (bayRevenue, foodBevRevenue, golfRevenue per month)
- [x] Add MoM comparison section to Revenue.tsx: Bay Usage vs Food & Bev vs Golf side-by-side
- [x] Add delta badges ($ and %) per category showing change from last month
- [x] Add context note: Toast POS = non-member bay usage + additional hours; Stripe = membership MRR
- [x] Add bar chart comparing this month vs last month by category
- [ ] Write vitest tests for MoM category query

### Feature 3: Membership Tier Reconciliation Tool
- [x] Add bulk-reclassify tRPC mutation: members.bulkReclassify(memberIds[], newTier)
- [x] Add Unclassified tab in Members.tsx with members filtered by tier=none
- [x] Add checkbox selection to member rows in Unclassified panel
- [x] Add "Assign Tier" action bar that appears when members are selected
- [x] Show count of unclassified members prominently as a banner/alert
- [ ] Write vitest tests for bulk reclassify mutation

## Bug Fix: /programs/annual-giveaway (2026-02-26)
- [x] Fix TRPCClientError "Page not found" mutation — root cause: JuniorSummerCamp/DriveDay/TrialSession fire trackPageEvent on mount; no landing_pages DB records exist; fixed by adding onError: () => {} to suppress the global mutation error handler
- [x] Fix nested <a> inside <Link> (nested anchor tag) — root cause: PublicLayout.tsx had <Link><a>...</a></Link> pattern throughout; fixed by moving className to Link directly and removing inner <a> elements

## ## Sprint: Giveaway Data + Program Dashboards + Marketing Intelligence (2026-02-26)
### Task 1: Fix Annual Giveaway 2026 Live Data
- [x] Parse GOLFVXAHAnniversaryApplications2026.xlsx (45 real entries, sheet 2)
- [x] Map Excel columns to giveawayApplications DB schema (submissionTimestamp, name, email, etc.)
- [x] Import Excel data into DB via import-giveaway-excel.py (45 real entries, latest: 2026-02-25)
- [x] Verify AnnualGiveaway.tsx shows live count and correct entries (getGiveawayApplications filters isTestEntry=false)
### Task 2: Junior Summer Camp Acuity Dashboard
- [x] Check Acuity appointment types: Full-Day (7-17), Half-Day (7-17), Tots (4-6) — Jun-Aug 2026
- [x] Add getJuniorCampData to acuity.ts and getJuniorCampMetrics procedure to routers.ts
- [x] Build JuniorCampDashboard.tsx matching WinterClinicDetail pattern
- [x] Show: KPIs, track breakdown, weekly schedule, registration source, marketing panel
- [x] Route /programs/summer-camp and /programs/junior-summer-camp to JuniorCampDashboard
### Task 3: Per-Program Marketing Intelligence Panel
- [x] Build ProgramMarketingPanel.tsx (Meta Ads + Instagram + Newsletter tabs)
- [x] Meta Ads: filter campaigns by program keywords, show spend/impressions/clicks/CTR/CPC
- [x] Instagram: show account-level insights table, link to Instagram sidebar tab
- [x] Newsletter: show Encharge segments matching program keywords, link to drip/announcements
- [x] Add ProgramMarketingPanel to SundayClinicDetail (Drive Day), WinterClinicDetail, JuniorCampDashboard

## 컬러 테마 업데이트 (2026-02-26)
- [x] CSS 변수 (--primary, --chart-*) 업데이트: #ffcb00 (Primary), #ef9253 (Membership Growth), #5daf68 (Trial Conversion), #a87fbe (Member Retention), #76addc (B2B Events)
- [x] index.css @theme inline 블록 OKLCH 변환 후 교체
- [x] Home.tsx KPI 카드 하드코딩 컬러 교체
- [x] Performance.tsx 차트/배지 컬러 교체
- [x] Members.tsx 멤버십 티어 컬러 교체 (Unclassified: #ef9253, Pro: #a87fbe, All-Access: primary, Swing Saver: #76addc)
- [x] DashboardLayout.tsx 사이드바 active 컬러 확인 (primary 변수 사용 — 자동 반영)
- [x] WinterClinicDetail.tsx, Overview.tsx, ProgramMarketingPanel.tsx, InstagramAnalytics.tsx, CampaignTimeline.tsx, Revenue.tsx 컬러 교체
- [x] SundayClinicDetail.tsx JSX 오류 수정 (Marketing Intelligence div 중첩 오류)
- [x] TypeScript 0 errors 확인 후 체크포인트 저장

## 사이드바 컬러 + Recharts 통일 + Stripe 준비 (2026-02-26)
- [x] DashboardLayout 사이드바 active/hover 컬러 정비 — sidebar-accent를 #ffcb00 기반 연한 노란색으로 교체
- [x] Recharts 차트 컬러를 CSS 변수(var(--color-*))로 통일 — Revenue.tsx, InstagramAnalytics.tsx
- [x] Stripe webhook endpoint POST /api/webhooks/stripe 등록 (server/_core/index.ts)
- [x] Stripe 이벤트 핸들러 작성 (invoice.payment_succeeded/failed)
- [x] pro_member_billing 테이블에 Stripe invoice_id 자동 업데이트 로직
- [x] Stripe 환경변수 등록 (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- [x] TypeScript 0 errors 확인 후 체크포인트 저장

## 모바일 뷰 + KPI 네비게이션 + Giveaway→Drive Day 자동화 (2026-02-26)
### Task 1: 모바일 뷰 Revenue 카드 텍스트 겹침 수정
- [x] Revenue 카드 모바일 반응형 수정 — flex → grid grid-cols-2 md:grid-cols-4
- [x] 모바일에서 2x2 그리드로 변경, 글씨 크기 축소 (text-lg sm:text-2xl)

### Task 2: KPI 카드 클릭 → 상세 페이지 이동
- [x] Membership Growth 카드 클릭 → /members 이동
- [x] Trial Conversion 카드 클릭 → /intelligence/performance 이동
- [x] Member Retention 카드 클릭 → /intelligence/performance 이동
- [x] B2B Events 카드 클릭 → /intelligence/campaign-timeline 이동
- [x] Revenue 카드 클릭 → /revenue 이동

### Task 3: Anniversary Giveaway → Drive Day 이메일 마케팅 자동화
- [x] Giveaway 지원자 중 Drive Day 관심 가능성 높은 사람 필터링 로직 구현 (score 기반: golf exp, IL resident, indoor familiarity)
- [x] Encharge API 연동 — syncToEncharge mutation (tags: giveaway-2026, drive-day-prospect)
- [x] Drive Day Targeting 탭 — 체크박스 선택 + 원클릭 Encharge 동기화
- [x] CTA 정보 표시: $9 1시간 베이이용 예약 / Drive Day $20 for 90 min session
- [x] 상태 관리: pending → contacted → scheduled → completed → declined

## Sprint: 6가지 이슈 수정 (2026-02-26 Session 2)
- [ ] Sunday Clinic: "Members Attended" 클릭 시 참석 멤버 리스트 모달
- [ ] Sunday Clinic: "New Visitors" 클릭 시 신규 방문자 리스트 모달
- [ ] Winter Clinic: Registrations 숫자 클릭 시 등록자 연락처 리스트 모달
- [ ] Drive Day Meta Ads: 캠페인 이름 매칭 키워드 확장 ("putting clinic", "sunday", "instagram post", "this sunday")
- [ ] Instagram 페이지: iframe 제거 → Meta Graph API 데이터 기반 뷰로 교체
- [ ] AI Actions Approve: LLM 이메일 초안 생성 워크플로우 (3단계 시퀀스 초안 자동 생성)
- [ ] AI Actions: Approve 후 이메일 초안 리뷰/편집/Encharge 발송 UI 추가

## Sprint: 6 Issues Fix (2026-02-26)

### Issue 1: Sunday Clinic - Attendee List Modals
- [x] Add getSundayClinicAttendeeList tRPC endpoint (members vs new_visitors)
- [x] SundayClinicDetail: 'member attended' count → clickable → opens member list modal
- [x] SundayClinicDetail: 'new visitor acquisition' count → clickable → opens new visitor list modal
- [x] Modal shows: name, email (mailto link), phone, appointment type, date

### Issue 2: Drive Day Meta Ads Campaign Detection
- [x] Update SundayClinicDetail programKeywords to include broader Drive Day terms
- [x] Keywords now: ["drive day", "sunday clinic", "putting clinic", "sunday's putting", "this sunday"]

### Issue 3: Instagram Page Fix
- [x] Replace broken iframe embed with proper explanation (X-Frame-Options restriction)
- [x] Add quick action cards: View Profile, Analytics, Sync Data
- [x] Add direct links to profile feed, reels, tagged posts, Meta Business Suite
- [x] Add optional live feed widget section (Elfsight/LightWidget instructions)

### Issue 4: Winter Clinic - Registration Contact List
- [x] Add getWinterClinicAttendeeList tRPC endpoint (filter by clinic short name)
- [x] WinterClinicDetail: registration number → clickable → opens contact list modal
- [x] Modal shows: name, email, phone, amount paid

### Issue 5: AI Actions - Email Draft Workflow
- [x] Add generateEmailDraft tRPC mutation (LLM-powered, structured JSON output)
- [x] LLM generates: subject, preheader, 3-email sequence with body, CTA, send delay
- [x] AIActions: Add "Draft Emails" button for all email-type actions
- [x] Email draft modal: expandable per-email view, copy individual or all emails
- [x] Approve button still triggers Encharge tag; Draft Emails generates content first

### Issue 6: Email Sending Strategy (Analysis - no code changes needed)
- [x] Analyzed 3 scenarios: Encharge API, Encharge UI, Dashboard direct send
- [x] Recommendation documented in final result message

## Sprint: Meta Ads Status Sync + Drill-Down Lists + SMS/Email from Lists (2026-02-26)

### Issue 1: Meta Ads Campaign Status Sync
- [x] Fetch live campaign status from Meta Ads API (effective_status field)
- [x] Map Meta API status to dashboard display: COMPLETED→Completed, ACTIVE→Active, PAUSED→Paused
- [x] Update MetaAds.tsx Campaign Performance table to use live status from API
- [x] Fix Superbowl Watch Party_Feb2026 showing "Paused" instead of "Completed"
- [x] Fix IG_$100 Giveaway_Feb2026 showing "Paused" instead of "Completed"

### Issue 2: Clickable Drill-Down Lists
- [x] SundayClinicDetail: Acquisition Source numbers (Golf VX: 16, PBGA: 12, etc.) → click → contact list modal
- [x] SundayClinicDetail: Event Breakdown booking numbers (19, 11, 14, etc.) → click → contact list modal
- [x] Source badge chips in event breakdown also clickable
- [x] Backend: getSundayClinicAttendeesBySource(source) endpoint
- [x] Backend: getSundayClinicAttendeesByEvent(eventDate) endpoint

### Issue 3: SMS/Email Actions in Attendee Modals
- [x] Add "Send SMS" button in all attendee list modals (bulk or per-contact)
- [x] Add "Send Email" button in all attendee list modals (bulk or per-contact)
- [x] Wire to existing Communication tRPC router (sendSMS, sendEmail)
- [x] SundayClinicDetail: Members/NewVisitors modal + Source modal + Event modal all have SMS/Email All buttons
- [x] WinterClinicDetail: Registration modal has SMS/Email All buttons

## Sprint: 12-Issue Comprehensive Dashboard Update (2026-02-26 Session 3)

### Issue 1: Drive Day Members Attended - Encharge Email Button
- [ ] Add "Send via Encharge" button in Members Attended modal (trigger Encharge tag)
- [ ] Keep existing Email All / SMS All buttons for direct send

### Issue 2: Clickable Numbers → Contact List → Contact Detail Page
- [ ] Create ContactDetailPage.tsx (member profile: name, email, phone, tier, visits, booking history)
- [ ] Add /contacts/:id route in App.tsx
- [ ] All attendee modals: clicking a contact name navigates to /contacts/:id
- [ ] Revenue by Appointment Type: clicking booking count shows attendee list modal

### Issue 3: Instagram Reel + Meta Ads on Program Dashboard
- [ ] SundayClinicDetail: expand programKeywords to match Instagram post campaigns
- [ ] ProgramMarketingPanel: show all campaigns (not just active) for the program
- [ ] Show Instagram posts/reels linked to program keywords

### Issue 4: Instagram Sync - Complete Integration
- [ ] Add Instagram Graph API sync endpoint (fetch media, insights via Meta access token)
- [ ] InstagramViewer.tsx: show recent posts/reels from API, not just static links
- [ ] Auto-sync Instagram insights daily via scheduler

### Issue 5: Annual Giveaway - Live Count
- [ ] Add refetchInterval: 30000 to giveaway queries for live polling
- [ ] Add "Last updated" timestamp display

### Issue 6: Acuity Revenue Data Accuracy
- [ ] Fix getAcuityRevenue to use current year date range by default
- [ ] Debug why clinic appointments show $0 (check amountPaid vs priceSold vs price fields)
- [ ] Add fallback: if amountPaid=0, use price field from appointment type
- [ ] Revenue.tsx: show correct Acuity clinic revenue

### Issue 7: Meta Ads Auto-Recommendations
- [ ] Add generateMetaAdsRecommendations LLM procedure (analyze CTR, CPC, spend vs results)
- [ ] Auto-apply low-risk recommendations (budget adjustments within 20%)
- [ ] MetaAds.tsx: show AI recommendations panel with auto/manual action buttons
- [ ] Store recommendation history in aiRecommendations table

### Issue 8: Programs/Promotions Restructure
- [ ] Add "Promotions" section to sidebar (separate from Programs)
- [ ] Move Annual Membership Giveaway from Programs to Promotions
- [ ] Update App.tsx routes: /promotions/annual-giveaway
- [ ] Update DashboardLayout.tsx sidebar navigation

### Issue 9: Giveaway Applicants - Email Draft + Visit History
- [ ] AnnualGiveaway.tsx: add "Draft Email" button per applicant
- [ ] LLM generates personalized email draft for each applicant
- [ ] Show email draft modal with copy-to-clipboard
- [ ] Check if applicant is in members DB (new visitor vs existing member)
- [ ] Show "Known Member" or "New Visitor" badge per applicant

### Issue 10: Members List - Exclude Pro from All Members
- [ ] getAllMembers: by default exclude golf_vx_pro tier from "All Members" query
- [ ] Add excludePro: boolean param to members.list procedure
- [ ] All Members tab: pass excludePro=true
- [ ] Pro Members tab: filter only golf_vx_pro tier

### Issue 11: Communications Hub
- [ ] Communications.tsx: full send panel (compose email + SMS, select recipients)
- [ ] Recipient picker: search members, filter by tier/status
- [ ] Template library: pre-built message templates
- [ ] Send history with status tracking

### Issue 12: Revenue - Acuity Appointment Type Drill-Down
- [ ] Revenue.tsx: clicking appointment type row shows attendee list modal
- [ ] Add getAcuityRevenueAttendees(appointmentTypeId, minDate, maxDate) endpoint
- [ ] Fix Acuity Clinic showing $0 - investigate data source

## Bug Fixes: Drive Day Key Errors + SendGrid (2026-02-26)
- [x] Fix duplicate React keys in SundayClinicDetail EventAttendeeModal (use id+index instead of email+date)
- [x] Fix duplicate React keys in SundayClinicDetail SourceAttendeeModal
- [x] Fix duplicate React keys in SundayClinicDetail AttendeeListModal
- [x] Fix SendGrid not-configured error: show user-friendly toast instead of crashing DB insert

## Sprint: 5 UI/UX Fixes (2026-02-26 v2)

- [ ] Navigation: Remove 'Strategic Campaigns' submenu from Campaigns, move 'Meta Ads' under Promotions
- [ ] Navigation: Campaigns becomes a direct link (no submenu) or is removed/renamed
- [ ] B2B Events: Set goal to 1 per month (not 4), fix data source to use real Acuity data
- [ ] Mobile: Fix overlapping X-axis labels in Meta Ads charts (truncate names, rotate labels)
- [ ] Mobile: Fix chart tooltip overflow on mobile screens
- [ ] AI Actions: Add dismiss/clear button for failed and resolved actions
- [ ] AI Actions: Add 'Clear All Failed' bulk action button
- [ ] Email Draft: Update Drive Day email draft context to focus on upcoming Drive Day + Instagram reel link

## 5 Fixes Sprint (2026-02-26)
- [x] B2B Events: Use real Acuity data and set goal to 1/month (getStrategicKPIs updated)
- [x] Mobile chart overlap: Fix MetaAds.tsx chart labels for mobile (abbreviated X-axis, responsive containers)
- [x] AI Actions dismiss: Add dismiss button for error/monitoring items (new 'dismissed' status, dismissAction backend + frontend)
- [x] Navigation: Rename Campaigns page title from "Strategic Campaigns" to "Campaigns", Meta Ads stays under Promotions
- [x] Email draft: Add Drive Day + Instagram reel context to both campaigns and giveaway LLM prompts

## Market Research Module under Intelligence (2026-02-26)

### Phase 1: Schema & Backend
- [ ] Add market_research_reports table (id, title, topic, category, status, summary, full_report, sources, campaign_links, created_at)
- [ ] Add market_research_insights table (report_id, insight_type, content, priority, action_suggested)
- [ ] Run db:push migration
- [ ] Add tRPC procedures: research.list, research.getById, research.generate, research.delete, research.linkToCampaign

### Phase 2: Market Research Page UI
- [ ] Create MarketResearch.tsx under client/src/pages/
- [ ] Research topic picker: B2B/Corporate Events, Local Demographics, Competitor Analysis, Seasonal Trends, Membership Pricing
- [ ] Report card grid with status badges (generating, ready, archived)
- [ ] Full report viewer modal with structured sections (Summary, Key Findings, Opportunities, Risks, Recommended Actions)
- [ ] "Use in Campaign" button to link insights to a campaign strategy

### Phase 3: AI Research Generation
- [ ] LLM prompt for each research category (B2B corporate events in Arlington Heights IL, competitor indoor golf venues, etc.)
- [ ] Structured JSON output: summary, keyFindings[], opportunities[], risks[], recommendedActions[]
- [ ] Link generated insights to relevant campaigns (B2B research → Corporate Events campaign)
- [ ] Add "Generate Strategy" button that pre-fills campaign brief from research findings

### Phase 4: Navigation & Polish
- [ ] Add "Research" sub-item under Intelligence in DashboardLayout.tsx
- [ ] Add route /intelligence/research in App.tsx
- [ ] Write vitest tests for research router
- [ ] Save checkpoint

## Campaigns Page Enhancements (2026-02-26)
- [ ] Link Research reports to B2B Sales campaign card (show latest research summary inline)
- [ ] Add program list sorting (ROI, date, status) to all campaign cards
- [ ] Add B2B outreach email draft button to B2B Sales card

## Business Logic Sprint (2026-02-26)
- [ ] Remove Acuity from Revenue page comparison chart (Toast-only POS view)
- [ ] Fix membership KPIs: All Access + Swing Saver = customer members, goal 300; Pro members tracked separately
- [ ] Add Pro member Stripe payment tracking schema + placeholder UI
- [ ] Build Giveaway daily dashboard with AI daily action recommendations (goal: 500 applications)

## Boomerang MRR Data Sync (2026-02-27)
- [x] Parse ArlingtonHeights_ActiveMembers(Venuecopy).csv from Boomerang export
- [x] Add monthlyAmount and paymentInterval columns to members table schema
- [x] Run DB migration for new columns
- [x] Sync 87 active customer members from CSV (54 AA + 33 SS) with actual payment amounts
- [x] Sync 5 Pro members from CSV
- [x] Calculate actual MRR: AA $14,006 + SS $4,642 + Pro $2,000 = $20,648/mo total
- [x] Update getStrategicKPIs to return actual MRR from DB (allAccessMRR, swingSaverMRR, proMRR, totalMRR)
- [x] Update getStrategicKPIs to return paymentBreakdown (monthly vs annual count)
- [x] Update StrategicCampaigns.tsx membership card to show MRR breakdown from Boomerang
- [x] Update Performance.tsx member stats to show actual MRR instead of flat rates
- [x] Update Members.tsx stats cards to show Customer MRR, Total MRR from Boomerang
- [x] Update Home.tsx KPI bar to show MRR inline with member count
- [x] Write 7 unit tests for MRR calculation logic (all passing)

## AI Recommendations Execution (2026-02-27)
- [x] Trigger Encharge post-trial nurture sequence for trial converters (2 people tagged: Patrick Brosnahan, Jeff Suba)
- [x] Trigger Encharge 3-part nurture sequence for giveaway leads (3 people tagged: Henry Hackney Jr, Fallon Hantzos, Fernando Amador)
- [x] Mark Giveaway budget increase action as approved with manual Meta Ads instructions (1 kept, 7 duplicates dismissed)
- [x] Dismiss stale Trial Session targeting recommendations (4 dismissed — campaign not in live Meta Ads)
- [x] Update dashboard to show execution results for all 12 actions (Marketing Intelligence page reflects all statuses)
- [x] Save checkpoint after all actions applied

## Membership Event History Tracking (2026-02-27)

- [x] membership_events table created in DB (10 event types: joined/cancelled/upgraded/downgraded/paused/resumed/tier_changed/payment_failed/payment_recovered/renewed)
- [x] server/membershipWebhook.ts — POST /api/webhooks/boomerang-membership handler with secret validation
- [x] Encharge tag sync on all event types (addEnchargeTag/removeEnchargeTag)
- [x] DB helpers: logMembershipEvent, getMemberIdByEmail, getMemberHistoryByEmail, getChurnedMembers, getWinbackOpportunities, getMembershipEventSummary
- [x] tRPC procedures: members.getHistory, members.getHistoryByEmail, members.getChurnedMembers, members.getWinbackOpportunities, members.getEventSummary, members.logEvent
- [x] Members.tsx: Event History tab with 4 views (Member Timeline, Event Summary, Churned Members, Win-Back 90d)
- [x] Backfilled existing active members as "joined" events in DB
- [x] 15/15 vitest tests passing for membershipWebhook handler

## Public Preview Page (2026-02-27)

- [x] Add publicProcedure `preview.getSnapshot` in routers.ts returning key KPIs
- [x] Build /preview page (no auth required) with member counts, revenue, budget, campaign metrics
- [x] Register /preview route in App.tsx
- [x] Save checkpoint and deliver shareable link

## Encharge Email Activity Auto-Sync (2026-02-27)

- [x] Add encharge_broadcasts table to drizzle/schema.ts and push migration
- [x] Add DB helpers for upsert/query broadcasts in server/db.ts
- [x] Build enchargeSync service: poll broadcasts API, upsert metrics to DB
- [x] Add tRPC procedures: getEmailCampaigns, syncNow (protected), getEmailSummary
- [x] Build Email Campaigns tab/section in Communication or Overview page
- [x] Wire auto-sync cron job (every 30 min) in scheduledJobs.ts
- [x] Write vitest tests for sync service (17 tests pass)
- [x] Save checkpoint and deliver

## UI Cleanup (2026-02-27)

- [x] Remove email subscription status filter dropdown from Members list (keep data field, remove filter UI)

## ClickFunnels Funnel Analytics Integration (2026-02-28)

- [x] Add cf_funnels and cf_form_submissions tables to drizzle/schema.ts
- [x] Create clickfunnelsSyncService.ts to fetch and upsert funnel + submission data
- [x] Add tRPC procedures: getFunnels, getFunnelSubmissions, syncNow
- [x] Build Funnels page UI with funnel cards, opt-in counts, step breakdown, contact list
- [x] Add Funnels link to sidebar under Marketing & Programs
- [x] Wire auto-sync cron job (every 30 min) in scheduledJobs.ts
- [x] Write vitest tests for sync service (7 tests pass)
- [x] Seed initial funnel data (8 active funnels from CF API)
- [ ] Save checkpoint and deliver

## Frontend Reconstruction (2026-02-28)
- [x] client/src/index.css — Golf VX black/yellow theme
- [x] client/src/lib/trpc.ts — tRPC client binding
- [x] client/src/const.ts — auth helpers
- [x] client/src/hooks/useAuth.ts — auth hook
- [x] client/src/main.tsx — React entry point with providers
- [x] client/src/App.tsx — routing and layout
- [x] client/src/components/DashboardLayout.tsx — sidebar navigation
- [x] client/src/pages/Home.tsx — KPI dashboard
- [x] client/src/pages/MarketingIntelligence.tsx — 3-section autonomous actions
- [x] client/src/pages/Funnels.tsx — ClickFunnels integration with opt-in modal
- [x] client/src/pages/EmailCampaigns.tsx — Encharge broadcasts
- [x] client/src/pages/Members.tsx — member management table
- [x] client/src/pages/Preview.tsx — public read-only dashboard
- [x] TypeScript: 0 errors

## Google Sheets Giveaway Auto-Sync (2026-03-02)
- [ ] Create server/googleSheetsSync.ts with sync function using Google Sheets API
- [ ] Add syncGiveawayFromSheets tRPC endpoint (protectedProcedure)
- [ ] Schedule automatic sync 3x daily (8am, 2pm, 8pm CST) via scheduler.ts
- [ ] Update Home.tsx Giveaway card to show real-time count from DB
- [ ] Write vitest tests for sync function

## Google Sheets Auto-Sync (2026-03-02)
- [x] Rewrite googleSheetsSync.ts with CSV-based approach (no auth required)
- [x] Parse 69-row CSV with 72-column structure from Google Sheets
- [x] Implement duplicate detection via googleSheetRowId (primary) + email (legacy fallback)
- [x] Update scheduledJobs.ts: giveaway sync runs 3x daily (8am, 2pm, 8pm CST)
- [x] Update giveaway.sync tRPC endpoint to use syncGiveawayFromSheets
- [x] Update giveaway.getLastSyncInfo to return lastSyncedAt from DB
- [x] Add Annual Membership Giveaway card to Home.tsx dashboard
- [x] Giveaway card: progress bar, demographics, sync status, last sync time
- [x] "Sync Now" button with loading/success/error states
- [x] Migrate 27 legacy entries to link with googleSheetRowId via email matching
- [x] Write 10 vitest tests for googleSheetsSync.ts (all passing)
- [x] End-to-end test: 69 rows from sheet, 22 updated, 0 errors

## Giveaway Applications Detail Page (2026-03-02)
- [x] Review existing AnnualGiveaway.tsx and giveaway tRPC endpoints
- [x] Add giveaway.getApplicationsFiltered tRPC endpoint (paginated, filterable, with targeting score)
- [x] Build GiveawayApplications.tsx with filterable table
- [x] Filters: gender, age range, golf experience, Illinois resident, status, test entry toggle, search
- [x] Columns: name, email, phone, city, age range, gender, golf exp, indoor familiarity, Drive Day score, status
- [x] Drive Day targeting score (0-100) based on golf experience + IL resident + indoor familiarity
- [x] CSV export button
- [x] Row click → applicant detail drawer/modal
- [x] Wire route /giveaway in App.tsx and sidebar nav item
- [x] Write 19 vitest tests for getApplicationsFiltered endpoint (all passing)
