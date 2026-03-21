# Golf VX Dashboard — Visual Design Principles (Secondary Reference)

> **This document is advisory.** It captures the visual language of the Golf VX mobile app
> and translates it into dashboard guidance. When this document conflicts with
> [`01_design-system.md`](./01_design-system.md), the design system wins.

**Source:** `golf_vx_dashboard_style_guide_v2.md` (reverse-engineered from 20 Golf VX app screenshots, 2026-03-07)

---

## 1. What the App Tells Us

The Golf VX app is not a loud sports app. It is a **quiet, functional, lightly premium UI** built on:

- soft neutral backgrounds
- restrained typography
- minimal shadows
- sparse but deliberate accent colors
- yellow as the main action/emphasis color
- blue for informational/linked/competition status text
- green for category or positive status pills
- orange for caution/ended/pending states
- light-gray cards with subtle borders
- thin dividers and generous white space

The app avoids: glossy effects, heavy gradients, neon accents, thick borders, large shadow stacks, playful illustration systems, and aggressive enterprise dashboard chrome.

**That same restraint carries into the dashboard.**

---

## 2. Core Design Principles

### 2.1 Quiet utility

The UI is calm. Even where there is a lot of information, the app does not visually shout. Use layout and type hierarchy first. Use color only second.

### 2.2 Yellow is the primary trigger

Yellow is the most branded accent — used when the product wants the user to **act**, **notice**, or **focus**. It appears on: primary CTAs, selected nav emphasis, data highlight values, chart bars, pagination indicators.

Yellow should not become a decorative wallpaper color.

### 2.3 Neutrals carry the interface

The dominant visual experience is built by neutrals, not accents. White, off-white/light gray, mid-gray text, charcoal headings, fine gray dividers.

### 2.4 Functional accent colors are semantic, not decorative

| Color | Role |
|---|---|
| Yellow | Primary action / emphasis / selected / metric highlight |
| Blue | Linked state / competition progress / secondary interactive meaning |
| Green | Category / healthy / valid contextual status |
| Orange | Ended / caution / pending / attention state |

### 2.5 Shape language is soft, but not bubbly

Buttons, tabs, cards, and pills are rounded but not exaggerated. Clean, contemporary, lightly rounded.

### 2.6 Mobile → dashboard adaptation rule

When a mobile pattern does not translate directly to desktop: **keep the visual language, not the exact mobile layout.**

Examples:
- Mobile bottom nav → dashboard sidebar
- Swipe carousels → card groups
- Mobile segmented controls → desktop tabs
- Status pills → stay as pills

---

## 3. Recommended Token Values (from screenshots)

These are estimated from app screenshots, not extracted from design source files. The canonical implemented values are in `01_design-system.md`. Use these only to inform decisions not yet covered there.

```
Neutral surface:    #F6F6F4  (slightly warm off-white)
Card background:    #FFFFFF
Subtle surface:     #F1F1EF
Muted surface:      #E9E9E6
Border subtle:      #DEDEDA
Border strong:      #CFCFCA
Text primary:       #222222
Text secondary:     #6F6F6B
Text muted:         #A8A8A3

Yellow solid:       #F2DD48
Yellow deep:        #D5B925
Yellow soft:        #F8F1C8

Blue solid:         #4E8DF4
Blue soft:          #EAF2FF

Green solid:        #72B84A
Green soft:         #E6F0DC

Orange solid:       #D89A3C
Orange soft:        #F6E5CF

Charcoal panel:     #6C717C
```

> If the value you need is already specified in `01_design-system.md`, use that value. These screenshot-derived values are for filling gaps only.

---

## 4. Key Patterns Derived from App Screens

### Tabs (from competition screens)

- Active tab: darker text + **thin yellow underline**. No oversized pill.
- Inactive tab: gray text, no filled bright color.
- Segmented controls: muted gray group background, selected segment appears elevated/white.

### Charts (from statistics screens)

- Lots of open space, few series, clear labels, minimal grid noise.
- Primary bar: solid yellow, square or slightly softened corners, no gradient.
- Axes and guides: subtle gray, thin weight, recede behind data.
- Min/max markers: compact dark gray (min) / yellow (max) capsules.
- No rainbow palette.

### Cards (from competition list screens)

- White background, subtle border, radius 16px, padding 16–20px, minimal shadow.
- Category pill at top-left, status text adjacent.
- No thick card framing. Space and thin dividers carry separation.

### Status pills

| Type | Style |
|---|---|
| Green | Soft green bg + green text |
| Blue | Blue text (no bg required) |
| Orange | Soft orange bg + orange text |
| Yellow | Selected state / highlight callout only |

### Dark panels (from profile screen)

The charcoal profile banner works because it is: broad, calm, text-led, low-chroma, white text, yellow micro-accents. Use dark panels **sparingly** — only for milestone banners, executive spotlight modules, hero summary strips. Never turn the whole dashboard dark.

### Empty states

- Centered or calmly positioned.
- Muted gray text.
- No giant error icon, no bright warning colors.
- Emptiness should look quiet and intentional, not broken.

### Emoji and icons

The app shows almost no expressive emoji. Prefer simple line icons (Lucide). Never use emoji in page headers, navigation, KPI labels, or status semantics. If used at all, limit to editorial insight blocks only.

---

## 5. Dashboard-Specific Guidance

### Page shell

- Pale neutral background (`#F6F6F4`)
- White or slightly elevated modules
- Wide gutters (`p-8`)
- No dark sidebar unless minimal

### KPI cards

- White card, subtle border, 16–20px padding
- Small label in secondary gray, large metric in primary text
- Optional small status chip in green/orange/blue
- Do not use different background colors for each KPI card

### Tables

Tables should feel like Golf VX lists, not enterprise spreadsheets:
- Soft row dividers, no dark header bars
- Quiet header typography, aligned numerics
- Restrained badges, generous white space

### Calendars

Reference: booking history screen.
- White/pale surface, muted weekday labels
- Selected date: ring-based, not filled
- Booked/scheduled: blue dot
- Completed/expired: pale gray dot
- No colorful multi-dot clutter

### Charts in the dashboard

Reference: statistics screen.
- Yellow as primary series
- Gray as benchmark
- Minimal guides, strong whitespace
- Small min/max chips only if valuable
- No rainbow palette

---

## 6. Do / Don't Rules

### Do

- Use yellow intentionally
- Keep most surfaces neutral
- Use status pills with soft backgrounds
- Use thin dividers
- Keep text hierarchy clean
- Use tabs and segmented controls instead of crowded control bars
- Keep charts sparse
- Preserve whitespace
- Use icons instead of emoji for system UI

### Don't

- Don't turn every section into a colored card
- Don't add heavy shadows
- Don't use a rainbow chart palette
- Don't introduce red as a default alert color unless clearly product-wide
- Don't over-style empty states
- Don't use loud enterprise table chrome
- Don't add decorative gradients
- Don't mix multiple visual systems

---

## 7. Full Reference

The complete page-by-page derivation from all 20 screenshots is in:
`/Users/studiosoo/Documents/golf vx brand guide/golf_vx_dashboard_style_guide_v2.md`

Screenshots are in:
`/Users/studiosoo/Documents/golf vx brand guide/golf vx app screenshot/`
