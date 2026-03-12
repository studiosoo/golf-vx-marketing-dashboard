/**
 * brandAssets.ts
 * Single source of truth for official third-party brand colors and assets.
 *
 * RULE: Whenever a third-party platform name or icon is displayed anywhere
 * in this dashboard, import from here and use the official brand values.
 * Never use a custom color or generic icon in place of official brand identity.
 */

export const BRAND_ASSETS = {
  instagram: {
    name: "Instagram",
    /**
     * Official Instagram gradient (45deg, left-bottom to right-top).
     * Use as `background` on a container with white icon inside — the standard
     * workaround when SVG icon libraries don't support gradient fill natively.
     */
    gradient: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)",
    colors: ["#F58529", "#DD2A7B", "#8134AF", "#515BD4"] as const,
    /** Mid-point solid fallback for contexts that can't use gradient (e.g. SVG stroke) */
    solidColor: "#DD2A7B",
  },
  meta: {
    name: "Meta",
    color: "#0082FB",
  },
  google: {
    name: "Google",
    color: "#4285F4",
  },
  kakao: {
    name: "Kakao",
    color: "#FEE500",
    textColor: "#191919",
  },
  acuity: {
    name: "Acuity Scheduling",
    color: "#003B5C",
  },
  toast: {
    name: "Toast",
    color: "#FF4C00",
  },
  asana: {
    name: "Asana",
    color: "#F06A6A",
  },
  encharge: {
    name: "Encharge",
    color: "#6C47FF",
  },
  twilio: {
    name: "Twilio",
    color: "#F22F46",
  },
} as const;
