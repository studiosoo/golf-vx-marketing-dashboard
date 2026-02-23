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
