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

## Navigation Restructure (15 → 6 items)
- [x] Rename "Marketing Control Tower" to "Campaign HQ" everywhere
- [x] DashboardLayout sidebar: 6 items (Campaign HQ, Campaigns, Channels, Schedule, Members, Revenue & Reports)
- [x] No emoji in sidebar labels
- [x] Campaign HQ: Overview content + AI Insights tab (MarketingIntelligence)
- [x] Campaign HQ: Remove urgent action banner (AlertsBanner)
- [x] Campaign HQ: Remove AI recommendation card with manual checkboxes (ActionCenter)
- [x] Campaign HQ: Keep Sync All Data button, campaign cards, KPI progress
- [x] Campaigns page: Tabs (Strategic | Programs | Giveaway | ROI | Budget)
- [x] Channels page: Tabs (Meta Ads | Email | Instagram | Visuals)
- [x] Schedule page: Tabs (Calendar | Timeline)
- [x] Members: Keep as own full page (no merge)
- [x] Revenue & Reports: Merge Revenue + Reports with tabs
- [x] App.tsx routing updates for new structure
- [x] All existing page content preserved, just reorganized

## Members Data Integration & Email Capture System
- [x] Analyze current Members/Encharge/Acuity errors
- [x] Design unified contact/lead DB schema (email captures, social media leads, form submissions)
- [ ] Encharge API integration fix (member sync, subscriber data)
- [ ] Acuity Scheduling integration fix (appointment/booking data sync)
- [x] Email capture form data pipeline (social media, website forms → DB)
- [x] Prepare Genspark Sonnet 4.6 delegation prompt package

## Bug Fixes
- [x] Fix Encharge API JWT token error on Channels > Meta Ads page
- [x] Add graceful error handling to Encharge module (no crash on invalid/missing API key)
- [x] Fix Meta Ads tab showing empty/blank content on Channels page (data empty due to Meta API token - page renders correctly)

## Encharge API Key Setup
- [x] Set ENCHARGE_API_KEY environment variable (JWT token)
- [x] Set ENCHARGE_WRITE_KEY environment variable
- [x] Verify Encharge API connection test passes (5/5 tests pass, real data confirmed)
- [x] Confirm Encharge data displays correctly in dashboard

## Boomerang Membership Integration
- [x] Login to Boomerang and analyze membership data structure
- [x] Document Boomerang fields (plan types, status values, expiration dates, etc.)
- [x] Include Boomerang data schema in Genspark prompt
- [x] server/boomerang.ts — Boomerang API client (getTemplates, getAllMembers, getCardInfo, sendPush)
- [x] BoomerangMembersTab.tsx — UI with summary cards, template selector, member table, push notifications
- [x] boomerang tRPC router (getTemplates, getAllMembers, syncMembers, getCardInfo, sendPush)

## Twilio SMS/Email Integration
- [x] Include Twilio SMS/Email sending utilities in Genspark prompt
- [x] Include message history DB schema in Genspark prompt
- [x] Include recipient selection UI component in Genspark prompt
- [x] server/twilio.ts — Twilio SMS + SendGrid email module with DB logging
- [x] communication_logs DB table (channel, status, cost tracking)
- [x] CommunicationPanel.tsx — SMS/Email composer with history viewer
- [x] communication tRPC router (sendSMS, sendEmail, getHistory, getStats)

## Updated Genspark Prompt Package v2
- [x] Prepare comprehensive Genspark prompt with Boomerang + Encharge + Twilio + Email Capture

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
- [x] 20 vitest integration tests passing (emailCapture CRUD, boomerang API, communication history, schema validation)

## Bug: Campaigns not showing updated data + Meta Ads tab empty
- [x] Investigate Meta Ads API credentials and connection status
- [x] Check data sync pipeline (cache, API calls, scheduler)
- [x] Fix root cause and verify campaigns display current data
- [x] Fix Meta Ads tab on Channels page showing no current data

## Bug: Programs page missing from Campaigns tab
- [x] Investigate current Campaigns tab structure and find Programs component
- [x] Restore Programs content under Campaigns > Programs tab
- [x] Verify all 8 marketing programs display correctly

## Programs as separate sidebar nav item
- [x] Add Programs as its own sidebar nav item below Campaigns
- [x] Restore /programs route in App.tsx
- [x] Verify Programs page component exists and shows all 8 programs
- [x] Seed 8 programs into campaigns table with correct data and multi-campaign mappings
- [x] Verify Campaign HQ shows correct program counts per strategic campaign
- [x] Show related programs within each campaign detail view

## Meta Ads API Credential Setup
- [x] Verify Meta Ads token via MCP server (5 campaigns, $821.59 spend)
- [x] Set META_ADS_ACCESS_TOKEN, META_ADS_ACCOUNT_ID, META_ADS_SYSTEM_USER_ID env vars
- [x] Verify live campaign data pulls through dashboard
- [x] Confirm Campaign HQ and Meta Ads tab show real data

## MCP-Based Meta Ads Data Pipeline (Option A)
- [x] Fetch campaign data via MCP server and write to .meta-ads-cache/insights.json
- [x] Add getCampaignsFromCache() to metaAdsCache.ts
- [x] Add cache fallback to getCampaigns router endpoint
- [x] Rewrite refreshMetaAdsCache.ts to try direct API then fall back to cache
- [x] Sync Meta Ads spend from cache to campaigns DB table (sync-meta-ads-from-cache.mjs)
- [x] Auto-link Meta Ads campaigns to programs by name matching
- [x] Add Superbowl Watch Party as new program (9 total)
- [x] Verify Campaign HQ shows live Meta Ads spend ($282 Trial, $464 Membership, $75 Retention)
- [x] Verify Meta Ads tab shows all 5 campaigns ($821.59 total spend, 117K impressions)
- [x] Verify Programs page shows 9 programs with $1,262.79 total spend
