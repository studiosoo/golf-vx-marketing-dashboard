# CLAUDE.md — Golf VX Marketing Dashboard

> **Read this file FIRST before writing any code in this repository.**
> This is the definitive instruction set for all Claude agents working on this project.

---

## Project Identity

- **Repo:** `studiosoo/golf-vx-marketing-dashboard`
- **Domain:** `dashboard.playgolfvx.com`
- **Purpose:** Internal marketing operations dashboard for Golf VX locations, operated by Studio Soo (marketing agency)
- **Users:** Studio Soo marketers (full access), location staff (view-only), Golf VX HQ (future aggregate view)
- **Current pilot:** Golf VX Arlington Heights (644 E Rand Rd, Arlington Heights, IL 60004)

For full business context, see `Golf_VX_Master_Project_Brief.md` in the Claude.ai project knowledge.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.0 |
| Language | TypeScript | 5.3 |
| Build | Vite | 5.0 |
| API | tRPC | 11.0 |
| Styling | Tailwind CSS | 4.0 |
| Components | shadcn/ui + Radix UI | Latest |
| Routing | Wouter | 3.0 |
| Charts | Chart.js + react-chartjs-2 | 4.0 |
| Forms | React Hook Form + Zod | 7.0 / 3.0 |
| Backend | Express | 4.0 |
| ORM | Drizzle ORM | Latest |
| Database | MySQL (TiDB) | — |
| Scheduler | node-cron | 3.0 |
| Auth | JWT (migrating from Manus OAuth to Azure OAuth) | — |
| Package Manager | pnpm | 9.0 |
| Testing | Vitest | 2.1 |

---

## File Structure

```
golf-vx-marketing-dashboard/
├── client/src/
│   ├── pages/              # 38 page components (one file per page)
│   ├── components/         # Shared UI components
│   │   └── ui/             # shadcn/ui primitives
│   ├── lib/
│   │   └── trpc.ts         # tRPC client setup
│   ├── hooks/              # Custom React hooks
│   └── App.tsx             # Root component + routes
├── server/
│   ├── _core/index.ts      # Express app setup + webhook routes
│   ├── routers.ts          # All tRPC endpoints (3,740 lines — needs splitting)
│   ├── db.ts               # Database query helpers (1,000 lines)
│   ├── autonomous.ts       # AI marketing engine (922 lines)
│   ├── metaAds.ts          # Meta Ads API client (484 lines)
│   ├── cron.ts             # Scheduled jobs
│   ├── cache/              # JSON cache files for API fallback
│   └── tests/              # 19 test files (Vitest)
├── drizzle/
│   └── schema.ts           # Database schema (1,191 lines, 39 tables)
├── shared/                 # Shared types between client and server
├── SONNET_HANDOFF.md       # Manus-authored handoff documentation
└── package.json
```

**Known debt:** `routers.ts` is a 3,740-line monolith. When adding new endpoints, plan for eventual split into domain-based router files (members, campaigns, programs, analytics, etc.).

---

## Architecture Rules

### Multi-Tenant — MANDATORY

This codebase MUST support multiple Golf VX locations. Every piece of code you write must follow these rules:

1. **Every database table** must have a `venueId` column (or be venue-independent, like settings)
2. **Every query** must filter by `venueId` — never return unscoped data
3. **Never hardcode** location-specific values (name, address, phone, hours, prices)
4. **Read location data** from the `venues` table or a config object, never from constants
5. **Components** receive venue context via props or React context, never import literals
6. **Environment variables** for external APIs (Meta Ads tokens, Twilio credentials) must be structured per-venue

```typescript
// ❌ NEVER DO THIS
const PHONE = "(847) 749-1054";
const ADDRESS = "644 E Rand Rd, Arlington Heights, IL 60004";

// ✅ ALWAYS DO THIS
const venue = useVenueContext();
// venue.phone, venue.address, venue.name
```

### RBAC — Role-Based Access Control

Three user roles, enforced at the API level:

