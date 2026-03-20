# Golf VX Dashboard — Design System (Source of Truth)

> **This document is the authoritative implementation reference for all UI work.**
> In any conflict between this document and any other design reference, this document wins.

**Source files:** `client/src/index.css` · `client/src/lib/design-tokens.ts` · `client/src/lib/brandAssets.ts`
**Secondary reference:** [`02_visual-inspiration.md`](./02_visual-inspiration.md) — visual principles derived from app screenshots (advisory, not prescriptive)

---

## Conflict Resolution Rule

| Scenario | Winner |
|---|---|
| This doc vs. `02_visual-inspiration.md` | **This doc** |
| This doc vs. CLAUDE.md Layer 2 section | **This doc** (more specific) |
| This doc vs. any other design reference | **This doc** |

When a token or pattern is specified here, use it exactly. Do not extrapolate from screenshots or brand guidelines if this doc already specifies the value.

---

## 1. Color Tokens

### CSS Custom Properties (`client/src/index.css`)

```css
/* Backgrounds */
--gvx-bg-canvas:     #F6F6F4;   /* Main page background */
--gvx-bg-surface:    #FFFFFF;   /* Cards, popovers, sidebar */
--gvx-bg-muted:      #F8F9FA;   /* Section backgrounds */
--gvx-bg-hover:      #F1F1EF;   /* Hover state, active sidebar item */

/* Borders */
--gvx-border-faint:  #F0F0F0;
--gvx-border-light:  #E9E9E6;
--gvx-border-strong: #DEDEDA;

/* Text */
--gvx-text-primary:   #222222;
--gvx-text-secondary: #6F6F6B;
--gvx-text-muted:     #A8A8A3;
--gvx-text-inverse:   #FFFFFF;

/* Brand */
--gvx-yellow:         #F2DD48;
--gvx-yellow-soft:    #FDF9E3;
--gvx-charcoal:       #333333;

/* Status pairs (bg / text) */
--gvx-status-green-bg:    #E6F0DC;   --gvx-status-green-text:  #4C882A;
--gvx-status-orange-bg:   #F6E5CF;   --gvx-status-orange-text: #B46A0B;
--gvx-status-red-bg:      #F9E5E5;   --gvx-status-red-text:    #C81E1E;
--gvx-status-gray-bg:     #F1F1EF;   --gvx-status-gray-text:   #6F6F6B;
--gvx-status-blue-bg:     #EAF2FF;   --gvx-status-blue-text:   #1A56DB;
```

### Campaign Category Colors (`client/src/lib/design-tokens.ts`)

```typescript
CAMPAIGN_TRIAL_COLOR      = "#72B84A"   BG: "#E6F0DC"
CAMPAIGN_MEMBERSHIP_COLOR = "#4E8DF4"   BG: "#EAF2FF"
CAMPAIGN_RETENTION_COLOR  = "#A87FBE"   BG: "#F3EDF8"
CAMPAIGN_B2B_COLOR        = "#D89A3C"   BG: "#F6E5CF"
```

### Prohibited Values

| Value | Problem | Use instead |
|---|---|---|
| `#F5C72C` | Old yellow (pre-v2) | `#F2DD48` |
| `#111` / `#111111` | Wrong text-primary | `#222222` |
| `#F5F5F5`, `#F2F2F7` | Old surface tokens | `#F6F6F4` |
| `#3DB855` | Old green | `#4C882A` text / `#E6F0DC` bg |
| `#E0E0E0` | Old border | `#DEDEDA` |
| `#007AFF` | Old blue | `#1A56DB` |
| Tailwind `amber-*` | No token mapping | `--gvx-status-orange-*` |
| Tailwind `gray-*` badges | No token mapping | `--gvx-status-gray-*` |
| Tailwind `text-sm` (14px) | Wrong scale | `text-[13px]` |
| Tailwind `text-xs` (12px) | Wrong scale | `text-[11px]` |

### Color Usage Rules

- **Yellow (`#F2DD48`)** — CTAs, active tab underline, active sidebar marker, progress bar fill, chart primary series. Never decorative.
- **Status colors** — status badge text+background pairs only. Never card backgrounds or decorative fills.
- **95% of the UI is black/white/gray.** One colored background per screen, maximum.
- **External brand logos** — always use `simpleicons` CDN `<img>`. Never substitute with a colored box.

---

