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

## Boomerang Webhook Integration (Express)
- [x] Convert Next.js webhook handler to Express format (server/boomerangWebhook.ts)
- [x] Add Boomerang webhook columns to email_captures table (boomerang_card_status, boomerang_template_id, boomerang_template_name, boomerang_device, boomerang_installed_at, boomerang_deleted_at)
- [x] Run DB migration for new columns via webdev_execute_sql
- [x] Register webhook at POST /api/webhooks/boomerang in server/_core/index.ts
- [x] Fix TypeScript errors (enchargeSubscriberId → enchargeId, name → firstName/lastName)
- [x] Fix schema column names (createdAt/updatedAt → created_at/updated_at for email_captures)
- [x] Test CardIssuedEvent → creates new record ✓
- [x] Test CardInstalledEvent → updates existing record ✓
- [x] Test CardDeletedEvent → updates with deleted status ✓
- [x] Test unauthorized request → 401 ✓
- [x] Write 6 vitest unit tests (all passing)
- [x] TypeScript: 0 errors