| Role | venueId scope | Feature access |
|------|--------------|----------------|
| `studio_soo` | All managed venues | Full dashboard: campaigns, automation, promotions, AI engine, reports |
| `location_staff` | Own venue only | Read-only metrics, member info, program enrollment, basic data entry |
| `hq_admin` | All venues | Cross-venue comparison, national campaign coordination (future) |

Use `adminProcedure` for Studio Soo-only endpoints. Create `staffProcedure` for location-staff-accessible endpoints.

### Shared Backend

This dashboard's tRPC API also serves the public website (`ah.playgolfvx.com`). A `public` router already exists for unauthenticated endpoints. When adding website-facing data:

- Add to the `public` router (no auth required)
- Still filter by `venueId` (passed as parameter, not from session)
- Keep response shapes lean — website doesn't need dashboard-level detail

---

## Design System

> **Guiding principle:** Brand identity is the foundation. When in doubt, brand guidelines take precedence. App-style decisions are refinements on top, not replacements.

This design system has two layers:

- **Layer 1 — Brand Identity Foundation:** Golf VX official brand rules from the corporate style guide. These are non-negotiable and apply everywhere the Golf VX name appears.
- **Layer 2 — App-Style Implementation:** Dashboard-specific visual decisions (light theme, density, component patterns). These adapt brand values for a data-first internal tool context.

---

## Layer 1 — Brand Identity Foundation

Source documents (in order of precedence):
- `GolfVX-BrandGuidelines-20260120-1-TK.pdf` — 2026 Style Guide (latest, authoritative)
- `Golf_VX_Brand_Guideline.pdf` — 2024 Brand Guidelines (original reference)

### Official Color Palette

```
Vanguard Black    #282828   (C0 M0 Y0 K95)    — primary brand dark, "Technology"
Vibrant Yellow    #FFCD00   (C0 M20 Y100 K0)  — primary brand accent, "Energy"
Velvet Grey       #7D7D7D   (C0 M0 Y0 K65)    — secondary neutral
Pure Black        #000000   (C0 M0 Y0 K100)   — maximum contrast use
Veldt Brown       #C39B6E   (C25 M40 Y65 K0)  — secondary palette
Vertu Brown       #55370F   (C40 M65 Y100 K50)
Valor Green       #143218   (C80 M50 Y85 K70)
Verve Grey        #4C4C4C   (C0 M0 Y0 K85)
White             #FFFFFF
```

> **Yellow HEX note:** The 2024 guide specifies #FFCD00 (Vibrant Yellow). The dashboard app implementation uses #F5C72C (see Layer 2). Layer 1 records the official brand value; Layer 2 records the app implementation value. Do not conflate them.

### Yellow Usage Rules (Brand-Level)

- **Yellow backgrounds must not exceed 20% of total brand design assets.** (Style A-4 rule)
- Yellow ("VX" in the logotype) represents Energy — use purposefully, not decoratively.
- `"GOLF"` in the logotype must always be set in Vanguard Black or white. **Yellow is never permitted for "GOLF".**
- Yellow backgrounds are not permitted as logo backgrounds. (See Colorways: Prohibited Use)

### Logo Rules

- **Always use supplied artwork.** Do not alter size, spacing, or ratio.
- **Clear space:** Calculated using the width of "F" horizontally and height of "X" vertically. No other elements sit within this space.
- **Minimum size:** 1/4" height for print, 24px height for web.
- **Primary colorways:** 4-color versions (Vanguard Black + Vibrant Yellow) are for primary use.
- **Monochrome versions** (black or white) are used only on approved mediums — black, dark grey, white, or yellow backgrounds, always paired with yellow & white layout elements. White monochrome must not appear on yellow background.
- **Text form:** Always write `Golf VX` (with space) in text. `GolfVX` is incorrect. `VX` alone must never represent Golf VX in text form.
- **Impact Logo** variant exists for high-impact placements — use supplied artwork only.

### Official Typography (Brand-Level)

**Primary font: Inter** (2026 Style Guide — web/print/video)  
**Secondary font: Pretendard** — required when text contains Korean characters