## 2. Typography

Font family: `Inter` (Google Fonts, loaded in `client/index.html`).
Pretendard: Korean character fallback only.

### Type Scale

| Token | Value | Note |
|---|---|---|
| `--gvx-text-xs` | 11px | Use `text-[11px]`. Tailwind `text-xs` = 12px — wrong. |
| `--gvx-text-sm` | 13px | Use `text-[13px]`. Tailwind `text-sm` = 14px — wrong. |
| `--gvx-text-base` | 15px | |
| `--gvx-text-lg` | 18px | |
| `--gvx-text-xl` | 22px | |
| `--gvx-text-2xl` | 28px | |
| `--gvx-text-page` | 20px | Page title |

### Usage Patterns

| Role | Tailwind classes |
|---|---|
| Page title | `text-xl font-bold text-[#222222]` |
| KPI number (page-level) | `text-[24px] font-bold text-[#222222] leading-none tracking-tight` |
| KPI number (card) | `text-[22px] font-bold` |
| Section header | `text-[13px] font-semibold text-[#A8A8A3] uppercase tracking-widest` |
| Card title | `text-[15px] font-bold text-[#222222]` |
| Body / data | `text-[13px] font-semibold text-[#222222]` |
| Secondary text | `text-[12px] text-[#6F6F6B]` |
| Label / meta | `text-[11px] text-[#6F6F6B]` |
| Micro label | `text-[10px] font-semibold uppercase tracking-wide text-[#A8A8A3]` |

---

## 3. Layout

### Sidebar

- Default width: 240px (min 200, max 360, user-draggable)
- `localStorage` key: `"sidebar-width-v2"`
- Sidebar offset is handled exclusively in `DashboardLayout.tsx`.
  **Never add `ml-[220px]` or equivalent to page components.**

### Spacing

| Usage | Value |
|---|---|
| Page padding | `p-8` |
| Card gap | `gap-4` |
| Section gap | `gap-6` / `space-y-6` |
| Card inner gap | `gap-3` |
| Card padding | `p-3` or `px-5 py-4` |
| Card radius | `rounded-xl` / `rounded-lg` |
| Card border | `border border-[#DEDEDA]` |
| Card shadow | `shadow-[0_1px_2px_rgba(0,0,0,0.03)]` |

---

## 4. Component Patterns

### KPI Stat Card

```tsx
<div className="rounded-xl border border-[#DEDEDA] bg-[#F6F6F4] p-3 text-left cursor-pointer transition-all hover:shadow-md">
  <p className="text-[11px] text-[#6F6F6B] font-medium truncate">Label</p>
  <p className="text-[22px] font-bold text-[#222222] leading-none tracking-tight">Value</p>
  <div className="h-1.5 bg-[#E9E9E6] rounded-full overflow-hidden mb-1">
    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#F2DD48' }} />
  </div>
</div>
```

### Section Header

```tsx
<h1 className="text-xl font-bold text-[#222222]">Page Title</h1>
<p className="text-[13px] text-[#6F6F6B] mt-1">Subtitle</p>
```

### Status Badges

```tsx
// active
style={{ background: "rgba(242,221,72,0.18)", color: "#B89A00" }}
// completed / ended
style={{ background: "rgba(216,154,60,0.18)", color: "#C47A20" }}
// upcoming
style={{ background: "rgba(78,141,244,0.15)", color: "#2F6CD4" }}
// planned
style={{ background: "rgba(168,168,163,0.2)", color: "#6F6F6B" }}

className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
// Valid types: "active" | "completed" | "upcoming" | "planned"
```

### Buttons

```tsx
// Primary
<button className="bg-[#F2DD48] text-[#222222] font-semibold hover:brightness-95 active:scale-95 transition-all">

// Secondary
<button className="text-[12px] text-[#6F6F6B] hover:text-[#222222] border border-[#DEDEDA] rounded-lg px-3 py-1.5 hover:bg-[#F1F1EF] transition-colors">
```

### Tab Navigation (standard — underline pattern)

```tsx
// Active tab
<button className="border-b-2 border-[#F2DD48] text-[#222222] font-semibold">
// Inactive tab
<button className="text-[#6F6F6B] border-b-2 border-transparent">

// Filled pill tabs (data-[state=active]:bg-[#F2DD48]) — NON-STANDARD, do not use in new components
```

