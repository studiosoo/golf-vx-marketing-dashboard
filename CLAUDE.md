# CLAUDE.md — Golf VX Marketing Dashboard

> **Read this file FIRST before writing any code in this repository.**
> This is the definitive instruction set for all Claude agents working on this project.

---

## Project Identity

- **Repo:** `studiosoo/golf-vx-marketing-dashboard`
- **Domain:** `golfvxdashboard.studiosoo.com`
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

The dashboard follows the **Golf VX mobile app's visual language** — a clean, data-first, light-themed UI. This is intentionally different from the public website (which uses the corporate dark-theme brand). Both are valid expressions of Golf VX; they serve different contexts.

### Color Palette (App Implementation)

```css
/* === Core Palette === */
--brand-primary:     #F5C72C;  /* App Yellow — CTAs, active states, chart fills */
                               /* (Official brand yellow is #FFCD00; app uses this warmer value) */
--bg-default:        #FFFFFF;  /* Primary background */
--bg-secondary:      #F5F5F5;  /* Section backgrounds, alternating rows */
--surface-elevated:  #F2F2F7;  /* Cards, search inputs, elevated surfaces */
--text-primary:      #111111;  /* Headings, body text, primary labels */
--text-secondary:    #888888;  /* Meta text, descriptions, secondary labels */
--text-tertiary:     #AAAAAA;  /* Captions, placeholders, disabled text */
--border-default:    #E0E0E0;  /* Dividers, table borders, card borders */
--brand-green:       #3DB855;  /* Success, "In Progress", positive metrics */
--surface-dark:      #545A60;  /* Profile cards, dark accent surfaces */
--badge-dark:        #2C2C2C;  /* Grade badges, dark circular indicators */
--link-blue:         #007AFF;  /* Selected items, links, booking indicators */

/* === Tailwind Mapping === */
/* yellow:      #F5C72C  (use as brand color, not Tailwind's yellow-400) */
/* gray-100:    #F5F5F5 / #F2F2F7 */
/* gray-200:    #E0E0E0 */
/* gray-400:    #AAAAAA */
/* gray-500:    #888888 */
/* gray-600:    #545A60 */
/* neutral-800: #2C2C2C */
/* neutral-950: #111111 */
```

### Tailwind Config Extension

```javascript
// tailwind.config.js — extend theme
colors: {
  brand: {
    yellow: '#F5C72C',
    green: '#3DB855',
  },
  surface: {
    elevated: '#F2F2F7',
    dark: '#545A60',
  }
}
```

### Color Usage Rules

1. **Yellow (`#F5C72C`) is RESERVED** — only for: primary CTA buttons, active tab underlines, chart bar fills, active pagination dots, "Upcoming" status labels. Never decorative.
2. **95% of the UI is black/white/gray.** Yellow creates maximum contrast against the neutral background.
3. **Green (`#3DB855`)** — success states, "In Progress" labels, positive metric changes, competition badges.
4. **Blue (`#007AFF`)** — links, selected list items, booked calendar dates.
5. **No other accent colors.** If you need a warning state, use yellow. If you need an error state, use a muted red (`#FF3B30`) sparingly.

### Typography (App Implementation)

```css
font-family: 'Inter', -apple-system, 'SF Pro Text', sans-serif;
/* Inter is the brand primary (2026 guide). SF Pro Text is system fallback on Apple devices. */
```

| Role | Size | Weight | Color | Tailwind |
|------|------|--------|-------|----------|
| Page title | 17–18px | 600 | `#111111` | `text-lg font-semibold text-neutral-950` |
| Section heading | 16px | 700 | `#111111` | `text-base font-bold text-neutral-950` |
| List item title | 16px | 600 | `#111111` | `text-base font-semibold` |
| Body / default | 14–15px | 400 | `#111111` | `text-sm text-neutral-950` |
| Secondary / meta | 13px | 400 | `#888888` | `text-xs text-gray-500` |
| Caption / label | 12px | 400 | `#AAAAAA` | `text-xs text-gray-400` |
| Stat number (hero) | 28–36px | 700 | `#111111` | `text-3xl font-bold` |
| Stat on dark bg | 28px | 700 | `#F5C72C` | `text-2xl font-bold text-brand-yellow` |
| Button label | 15–16px | 600 | `#111111` | `text-base font-semibold` |
| Table header | 12px | 400 | `#AAAAAA` | `text-xs text-gray-400` |