> **Version note:** The 2024 Brand Guidelines listed Pretendard as primary. The 2026 Style Guide reversed this, making Inter primary. **The dashboard follows the 2026 standard: Inter is primary for all web UI.**

Preferred weights: Black, Bold, Medium, Regular.

**Display / Headline type rules:**
- Leading: 90–100%
- Tracking: narrower than 0 (negative)
- Case style: UPPERCASE only (Inter headlines, titles)

**Body text rules:**
- Base: 10pt text / 12pt leading (120% ratio) — maintain this proportion across sizes
- Letter spacing: default for medium sizes; larger text uses less, smaller text uses more
- **Dark background + bright text:** add +10 letter-spacing in all situations
- Hyphenation: not allowed

**Paragraph breaks:**
- Use half-line space to separate paragraphs (e.g., leading 12pt → paragraph space 6pt)

**Highlight styles:** Bold, italic, underlines (3 styles), round-shape highlight pill

### Design Elements (Brand-Level)

**Lines:**
- Use mono-stroke lines only. Freehand lines with irregular stroke widths are not permitted.
- Gradients are allowed on lines.
- Use round or angled line tips.
- Minimum stroke weight: 0.3pt (0.3px).
- Lines applied asymmetrically.
- Lines may be used at thicker weight occasionally when functioning as graphic shapes.

**Glyphs:**
- Use round or angled shapes only.

**Illustrations:**
- Style A: Shape-based, mono-stroke, geometric, flat or gradient colors, 80% brand color.
- Style B: 3D rendering, retouched photo.
- Random/arbitrary illustration styles are not permitted.

### Layout Style Reference (Brand Vocabulary)

These are the named visual styles from the 2026 Style Guide. Reference when discussing design direction:

| Style | Description |
|-------|-------------|
| Style A — Plain Background | Flat color backgrounds. Primary: #000000 or #282828. Secondary: #7D7D7D or #FFCD00. Yellow bg ≤20% of assets. |
| Style B — Line Play | Thin asymmetric diagonal lines as design element. Gradients applied smoothly. B-4 includes subtle gradient. |
| Style C — Round | Rounded shape elements combined with other styles. |
| Style D — Cropped 'VX' | VX logomark cropped and used as background/graphic element. Crop the bottom "V" portion. Use subtly as background. |
| Pattern | Logo elements as repeating pattern. For special event posters, packaging, interior graphics. Not dominant. |
| Layout w/ Photo — Full Background | Photo as full BG, content box overlaid (semi-transparent, at least one rounded corner). Do not fully cover photo. |
| Layout w/ Photo — Divided | Photo occupies portion of layout, content in separate panel (basic, round, or angled-line division). |

---

## Layer 2 — App-Style Implementation (Dashboard)

This layer defines how the Golf VX brand identity is implemented in the web dashboard UI. It is derived from the native Golf VX mobile app visual language. The core design philosophy is "Quiet Utility": extreme reliance on whitespace, strict typographic hierarchy, ultra-thin dividing lines, and surgical use of brand yellow.

CRITICAL: Every new component, page, or UI element built in this dashboard must follow these rules without exception. Do not reference generic SaaS dashboard conventions. Do not invent new colors outside the token system below.

### Design Tokens