### Loading / Error / Empty States

```tsx
// Loading
<div className="flex items-center justify-center py-16">
  <Loader2 className="h-6 w-6 animate-spin text-[#F2DD48]" />
</div>

// Error
<div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs">
  <AlertTriangle className="w-3.5 h-3.5 text-[#F2DD48] flex-shrink-0 mt-0.5" />
  <span className="text-amber-700 font-medium">Error message</span>
</div>

// Empty — use shared component
<EmptyState icon={<Icon />} message="" subtext="" />
```

### Data Confidence Labels

```tsx
<span className="text-[12px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">PARTIAL</span>
<span className="text-[12px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">EST</span>
<span style={{ fontSize: "11px", color: "#A8A8A3" }}>[AWAITING INTEGRATION]</span>
```

---

## 5. Third-Party Brand Assets

File: `client/src/lib/brandAssets.ts`

**Rule: Always use real brand logos via simpleicons CDN `<img>`. Never substitute with a colored box.**

```typescript
import { BRAND_ASSETS } from "@/lib/brandAssets";

// Brand colors
instagram: { gradient: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)", solidColor: "#DD2A7B" }
meta:      { color: "#0082FB" }
google:    { color: "#4285F4" }
kakao:     { color: "#FEE500", textColor: "#191919" }
acuity:    { color: "#003B5C" }
toast:     { color: "#FF4C00" }
asana:     { color: "#F06A6A" }
encharge:  { color: "#6C47FF" }
twilio:    { color: "#F22F46" }
```

### SimpleIcons CDN

URL pattern: `https://cdn.simpleicons.org/{slug}/{hex-without-#}`

| Brand | URL |
|---|---|
| Asana | `https://cdn.simpleicons.org/asana/F06A6A` |
| Monday.com | `https://cdn.simpleicons.org/monday/F62B54` |
| Microsoft Teams | `https://cdn.simpleicons.org/microsoftteams/6264A7` |
| Instagram | `https://cdn.simpleicons.org/instagram/E1306C` |
| Meta | `https://cdn.simpleicons.org/meta/0082FB` |
| Google Analytics | `https://cdn.simpleicons.org/googleanalytics/E37400` |
| Stripe | `https://cdn.simpleicons.org/stripe/635BFF` |
| Toast | `https://cdn.simpleicons.org/toast/FF4C00` |
| Encharge | `https://cdn.simpleicons.org/encharge/6C47FF` |

### Correct brand card pattern

```tsx
// Card itself is always neutral — only the logo carries brand color
<div className="rounded-xl border border-[#DEDEDA] bg-[#FFFFFF] p-4 flex items-center gap-3">
  <img src="https://cdn.simpleicons.org/asana/F06A6A" className="h-5 w-5 flex-shrink-0" alt="Asana" />
  <div>
    <p className="text-[13px] font-semibold text-[#222222]">Asana</p>
    <p className="text-[11px] text-[#6F6F6B]">Marketing execution</p>
  </div>
</div>
```

### Instagram gradient icon pattern

```tsx
<div className="h-6 w-6 rounded-md flex items-center justify-center"
     style={{ background: BRAND_ASSETS.instagram.gradient }}>
  <Instagram className="h-3.5 w-3.5 text-white" />
</div>
```

---

## 6. Charts

- CartesianGrid: `strokeDasharray="4 4" strokeWidth={0.5} stroke="#F0F0F0"`
- Primary series fill: `#F2DD48`
- Benchmark / previous period: gray
- Optional status series: `#1A56DB` (blue)
- No rainbow palettes.

---

## 7. Known Inconsistencies (Do Not Repeat)

| Issue | Location | Correct approach |
|---|---|---|
| `#F5C72C` old yellow | Reports.tsx:79 | `#F2DD48` |
| `#111` / `#111111` | Multiple files | `#222222` |
| Tailwind `text-sm` (14px) | Multiple files | `text-[13px]` |
| Tailwind `text-xs` (12px) | Multiple files | `text-[11px]` |
| Filled pill tab active state | InstagramAnalytics.tsx | Underline pattern |
| Brand shown as color box | Multiple pages | simpleicons CDN `<img>` |
| Category color as card background | Multiple pages | `bg-[#FFFFFF] border-[#DEDEDA]` |
| Multiple colored backgrounds on one screen | Multiple pages | Neutral bg + logo icon only |
