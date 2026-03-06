# Golf VX Marketing Dashboard — ChatGPT Handoff Document

> 이 문서는 새로운 AI 개발자(ChatGPT)가 이 프로젝트를 이어받아 작업할 수 있도록 작성되었습니다.
> 작성일: 2026-03-06

---

## 1. 프로젝트 개요

**Golf VX Marketing Dashboard** — 골프 시뮬레이터 실내 골프 시설 Golf VX Arlington Heights 매장의 내부 마케팅 운영 대쉬보드.

- **운영사:** Studio Soo (마케팅 에이전시)
- **클라이언트:** Golf VX Arlington Heights (644 E Rand Rd, Arlington Heights, IL 60004)
- **도메인:** `dashboard.playgolfvx.com`
- **GitHub:** `https://github.com/studiosoo/golf-vx-marketing-dashboard` (private)
- **용도:** Studio Soo 마케터 전용 내부 툴. 멤버십 관리, 광고 성과, 수익, 캠페인, AI 인사이트 등을 한 화면에서 관리.

---

## 2. 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| Frontend | React | 19.0 |
| 언어 | TypeScript | 5.3 |
| 빌드 | Vite | 5.0 |
| API | tRPC | 11.0 |
| 스타일 | Tailwind CSS | 4.0 |
| 컴포넌트 | shadcn/ui + Radix UI | Latest |
| 라우팅 | Wouter | 3.0 |
| 차트 | Chart.js + react-chartjs-2, Recharts | — |
| 폼 | React Hook Form + Zod | — |
| Backend | Express | 4.0 |
| ORM | Drizzle ORM | Latest |
| DB | MySQL (TiDB Cloud) | — |
| 스케줄러 | node-cron | 3.0 |
| 인증 | JWT (Azure OAuth 마이그레이션 진행 중) | — |
| 패키지 매니저 | **pnpm** | 9.0 |
| 테스트 | Vitest | 2.1 |

---

## 3. 개발 환경 세팅

### 클론 및 설치
```bash
git clone https://github.com/studiosoo/golf-vx-marketing-dashboard.git
cd golf-vx-marketing-dashboard
pnpm install
```

### 환경 변수 설정
`.env` 파일을 루트에 생성 (Golf VX 팀에서 실제 값 제공):
```
DATABASE_URL=mysql://...           # TiDB Cloud MySQL 연결 문자열 (SSL 필수)
JWT_SECRET=...
OAUTH_SERVER_URL=...
OWNER_OPEN_ID=...

# AI/LLM (선택 — 없으면 AI 기능 비활성)
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...

# 외부 서비스
META_ADS_ACCESS_TOKEN=...
META_ADS_ACCOUNT_ID=...
ACUITY_USER_ID=...
ACUITY_API_KEY=...
BOOMERANG_API_TOKEN=...
ENCHARGE_API_KEY=...
ENCHARGE_WRITE_KEY=...
SQR_API_KEY=...
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_BUSINESS_ACCOUNT_ID=...
```

### 실행
```bash
pnpm dev          # 개발 서버 (frontend + backend 동시)
pnpm check        # TypeScript 타입 체크
pnpm test         # Vitest 테스트 실행
pnpm build        # 프로덕션 빌드
```

---

## 4. 파일 구조

```
golf-vx-marketing-dashboard/
├── client/src/
│   ├── pages/              # 72개 페이지 컴포넌트 (페이지당 1파일)
│   ├── components/         # 공유 UI 컴포넌트
│   │   ├── ui/             # shadcn/ui 기본 컴포넌트
│   │   ├── layout/         # DashboardLayout, SidebarNav, navConfig
│   │   └── tabs/           # 탭 컴포넌트
│   ├── hooks/              # 커스텀 React 훅
│   ├── lib/
│   │   └── trpc.ts         # tRPC 클라이언트
│   └── App.tsx             # 루트 + 라우터
│
├── server/
│   ├── _core/
│   │   ├── index.ts        # Express 앱 세팅 + 웹훅
│   │   ├── trpc.ts         # tRPC 서버 세팅 (protectedProcedure 등)
│   │   ├── llm.ts          # LLM 호출 레이어 (Gemini/Anthropic)
│   │   └── env.ts          # 환경 변수
│   ├── routers/            # tRPC 라우터 (도메인별 분리)
│   │   ├── members.ts      # 멤버 + Encharge 라우터
│   │   ├── campaigns.ts    # 캠페인/프로그램 + 전략 캠페인
│   │   ├── advertising.ts  # Revenue 라우터
│   │   ├── intelligence.ts # AI 워크스페이스 라우터
│   │   ├── programs.ts     # 프로그램 상세
│   │   ├── promos.ts       # In-Store 프로모션 + SQR 링크
│   │   ├── content.ts      # Instagram 라우터
│   │   └── auth.ts         # 인증 라우터
│   ├── db.ts               # DB 쿼리 헬퍼 (~1,000줄)
│   ├── routers.ts          # 모든 라우터 통합 (구 모놀리식 — 점진적 분리 중)
│   ├── encharge.ts         # Encharge API 클라이언트
│   ├── enchargeSync.ts     # Encharge 양방향 동기화 모듈
│   ├── metaAds.ts          # Meta Ads API 클라이언트
│   ├── autonomous/         # AI 마케팅 자동화 엔진
│   ├── cache/              # API 폴백용 JSON 캐시
│   └── tests/              # 테스트 파일 (Vitest)
│
├── drizzle/
│   └── schema.ts           # DB 스키마 (39개 테이블)
│
├── shared/                 # 클라이언트+서버 공유 타입
├── CLAUDE.md               # 개발 규칙 (디자인 시스템, 아키텍처 규칙 포함)
└── .env                    # 환경 변수 (git 제외)
```