**Letter spacing:**
- Body: `leading-snug` (line-height 1.4)
- Large stat numbers: `tracking-tight` (-0.02em)
- Captions: `tracking-wide` (+0.02em)
- Dark background + bright text: add `tracking-[0.01em]` minimum (brand rule: +10 spacing)

### Component Patterns

#### Buttons

```tsx
// Primary CTA — Yellow (full-width, bottom of screen)
<button className="w-full h-[52px] bg-brand-yellow text-neutral-950 font-semibold 
  text-base rounded-none active:opacity-80 transition-transform duration-100 
  active:scale-[0.98]">
  Book a Bay
</button>

// Primary CTA — Inline (rounded)
<button className="px-6 py-3.5 bg-brand-yellow text-neutral-950 font-semibold 
  rounded-[10px] hover:brightness-95 active:scale-95 transition-all duration-100">
  Save Settings
</button>

// Outline Button
<button className="px-4 py-2 bg-transparent border border-neutral-800 
  text-neutral-950 text-sm rounded-md hover:bg-gray-50">
  Competition Terms
</button>

// Settings row / list item
<div className="h-14 px-4 flex items-center justify-between 
  border-b border-gray-200 hover:bg-gray-50 active:bg-gray-50">
```

#### Cards

```tsx
// Standard card
<div className="bg-white border border-gray-200 rounded-[10px] p-4 
  shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow duration-150">
```

#### Tables

```tsx
// Column header
<th className="text-xs text-gray-400 font-normal px-4 py-2 
  border-b border-gray-200 text-left">

// Data row
<tr className="h-14 border-b border-gray-100 hover:bg-gray-50">
  <td className="px-4 text-sm font-semibold text-neutral-950">
  <td className="px-4 text-sm font-bold text-right">
```

#### Badges & Status

```tsx
// Competition badge
<span className="inline-block px-2 py-0.5 bg-green-50 text-brand-green 
  text-[11px] font-medium rounded">

// Status labels (text only, no background)
<span className="text-xs text-brand-green">In Progress</span>   // green
<span className="text-xs text-gray-400">Ended</span>            // gray
<span className="text-xs text-brand-yellow">Upcoming</span>     // yellow

// Grade badge (circle)
<div className="w-8 h-8 rounded-full bg-neutral-800 text-white 
  text-[13px] font-semibold flex items-center justify-center">
```

#### Navigation

```tsx
// In-page tab bar
<div className="h-11 flex border-b border-gray-200 bg-white">
  {/* Active tab */}
  <button className="px-4 text-neutral-950 font-semibold 
    border-b-2 border-brand-yellow">
  {/* Inactive tab */}
  <button className="px-4 text-gray-400 font-normal 
    hover:text-neutral-950 transition-all duration-200">
</div>
```

#### Form Elements

```tsx
// Search input
<input className="w-full h-9 bg-[#F2F2F7] border-none rounded-[10px] 
  px-3 text-sm text-neutral-950 placeholder:text-gray-400 
  focus:ring-1 focus:ring-gray-300 focus:outline-none" />
```

### Layout & Spacing

| Usage | Value | Tailwind |
|-------|-------|----------|
| Page edge padding | 16px | `px-4` |
| Card inner padding | 14–16px | `p-3.5` or `p-4` |
| Between sections | 24px | `space-y-6` |
| Between cards | 8–10px | `space-y-2` or `gap-2.5` |
| List item height | 56–64px | `h-14` or `h-16` |
| Section label margin-bottom | 8px | `mb-2` |

### Border Radius Reference

| Element | Radius | Tailwind |
|---------|--------|----------|
| Sticky bottom CTA | 0px | `rounded-none` |
| Inline button | 8–10px | `rounded-lg` |
| Card | 10–12px | `rounded-[10px]` or `rounded-xl` |
| Badge / tag | 4–6px | `rounded` or `rounded-md` |
| Search input | 10px | `rounded-[10px]` |
| Grade circle | 50% | `rounded-full` |
| Toast / snackbar | 20px | `rounded-[20px]` |

### Interaction States