All colors must reference these CSS variables. Never hardcode hex values directly in components.
```css
:root {
  /* Surfaces */
  --gvx-bg-canvas: #F6F6F4;
  --gvx-bg-surface: #FFFFFF;
  --gvx-bg-muted: #F8F9FA;
  --gvx-bg-hover: #F1F1EF;

  /* Borders */
  --gvx-border-faint: #F0F0F0;
  --gvx-border-light: #E9E9E6;
  --gvx-border-strong: #DEDEDA;

  /* Typography */
  --gvx-text-primary: #222222;
  --gvx-text-secondary: #6F6F6B;
  --gvx-text-muted: #A8A8A3;
  --gvx-text-inverse: #FFFFFF;

  /* Brand Accents */
  --gvx-yellow: #F2DD48;
  --gvx-yellow-soft: #FDF9E3;
  --gvx-charcoal: #333333;

  /* Semantic Status */
  --gvx-status-green-bg: #E6F0DC;
  --gvx-status-green-text: #4C882A;
  --gvx-status-orange-bg: #F6E5CF;
  --gvx-status-orange-text: #B46A0B;
  --gvx-status-red-bg: #F9E5E5;
  --gvx-status-red-text: #C81E1E;
  --gvx-status-gray-bg: #F1F1EF;
  --gvx-status-gray-text: #6F6F6B;
  --gvx-status-blue-bg: #EAF2FF;
  --gvx-status-blue-text: #1A56DB;

  /* Golf-Specific */
  --gvx-golf-eagle: #F5A623;
  --gvx-golf-birdie: #F9D671;
  --gvx-golf-par: #E9E9E6;
  --gvx-golf-bogey: #7DC1E8;
  --gvx-golf-double: #4A90E2;
  --gvx-chart-negative: #FFA7A7;
}
```