---

## 5. 핵심 아키텍처 규칙 (반드시 준수)

### 멀티테넌트 구조
- 모든 DB 테이블에 `venueId` 컬럼 필수
- 모든 쿼리는 `venueId`로 필터링
- 하드코딩 금지: 주소, 전화번호, 가격 등은 항상 `venues` 테이블에서 읽기

### 권한 (RBAC)
| 역할 | 접근 범위 |
|------|-----------|
| `studio_soo` | 전체 기능 |
| `location_staff` | 읽기 전용 |
| `hq_admin` | 멀티 매장 비교 (미래) |

tRPC 절차: `publicProcedure` / `protectedProcedure` / `adminProcedure`

---

## 6. 디자인 시스템 요약

### 브랜드 컬러 (엄격히 준수)
```css
--brand-yellow:   #F5C72C   /* CTA, 활성 탭, 차트 — 장식적 사용 금지 */
--text-primary:   #111111
--text-secondary: #888888
--border:         #E0E0E0
--bg-card:        #FFFFFF
--bg-secondary:   #F5F5F5
--brand-green:    #3DB855   /* 성공, 긍정 지표 */
--link-blue:      #007AFF
--error-red:      #E8453C
```

### 레이아웃 규칙
- 페이지 outer div: `className="space-y-N"` — **`p-6` 추가 금지** (DashboardLayout이 `p-4 md:p-6` 적용 중, 중복 시 모바일 오버플로우 발생)
- 폰트: Inter (primary), Pretendard (한국어 포함 시)
- 카드: `bg-white rounded-xl border border-[#E0E0E0] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]`
- 테이블: 항상 `<div className="overflow-x-auto">` 래퍼 필수 (모바일 대응)
- Tab bar: 탭이 3개 이상이면 `overflow-x-auto` 래퍼 필수

---

## 7. 현재 구현된 주요 기능

### 대쉬보드 홈 (`/`)
- **2026 핵심 목표 4가지** (상단 고정): 연 매출 $2M, 멤버십 300명, 인스타 팔로워 2,000, 이메일 구독자 5,000
- 실시간 MRR, 멤버 수, 수익 요약
- 캠페인 카드 (Membership Acquisition → 실제 멤버 수 / 300 진행률 표시)
- 활성 프로그램 health score

### 멤버 & CRM
- **Boomerang POS 멤버 동기화**: 자동 DB 동기화, 플랜별 분류
- 활성 멤버 = all_access_aces + swing_savers + golf_vx_pro + family + monthly + annual + corporate (Pro 포함)
- **멤버 목표: 300명** (2026 연간)

### 수익 (`/intelligence/revenue`)
- MRR, Toast POS MTD, Bay / Golf / F&B 카테고리별 분리
- 결제 방법 (현금/카드 비율), 팁, 할인, 게스트 수
- 일별 테이블 (8컬럼: Date, Total, Bay, Golf, F&B, Tips, Guests, Orders)

### 광고 (`/advertising` → Meta Ads)
- Meta Ads API 연동 (캐시 폴백)
- 캠페인 프로그램별 그룹핑 (`parseProgramGroup()`)
- CTR / CPC / CPM 지표 표시
- Active 우선 정렬, Paused 후순위

### 인스타그램 (`/website/instagram`)
- 토큰 만료 시 graceful degradation — 갱신 안내 카드 표시
- 팔로워 목표: **2,000명** (2026 연간)
- 포스트 스케줄러 (토큰 없어도 작동)

### AI 워크스페이스 (`/intelligence/assistant`)
- Gemini API 직접 연결 (`GEMINI_API_KEY`) 또는 폴백 프록시
- 채팅용 경량 모델, 분석용 고성능 모델 분리