```tsx
// Hover
"hover:bg-gray-50"       // list items, cards
"hover:shadow-md"        // cards
"hover:brightness-95"    // CTA buttons
"hover:text-neutral-950" // navigation links

// Active / Press
"active:bg-gray-50"      // list items
"active:opacity-80"      // bottom CTAs
"active:scale-95"        // buttons

// Transitions
"transition-all duration-200 ease-out"     // tab underlines
"transition-transform duration-100"         // button press
"transition-shadow duration-150"            // card shadow
"transition-opacity duration-300"           // modals
```

### Design Principles

1. **Brand identity is the foundation** — when in conflict, brand guidelines take precedence over app-style preferences.
2. **Yellow is reserved** — primary CTAs, active states, data moments only. Never decorative fill. (Brand rule: ≤20% of visual surface.)
3. **Minimal color vocabulary** — 95% black/white/gray. Yellow creates maximum contrast.
4. **Data-first hierarchy** — large bold numbers are the visual hero on data screens.
5. **Flat depth** — no heavy drop shadows. Use hairline borders and subtle background contrast.
6. **Type does the heavy lifting** — weight variation (regular → semibold → bold) conveys hierarchy, not color.
7. **Consistent density** — 56px list rows, 16px gutters, 10px card radius. Don't vary.
8. **Inter is primary** — consistent with 2026 brand guide. Do not substitute Pretendard unless Korean text is present.


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

*Last updated: March 19, 2026*

---

## Current Key Paths

```
client/src/pages/         # One file per page (100+ pages)
client/src/components/    # Shared UI components
  └── ui/                 # shadcn/ui primitives
  └── layout/             # SidebarNav, navConfig, CollapsibleNavItem
  └── activities/         # Activity-specific components (AssetGallery, etc.)
client/src/data/          # Static seed data (reportCampaignData, etc.)
client/src/lib/
  └── trpc.ts             # tRPC client
  └── design-tokens.ts    # Canonical v2 design tokens
server/
  ├── _core/index.ts      # Express app + startup migrations
  ├── routers.ts          # tRPC root router (imports domain routers)
  ├── routers/            # Domain routers: members, campaigns, advertising,
  │                       #   content, programs, activities, intelligence, asana
  ├── db.ts               # Drizzle query helpers (~1,000 lines)
  ├── acuity.ts           # Acuity Scheduling API client
  ├── metaAds.ts          # Meta Ads API client + cache
  ├── encharge.ts         # Encharge email API client
  └── autonomous.ts       # AI marketing engine
drizzle/schema.ts         # All 39 table definitions
scripts/                  # One-off ops scripts (import-toast-authoritative.cjs, etc.)
```

---

## Agent Operating Rules — V1

> These rules apply to all Claude agents and sessions working in this repository.
> They exist to prevent scope creep, protect production data, and keep PRs reviewable.

### Scope Constraints

- **Touch only what the task explicitly names.** Do not refactor, clean up, or "improve" adjacent code.
- **One concern per PR.** Data ops, schema changes, and feature work must not be bundled together.
- **No schema or migration changes** unless the task spec explicitly requires them and the output section documents what changed and why.
- **No env changes** unless the task spec names specific variables. Never log or echo secret values.

### Branch Rules

- Always branch from latest `origin/main` unless told otherwise.
- Branch naming: `feature/`, `fix/`, `chore/`, `ops/`, `audit/` prefixes required.
- Never commit directly to `main`.
- Never force-push to `main` or `origin/main`.

### Production Data Rules

- **No production DB writes** without explicit user approval in the current session.
- Before any import or mutation: run a dry-run, save a pre-snapshot, report the plan.
- Approved data windows must be enforced in the script itself, not just described.
- Import scripts must be idempotent (`ON DUPLICATE KEY UPDATE` or equivalent).

### PR Rules

- PRs must include: what changed, why, what was validated, and the exact run command if an ops script is involved.
- Do not merge or deploy — surface the PR link and stop.
- File scope must be verified before opening the PR.

### Output Rules

- Return structured reports in the format the task spec defines — no improvised formats.
- Flag uncertainty explicitly rather than guessing. Use "UNCLEAR — needs verification" when a fact cannot be confirmed from the codebase alone.
- Never claim an import or fix is complete without showing evidence (query result, dry-run output, or test pass).