### Yellow Usage Rule
`--gvx-yellow` (#F2DD48) is used ONLY for: primary CTAs, active tab underlines, main chart bars, and MAX indicators. Never as decorative fill. This value supersedes any previously used yellow (#F5C72C or #FFCD00) in dashboard components.

### Typography
- Font: `'Inter', sans-serif` (English) / `'Pretendard', sans-serif` (Korean)
- Page Title: 24px / 32px / weight 600 / `--gvx-text-primary` / tracking `-0.02em`
- Section Title: 18px / 26px / weight 600 / `--gvx-text-primary`
- KPI Number: 32px / 40px / weight 700 / `--gvx-text-primary` / tracking `-0.02em`
- Table Header: 12px / 16px / weight 500 / `--gvx-text-secondary`
- Body / Data: 14px / 20px / weight 400 / `--gvx-text-primary`
- Meta / Small: 12px / 16px / weight 400 / `--gvx-text-muted` / tracking `0.05em`

### Layout & Components
- Canvas background: `--gvx-bg-canvas`
- Card background: `--gvx-bg-surface`
- Card border: `1px solid var(--gvx-border-light)`
- Card border radius: `16px` standard / `12px` nested
- Card shadow: `0 1px 2px rgba(0,0,0,0.03)` only — no heavy shadows
- Sidebar background: `#FFFFFF` / `border-right: 1px solid var(--gvx-border-light)`
- Sidebar active item: `--gvx-text-primary` semibold + `--gvx-bg-hover` + `border-left: 3px solid var(--gvx-yellow)` — no filled background blocks
- Tab active: `border-bottom: 2px solid var(--gvx-yellow)` — no pill shapes
- Tab inactive: `--gvx-text-secondary`, hover → primary
- Status badges: `border-radius: 999px` / `4px 10px` padding / weight 500 / always soft-bg + dark-text token pairs

### Data Visualization
- Primary chart bars: solid `--gvx-yellow`, no gradients
- Secondary bars: `--gvx-border-strong`
- Negative values: `--gvx-chart-negative`
- Grid lines: dashed `stroke-dasharray: 4 4`, `stroke-width: 0.5px`, `--gvx-border-faint`
- Min indicator: dark capsule (`--gvx-charcoal` bg, white text)
- Max indicator: yellow capsule (`--gvx-yellow` bg, black text)
- Tables: horizontal dividers only — no vertical column dividers
- Table row min-height: `48px` / hover: `--gvx-bg-hover`
- Calendar events: dots below date numeral only — no filled cells

### Empty States & Feedback
- Empty state: centered, one mono-stroke icon (`stroke-width: 1.5px`, `--gvx-text-muted`), single text line
- Toast: `--gvx-charcoal` background, white text, bottom-right position


---

## Coding Conventions

### TypeScript

- Strict mode enabled. No `any` types unless absolutely unavoidable (add `// eslint-disable-next-line` with reason)
- Use Zod schemas for all API input validation
- Use Drizzle's type inference for database types — don't duplicate type definitions
- Prefer `const` over `let`. Never use `var`

### React

- Functional components only. No class components
- Use `React.FC` only when children prop is needed — otherwise type props inline
- Custom hooks go in `client/src/hooks/`
- Page components are one file per page in `client/src/pages/`
- Shared UI components go in `client/src/components/`
- Use shadcn/ui primitives before creating custom components

### tRPC

- All endpoints in `server/routers.ts` (until the refactor split)
- Use `publicProcedure` for website-facing, unauthenticated endpoints
- Use `protectedProcedure` for authenticated dashboard endpoints
- Use `adminProcedure` for Studio Soo-only operations
- Always validate input with Zod: `.input(z.object({ ... }))`
- Always include `venueId` in queries

### Drizzle ORM

- Schema definitions in `drizzle/schema.ts`
- Use `drizzle-kit` for migrations
- Query helpers go in `server/db.ts`
- Use Drizzle's query builder — avoid raw SQL unless performance-critical

### CSS / Tailwind

- Tailwind utility classes only — no custom CSS files except `globals.css`
- Use the design tokens defined above. Don't invent new colors
- Mobile-responsive: design mobile-first, then add `md:` and `lg:` breakpoints
- Use shadcn/ui `cn()` utility for conditional classes

### File Naming

- Components: `PascalCase.tsx` (e.g., `MemberProfile.tsx`)
- Utilities / hooks: `camelCase.ts` (e.g., `useVenueContext.ts`)
- Pages: `PascalCase.tsx` matching the route name
- Test files: `*.test.ts` alongside the file they test

### Git

- Commit messages: `type: description` (e.g., `feat: add member churn prediction`, `fix: Meta Ads cache expiry`)
- Branch names: `feature/description` or `fix/description`
- Always pull latest before starting work

---

## External Integrations — Quick Reference

| Service | Key env vars | Notes |
|---------|-------------|-------|
| Meta Ads | `META_ADS_ACCESS_TOKEN`, `META_ADS_ACCOUNT_ID` | Cache fallback in `server/cache/` |
| Boomerang POS | `BOOMERANG_API_TOKEN` | Webhook secret: `BOOMERANG_WEBHOOK_SECRET` |
| Acuity | `ACUITY_API_KEY`, `ACUITY_USER_ID` | Partial implementation |
| Encharge | `ENCHARGE_API_KEY`, `ENCHARGE_WRITE_KEY` | Partial implementation |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Module ready, account pending |
| Gemini LLM | `GEMINI_API_KEY` | Used for AI marketing reports |
| Instagram | `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Hybrid: API + manual input |

---

## Scheduler Reference

| Schedule | Task | File |
|----------|------|------|
| Daily 2:00 AM CST | Metrics snapshot (all campaigns) | `server/cron.ts` |
| Daily 8:00 AM CST | Autonomous engine run | `server/autonomous.ts` |
| Daily 6:00 PM CST | Autonomous engine run | `server/autonomous.ts` |
| Monday 8:00 AM CST | Weekly email report | `server/cron.ts` |

---

## Anti-Patterns — DO NOT

- ❌ Hardcode any Arlington Heights-specific data (address, phone, hours, prices)
- ❌ Add new colors outside the defined palette
- ❌ Use heavy drop shadows (keep it flat: `shadow-[0_1px_4px_rgba(0,0,0,0.06)]` max)
- ❌ Create new pages without `venueId` context
- ❌ Write raw SQL when Drizzle query builder can do the job
- ❌ Skip Zod validation on tRPC inputs
- ❌ Use `any` type without a documented reason
- ❌ Import Manus-specific packages (`vite-plugin-manus-runtime`, etc.) — these are being removed
- ❌ Put business logic in components — keep it in tRPC routers or dedicated server modules
- ❌ Use decorative yellow — yellow is functional only (CTAs, active states, data highlights)

---

*Last updated: March 2, 2026*
# CLAUDE.md — 디자인 시스템 섹션 (추가분)

> 이 섹션을 기존 CLAUDE.md 파일에 추가한다.
> 위치: 기존 "Layer 2: App-style dashboard implementation" 섹션 뒤에 삽입.
> 이 내용은 Claude Code, Genspark, 또는 다른 어떤 코드 작업 도구가 대시보드를 수정할 때도
> 반드시 준수해야 하는 **기준 문서**다.

---

## Design System — Golf VX App Reference (v1.0, March 2026)

> **권위 우선순위:** 2026 Style Guide > 2024 Brand Guidelines > 이 섹션
> 코드 작업 시 이 섹션의 디자인 토큰과 패턴을 반드시 따른다.
> 원본 참조 문서: `GolfVX_App_Design_System.md` (Studio Soo, March 2026)

---

### DS-1. 색상 시스템

#### Layer 1: 공식 브랜드 (Brand Guidelines 기준)
| 토큰 | 값 | 역할 |
|---|---|---|
| Brand Yellow | `#FFCD00` | 공식 브랜드 옐로우 (앱, 인쇄물) |
| Text Dark | `#1A1A1A` | 주요 텍스트 (라이트 배경) |

#### Layer 2: 대시보드 구현 (Dashboard Implementation)
| CSS 변수 | 값 | 역할 |
|---|---|---|
| `--gvx-yellow` | `#F5C72C` | CTA, active 탭, toggle ON, Max badge — 장식 금지 |
| `--gvx-yellow-muted` | `rgba(245,199,44,0.12)` | Key Insights 하이라이트 배경 |
| `--gvx-yellow-border` | `rgba(245,199,44,0.6)` | Key Insights 하이라이트 left-border |
| `--gvx-bg-page` | `#1A1A1A` | 페이지 최외곽 배경 |
| `--gvx-bg-surface` | `#242424` | 카드, 패널 |
| `--gvx-bg-elevated` | `#2E2E2E` | 호버, 드롭다운 |
| `--gvx-text-primary` | `#F0F0F0` | 제목, 숫자, 주요 텍스트 |
| `--gvx-text-secondary` | `#888888` | 서브라벨, 메타데이터 |
| `--gvx-text-tertiary` | `#555555` | 날짜, 단위, 비활성 |
| `--gvx-border` | `#2E2E2E` | 카드 테두리 |
| `--gvx-divider` | `#333333` | 행 구분선 |
| `--gvx-blue` | `#4A90E2` | 링크, In Progress, 선택 |
| `--gvx-green` | `#4ADE80` | 완료, 긍정 |
| `--gvx-purple` | `#A78BFA` | Monitoring |
| `--gvx-orange` | `#F5A623` | Awaiting, Individual badge |

#### 캠페인 색상
| CSS 변수 | 값 | 캠페인 |
|---|---|---|
| `--gvx-campaign-trial` | `#4ADE80` | Trial Conversion |
| `--gvx-campaign-membership` | `#60A5FA` | Membership Acquisition |
| `--gvx-campaign-retention` | `#A78BFA` | Member Retention |
| `--gvx-campaign-b2b` | `#FB923C` | B2B & Events |

#### ⚠️ Yellow 사용 규칙 (앱 디자인 시스템 7.1 준수)
- Yellow(`#F5C72C`)는 **CTA, active 탭 underline, toggle ON, Max badge**에만 사용
- **절대 금지:** 장식용 fill, 데이터 시각화 바, 일반 아이콘 색상, 텍스트 색상
- 화면 전체 surface 대비 yellow 면적 최대 20%
- Yellow 텍스트 사용 금지 — 강조는 underline 또는 `--gvx-yellow-muted` 배경으로

---

### DS-2. 타이포그래피

#### 폰트 패밀리
- **영어:** Inter (primary, 2026 Brand Guide 기준)
- **한국어:** Pretendard (secondary)

#### 사이즈 토큰
| CSS 변수 | 값 | 용도 |
|---|---|---|
| `--gvx-text-xs` | 11px | 타임스탬프, 배지, 각주, 축 레이블 |
| `--gvx-text-sm` | 13px | 바디, 테이블 행, 메타데이터, 서브라벨 |
| `--gvx-text-base` | 15px | 카드 바디, 설명, 폼 라벨 |
| `--gvx-text-lg` | 18px | 섹션 헤더, 카드 제목 |
| `--gvx-text-xl` | 22px | KPI 숫자 (카드 레벨) |
| `--gvx-text-2xl` | 28px | KPI 숫자 (페이지 레벨), 주요 통계 |
| `--gvx-text-page` | 20px | 페이지 타이틀 h1 |

#### 웨이트 토큰
| CSS 변수 | 값 |
|---|---|
| `--gvx-weight-regular` | 400 |
| `--gvx-weight-medium` | 500 |
| `--gvx-weight-semibold` | 600 |
| `--gvx-weight-bold` | 700 |

#### 숫자 + 단위 패턴 (앱 기준)
```html
<!-- 앱: bold 숫자 + 작은 lighter 단위 -->
<span class="kpi-number">206.0</span>
<span class="kpi-unit">yd</span>

/* kpi-number: --gvx-text-xl or 2xl, bold, --gvx-text-primary */
/* kpi-unit: --gvx-text-sm, regular, --gvx-text-secondary */
```

---

### DS-3. 컴포넌트 패턴

#### 카드
```css
background: var(--gvx-bg-surface);
border-radius: 10px;
border: 1px solid var(--gvx-border);
padding: 16–20px;
/* shadow OR border — 둘 다 사용하지 않는다 */
```

#### 탭 네비게이션 (앱 3.2 기준)
```css
/* active */
border-bottom: 2px solid var(--gvx-yellow);
color: var(--gvx-text-primary);

/* inactive */
color: var(--gvx-text-tertiary);
border: none;
```

#### 배지 (Status Pills)
| 배지 | 배경 | 텍스트 |
|---|---|---|
| In Progress | transparent | `#4A90E2` |
| Awaiting | transparent | `#F5A623` |
| Executed | transparent | `#4ADE80` |
| Ended / Archived | transparent | `#555555` |
| Trial | `rgba(74,222,128,0.15)` | `#4ADE80` |
| Membership | `rgba(96,165,250,0.15)` | `#60A5FA` |
| Retention | `rgba(167,139,250,0.15)` | `#A78BFA` |
| B2B | `rgba(251,146,60,0.15)` | `#FB923C` |

배지 스타일: `border-radius: 9999px; font-size: var(--gvx-text-xs); font-weight: 600;`
**outline-only 배지 사용 금지** — 항상 filled pill.

#### Key Insights 하이라이트 (앱 key phrase underline 대시보드 적용)
```css
/* 다크 배경이므로 underline 대신 하이라이트 카드 패턴 */
background: var(--gvx-yellow-muted);
border-left: 2px solid var(--gvx-yellow-border);
border-radius: 4px;
padding: 12px 16px;
```

#### 빈 상태 (Empty State, 앱 기준)
```tsx
// 모든 빈 상태는 icon + text 패턴
<div className="flex flex-col items-center gap-3 py-10 text-center">
  <div className="rounded-full border border-[var(--gvx-border)] p-3
                  text-[var(--gvx-text-tertiary)]">
    {icon}
  </div>
  <p style={{ fontSize: 'var(--gvx-text-sm)', color: 'var(--gvx-text-secondary)' }}>
    {message}
  </p>
</div>
```

#### 리스트 행
```
높이: 36–40px (테이블), 56px (설정/프로필 리스트)
레이아웃: 레이블 left / 값 right (chevron 있으면 값 왼쪽)
구분선: 1px solid var(--gvx-divider) bottom
```

#### CTA 버튼 계층
```
Primary:    bg var(--gvx-yellow), text #1A1A1A, semibold
Secondary:  bg transparent, border 1px var(--gvx-yellow), text var(--gvx-yellow)
Ghost:      bg transparent, border 1px var(--gvx-border), text var(--gvx-text-secondary)
Destructive: bg transparent, border 1px #F87171, text #F87171
```

#### 차트 색상
```
기본 데이터:  #60A5FA (blue), #4ADE80 (green), #A78BFA (purple) — 85% opacity
Max 표시:    var(--gvx-yellow) pill badge
Min 표시:    #3A3A3A dark pill badge
방향/음수:   #FFB3B3 (pink/salmon)
Reference:   dashed #555555
Yellow bar 사용 금지 — yellow는 MAX callout에만
```

---

### DS-4. 레이아웃 & 간격

```
기본 단위: 4px
권장 배수: 8 / 16 / 24 / 32 / 48px
카드 padding: 16–20px
섹션 gap: 24px
페이지 padding: 24–32px
```

---

### DS-5. 코드 작업 규칙

이 섹션은 Claude Code, Genspark, 또는 다른 어떤 도구가 대시보드를 수정할 때 반드시 따른다.

1. **색상 하드코딩 금지** — 반드시 CSS 변수(`--gvx-*`) 사용
2. **Yellow 장식 금지** — CTA, active 상태 외 yellow 사용 시 즉시 제거
3. **인라인 스타일 최소화** — 스타일은 CSS 변수 + Tailwind arbitrary value 사용
4. **타이포그래피 직접 px 금지** — 반드시 `--gvx-text-*` 토큰 사용
5. **`venueId` 필수** — 모든 DB 쿼리에 venueId 포함 (멀티테넌트 규칙)
6. **배지는 filled pill** — outline-only 배지 생성 금지
7. **빈 상태** — "No data" 단독 텍스트 금지, EmptyState 컴포넌트 사용
8. **숫자 + 단위** — 숫자 bold/large + 단위 regular/small 패턴 준수
9. **라우트 변경 금지** — UI 레이블 변경이 필요해도 route path는 유지
10. **프롬프트/지시문에 없는 수정 금지** — 명시된 범위 외 변경 없음

---

### DS-6. 참조 문서

| 문서 | 위치 | 역할 |
|---|---|---|
| GolfVX_App_Design_System.md | Studio Soo 프로젝트 | 앱 디자인 언어 원본 레퍼런스 (v1.0) |
| GolfVXBrandGuidelines202601201TK.pdf | 프로젝트 파일 | 2026 공식 브랜드 가이드 (Layer 1) |
| GolfVX_App_Design_System.docx | Studio Soo 프로젝트 | 위 md의 Word 버전 |

---

## Layout Grid (Layer 2)

### 페이지 기본 구조

```
사이드바 너비: 220px (fixed)
메인 콘텐츠 시작 X: 220px + 24px margin = 244px
메인 콘텐츠 최대 너비: calc(100vw - 244px)
내부 패딩: 32px (top), 32px (right), 32px (bottom), 32px (left)
Tailwind: p-8
```

### 페이지 헤더

```
"Good morning, {name}": 28px / bold / --gvx-text-primary (#222222)
  → margin-top: 0 (페이지 콘텐츠 최상단 기준)
  → margin-bottom: 4px

서브타이틀 (날짜/설명): 13px / regular / --gvx-text-secondary (#6F6F6B)
  → margin-bottom: 32px

페이지 제목 (h1, e.g. "Overview", "Activities"):
  → font-size: var(--gvx-text-xl) = 20px
  → font-weight: 600 (semibold)
  → margin-bottom: 24px
```

공통 컴포넌트: `client/src/components/layout/PageHeader.tsx`, `client/src/components/layout/PageTitle.tsx`

### 카드 박스

```
카드 padding: 20px 24px
카드 border-radius: 10px
카드 border: 1px solid var(--gvx-border, #DEDEDA)
카드 background: #FFFFFF
```

### 카드 간격 (gap)

```
row gap: 16px
column gap: 16px
섹션 간 gap: 32px
```

### 내부 텍스트 여백

```
카드 내 섹션 제목 → margin-bottom: 8px
카드 내 항목 간 → gap: 12px
카드 내 stat → gap: 24px (좌우)
```