### In-Store 프로모션 (`/promotions/hub`)
- SQR.co 링크 연동 (Golf VX 프로모션만 필터링)
- Encharge 이메일 구독 연동

### Encharge 이메일
- AHTIL 태그 구독자 카운트 (`encharge.getAHTILCount`)
- **이메일 구독자 목표: 5,000명** (AHTIL 태그 기준)

### ROI & KPI (`/roi`)
- 프로그램별 Meta Ads 성과
- KPI Goals 탭: Instagram Follower Growth 목표 **2,000** (DB kpiTarget 업데이트 완료)

---

## 8. 외부 서비스 연동 현황

| 서비스 | 상태 | 용도 |
|--------|------|------|
| Boomerang POS | ✅ 연동 | 멤버십 데이터, 웹훅 |
| Toast POS | ✅ 연동 | 매장 매출 (Bay/F&B) |
| Meta Ads | ✅ 연동 | 광고 성과 (캐시 폴백) |
| Acuity Scheduling | ✅ 연동 | 프로그램 예약/수익 |
| Encharge | ✅ 연동 | 이메일 자동화, AHTIL 구독자 |
| Instagram | ⚠️ 토큰 만료 | 60일 토큰 → 만료 시 Graph API에서 재발급 필요 |
| SQR.co | ✅ 연동 | QR 링크 |
| Gemini AI | ✅ 연동 | LLM 인사이트 |
| Twilio | 🔧 준비됨 | SMS (계정 셋업 대기) |
| Stripe | 🔧 준비됨 | 결제 (미사용) |

---

## 9. 2026 핵심 목표 (기능 개발 기준점)

| 목표 | 수치 | 데이터 소스 |
|------|------|------------|
| 연 매출 | $2,000,000 | MRR × 12 + Toast + Acuity run rate |
| 멤버십 | 300명 | Boomerang 활성 멤버 (Pro 포함) |
| 인스타 팔로워 | 2,000명 | Instagram Graph API |
| 이메일 구독자 | 5,000명 | Encharge AHTIL 태그 |

---

## 10. DB 스키마 주요 테이블

| 테이블 | 용도 |
|--------|------|
| `members` | Boomerang 멤버 (venueId 필수) |
| `campaigns` | 프로그램/캠페인 (kpiTarget, kpiActual 포함) |
| `toastDailySummary` | Toast POS 일별 매출 |
| `promos` | In-Store 프로모션 |
| `news_items` | 블로그/뉴스 게시물 |
| `venues` | 매장 정보 (멀티테넌트 기준) |
| `acuityAppointments` | Acuity 예약 데이터 |

전체 스키마: `drizzle/schema.ts` (39개 테이블)

---

## 11. 알려진 기술 부채 / 주의사항

1. **`server/routers.ts`** — 아직 3,700줄 모놀리식 파일. 신규 엔드포인트는 `server/routers/` 하위 별도 파일로 작성할 것
2. **Instagram 토큰** — 60일 만료. 만료 시 [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)에서 재발급 후 `INSTAGRAM_ACCESS_TOKEN` 환경변수 업데이트
3. **페이지 `p-6` 금지** — 각 페이지 최상위 div에 `p-6` 추가하면 DashboardLayout의 패딩과 중첩되어 모바일 오버플로우 발생. outer div는 `space-y-N`만 사용
4. **테이블은 반드시 `overflow-x-auto` 래퍼** — 모바일에서 수평 스크롤 필요
5. **`any` 타입** — 레거시 코드에 다수 존재. 신규 코드는 타입 명시 필수
6. **Manus 의존성 제거 중** — `BUILT_IN_FORGE_API_KEY` 등 Manus 관련 env var는 단계적 제거 예정

---

## 12. 네비게이션 구조

```
Dashboard (/)
├── Intelligence
│   ├── Autopilot (/intelligence/autopilot)
│   ├── Analytics
│   │   ├── Performance (/intelligence/performance)
│   │   ├── Revenue (/intelligence/revenue)
│   │   ├── Reports (/intelligence/reports)
│   │   ├── ROI & KPI (/roi)
│   │   └── Market Research (/intelligence/market-research)
│   ├── Strategy (/intelligence/strategy)
│   └── Assistant (/intelligence/assistant)
├── Marketing
│   ├── Programs & Events (/programs)
│   ├── In-Store Promos (/promotions/hub)
│   ├── Advertising (/advertising)
│   ├── Social & Content
│   │   ├── Instagram (/website/instagram)
│   │   └── Instagram Analytics (/website/instagram/analytics)
│   └── Communications
│       ├── News / Blog (/website/news)
│       ├── Email - Encharge (/communication/email-marketing)
│       ├── Drip Campaigns (/communication/drip)
│       ├── SMS & Announcements (/communication/announcements)
│       └── Automations (/communication/automations)
├── Contacts & CRM
│   ├── Members (/list/members)
│   ├── Pro Members (/pro-members)
│   └── Guests & Leads (/list/guests)
└── Settings
    ├── Integrations (/settings/integrations)
    └── Account (/settings/account)
```

