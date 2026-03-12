/**
 * Golf VX Dashboard Design Tokens — App-Native Style Guide
 * Source: golf_vx_dashboard_style_guide_v2.md (extracted from native Golf VX app screenshots)
 *
 * Yellow token note: YELLOW uses #F2DD48 extracted from the native app interface.
 * This supersedes all previous yellow values (#F5C72C, #FFCD00, #ffcb00).
 *
 * Philosophy: "Quiet Utility" — whitespace, strict typographic hierarchy,
 * ultra-thin dividing lines, surgical use of brand yellow.
 */

// ─── Surfaces & Canvas ───────────────────────────────────────────────────────
export const BG_CANVAS   = "#F6F6F4"; // main page canvas
export const BG_SURFACE  = "#FFFFFF"; // cards, popovers, sidebar
export const BG_MUTED    = "#F8F9FA"; // section backgrounds
export const BG_HOVER    = "#F1F1EF"; // hover rows, selected tab bg, subtle grouped

// Legacy aliases
export const BG_APP      = BG_CANVAS;
export const BG_ELEVATED = BG_SURFACE;
export const BG_SUBTLE   = BG_HOVER;

// ─── Borders & Dividers ──────────────────────────────────────────────────────
export const BORDER_FAINT  = "#F0F0F0"; // dashed chart grid lines
export const BORDER_LIGHT  = "#E9E9E6"; // card borders, sidebar border
export const BORDER_STRONG = "#DEDEDA"; // section separators, strong dividers

// Legacy alias
export const BORDER       = BORDER_STRONG;
export const BORDER_CARD  = BORDER_LIGHT;

// ─── Typography ──────────────────────────────────────────────────────────────
export const TEXT_PRIMARY   = "#222222"; // headings, data labels
export const TEXT_SECONDARY = "#6F6F6B"; // body support text
export const TEXT_MUTED     = "#A8A8A3"; // disabled, placeholder, low-emphasis
export const TEXT_INVERSE   = "#FFFFFF"; // text on dark surfaces

// ─── Brand Accents ───────────────────────────────────────────────────────────
export const YELLOW       = "#F2DD48"; // CTA, active tab underline, chart bars, MAX indicators
export const YELLOW_SOFT  = "#FDF9E3"; // soft yellow surface
export const CHARCOAL     = "#333333"; // dark accent, MIN indicators

// ─── Semantic Status Pairs ────────────────────────────────────────────────────
// Always use bg + text together for accessible contrast
export const GREEN_BG    = "#E6F0DC";
export const GREEN_TEXT  = "#4C882A";

export const ORANGE_BG   = "#F6E5CF";
export const ORANGE_TEXT = "#B46A0B";

export const RED_BG      = "#F9E5E5";
export const RED_TEXT    = "#C81E1E";

export const GRAY_BG     = "#F1F1EF";
export const GRAY_TEXT   = "#6F6F6B";

export const BLUE_BG     = "#EAF2FF";
export const BLUE_TEXT   = "#1A56DB";

// Legacy aliases (components using old names)
export const GREEN        = "#72B84A";
export const GREEN_SOFT   = GREEN_BG;
export const GREEN_BORDER = "#CFE2BF";
export const GREEN_DARK   = GREEN_TEXT;

export const ORANGE        = "#D89A3C";
export const ORANGE_SOFT   = ORANGE_BG;
export const ORANGE_BORDER = "#EAC9A1";

export const BLUE        = "#4E8DF4";
export const BLUE_SOFT   = BLUE_BG;
export const BLUE_BORDER = "#CFE0FF";

export const RED = "#FF3B30";

// ─── Golf Scoring Colors ─────────────────────────────────────────────────────
export const GOLF_EAGLE  = "#F5A623";
export const GOLF_BIRDIE = "#F9D671";
export const GOLF_PAR    = "#E9E9E6";
export const GOLF_BOGEY  = "#7DC1E8";
export const GOLF_DOUBLE = "#4A90E2";

// ─── Campaign Colors ──────────────────────────────────────────────────────────
// Consistent across Reports timeline, CampaignGrid, and CampaignCard
export const CAMPAIGN_TRIAL_COLOR      = "#72B84A"; // Trial Conversion — green
export const CAMPAIGN_TRIAL_BG         = "#E6F0DC";
export const CAMPAIGN_MEMBERSHIP_COLOR = "#4E8DF4"; // Membership Acquisition — blue
export const CAMPAIGN_MEMBERSHIP_BG    = "#EAF2FF";
export const CAMPAIGN_RETENTION_COLOR  = "#A87FBE"; // Member Retention — purple
export const CAMPAIGN_RETENTION_BG     = "#F3EDF8";
export const CAMPAIGN_B2B_COLOR        = "#D89A3C"; // B2B & Events — orange
export const CAMPAIGN_B2B_BG           = "#F6E5CF";

// ─── Chart Specific ──────────────────────────────────────────────────────────
export const CHART_NEGATIVE = "#FFA7A7"; // negative deviation bars

// ─── Shadow ──────────────────────────────────────────────────────────────────
export const SHADOW_CARD = "0 1px 2px rgba(0,0,0,0.03)";

/**
 * Tailwind class helpers — quick reference.
 *
 * Yellow (surgical use — CTAs, active states, chart bars, MAX indicators):
 *   bg-[#F2DD48]                         solid CTA button
 *   bg-[#FDF9E3]                         soft yellow surface
 *   border-b-2 border-[#F2DD48]          active tab underline
 *   border-l-[3px] border-l-[#F2DD48]    sidebar active left indicator
 *
 * Sidebar active item (new spec):
 *   border-l-[3px] border-l-[#F2DD48] bg-[#F1F1EF] text-[#222222] font-semibold
 *
 * Card pattern:
 *   bg-white border border-[#E9E9E6] rounded-2xl  (+ SHADOW_CARD inline)
 *
 * Status badge pairs (rounded-full, 4px 10px padding, text-[12px] font-[500]):
 *   bg-[#E6F0DC] text-[#4C882A]   green
 *   bg-[#F6E5CF] text-[#B46A0B]   orange
 *   bg-[#F9E5E5] text-[#C81E1E]   red
 *   bg-[#F1F1EF] text-[#6F6F6B]   gray
 *   bg-[#EAF2FF] text-[#1A56DB]   blue
 *
 * Charts:
 *   Primary bars: #F2DD48 (solid, no gradient, no border)
 *   Secondary:    #DEDEDA
 *   Negative:     #FFA7A7
 *   Grid:         dashed stroke-dasharray="4 4", stroke-width=0.5, color #F0F0F0
 */
