/**
 * Stripe member snapshot — source-of-truth for member count, MRR, and tier breakdown.
 *
 * Source: golf_vx_member_contact_list_2026_03_18.csv (Stripe export, 2026-03-18)
 * Definition: "Members" = unique active paid Stripe contacts (excludes Comped/Staff).
 *
 * To update: re-export from Stripe, aggregate, and replace values below.
 * Durable DB-backed path: import CSV into `members` table (requires prod DB approval).
 */

export const stripeSnapshot = {
  asOf: "2026-03-18",
  source: "stripe-csv-export",

  /** All contacts in the Stripe export (including comped/staff). */
  totalContacts: 118,

  /** Unique active paid contacts (excludes Comped/Staff tier, $0 MRR rows). */
  payingMembers: 102,

  /** Total monthly recurring revenue across all paying tiers. */
  totalMRR: 22867.92,

  /**
   * Tier breakdown — grouped from raw Stripe tiers.
   * "All Access Ace" consolidates: All Access Ace + All Access Ace Annual + All Access Ace Founding.
   * "Swing Saver" consolidates: Swing Saver + Swing Saver Annual + Swing Saver Founding.
   */
  tiers: [
    {
      name: "All Access Ace",
      count: 36,
      mrr: 11269.17,
      /** Weighted avg monthly charge across annual + monthly billing. */
      avgMonthlyCharge: 313,
    },
    {
      name: "Swing Saver",
      count: 62,
      mrr: 10083.75,
      avgMonthlyCharge: 163,
    },
    {
      name: "Golf VX Pro",
      count: 3,
      mrr: 1500.0,
      avgMonthlyCharge: 500,
    },
    {
      name: "Legacy / Other",
      count: 1,
      mrr: 15.0,
      avgMonthlyCharge: 15,
    },
    {
      name: "Comped / Staff",
      count: 16,
      mrr: 0.0,
      avgMonthlyCharge: 0,
    },
  ],

  billingBreakdown: {
    monthly: 93,
    annual: 25,
  },
} as const;

export type StripeSnapshot = typeof stripeSnapshot;