---

## 13. 코딩 컨벤션

- **불변성 필수**: 객체 직접 수정 금지, spread operator 사용
- **컴포넌트**: 함수형만. `React.FC` 최소화
- **커스텀 훅**: `client/src/hooks/`
- **입력 검증**: tRPC input은 반드시 Zod 스키마
- **색상**: 위 팔레트 외 색상 추가 금지
- **커밋 형식**: `feat:`, `fix:`, `refactor:`, `chore:` 등 conventional commits

---

*이 문서는 2026년 3월 6일 기준으로 작성되었습니다. 최신 코드는 GitHub 저장소를 참고하세요.*

---

## 14. ChatGPT 시작 프롬프트 (복사해서 사용)

아래 프롬프트를 ChatGPT에 붙여넣어 프로젝트를 시작하세요.

---

```
You are taking over development of the Golf VX Marketing Dashboard — an internal marketing operations tool for Golf VX Arlington Heights, built and operated by Studio Soo (marketing agency).

## Step 1: Get the code

Clone the private GitHub repository:

git clone https://github.com/studiosoo/golf-vx-marketing-dashboard.git
cd golf-vx-marketing-dashboard
pnpm install

## Step 2: Read these files first (MANDATORY before touching any code)

1. CLAUDE.md — Architecture rules, design system, coding conventions, multi-tenant requirements
2. CHATGPT_HANDOFF.md — Project overview, current state, known issues, 2026 goals

## Step 3: Set up environment

Create a .env file at the project root with these variables (get values from the team):

DATABASE_URL=
META_ADS_ACCESS_TOKEN=
META_ADS_ACCOUNT_ID=
BOOMERANG_API_TOKEN=
BOOMERANG_WEBHOOK_SECRET=
ACUITY_API_KEY=
ACUITY_USER_ID=
ENCHARGE_API_KEY=
ENCHARGE_WRITE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
GEMINI_API_KEY=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
JWT_SECRET=

## Step 4: Start development server

pnpm dev

The app runs at http://localhost:5000 (frontend + backend on same port via Express).

## Tech Stack Summary

- React 19 + TypeScript 5.3 + Vite 5
- tRPC 11 (type-safe API — NO REST endpoints in client code)
- Tailwind CSS 4 + shadcn/ui components
- Drizzle ORM + MySQL (TiDB)
- Express 4 backend
- pnpm (NOT npm or yarn)

## Critical Rules (from CLAUDE.md)

1. MULTI-TENANT: Every DB query must filter by venueId. Never hardcode location data.
2. NO p-6 on page outer divs — DashboardLayout already provides padding. Pages use space-y-N only.
3. All tables need overflow-x-auto wrapper for mobile.
4. Colors: only use the defined palette (#F5C72C yellow, #3DB855 green, #111111, #888888, #E0E0E0, #FFFFFF). No new colors.
5. Yellow (#F5C72C) is RESERVED for CTAs, active states, data highlights only — never decorative.
6. tRPC only — client never calls fetch() directly to the backend.
7. New tRPC endpoints go in server/routers/ subdirectory files (NOT the monolithic server/routers.ts).
8. Zod validation on all tRPC inputs.

## 2026 Key Goals (track these in the dashboard)

1. Annual Revenue: $2,000,000
2. Active Members: 300 (Boomerang members, all tiers including Pro)
3. Instagram Followers: 2,000
4. Email Subscribers (Encharge AHTIL tag): 5,000

## Current Status (as of 2026-03-06)

- Dashboard is live at dashboard.playgolfvx.com
- Authentication: JWT-based (migrating from Manus OAuth to Azure OAuth)
- All major pages implemented (see CHATGPT_HANDOFF.md section 5 for full feature list)
- Known issues: Instagram Access Token expires every 60 days (manual refresh needed)
- server/routers.ts is a ~3,700-line monolith — new endpoints go in server/routers/ subdirectory

## Before writing any code

1. Confirm you've read CLAUDE.md and CHATGPT_HANDOFF.md
2. Run: npx tsc --noEmit (should return 0 errors before you start)
3. State which file(s) you plan to modify and why
4. Follow the design system in CLAUDE.md exactly — do not introduce new visual patterns

I'm ready to work on this project. What would you like me to do?
```
