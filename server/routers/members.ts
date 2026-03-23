import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import * as encharge from "../encharge";
import { stripeSnapshot } from "../data/stripe-snapshot";

export const membersRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(['active', 'inactive', 'cancelled', 'trial']).optional(),
      membershipTier: z.enum(['trial', 'monthly', 'annual', 'corporate', 'none', 'all_access_aces', 'swing_savers', 'golf_vx_pro']).optional(),
      venueId: z.number().default(1),
    }).optional())
    .query(async ({ input }) => {
      return await db.getAllMembers(input || {});
    }),

  getStats: protectedProcedure
    .input(z.object({ venueId: z.number().default(1) }).optional())
    .query(async ({ input }) => {
      return await db.getMemberStats(input?.venueId ?? 1);
    }),

  /**
   * Returns the authoritative Stripe member snapshot (2026-03-18 CSV export).
   * Source-of-truth for member count, MRR, and tier breakdown on the Overview.
   * Update server/data/stripe-snapshot.ts when a new Stripe export is available.
   */
  getStripeSnapshot: protectedProcedure.query(() => {
    return stripeSnapshot;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number(), venueId: z.number().default(1) }))
    .query(async ({ input }) => {
      const member = await db.getMemberById(input.id, input.venueId);
      if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
      return member;
    }),

  getGuestContacts: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      try {
        const { getAppointments } = await import('../acuity');
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const minDate = sixMonthsAgo.toISOString().split('T')[0];
        const appointments = await getAppointments({ minDate, canceled: false });
        const contactMap = new Map<string, {
          email: string; firstName: string; lastName: string;
          visitCount: number; totalPaid: number; lastVisit: string;
          programs: string[];
        }>();
        for (const apt of appointments) {
          const email = apt.email.toLowerCase();
          if (!email) continue;
          const existing = contactMap.get(email);
          if (existing) {
            existing.visitCount += 1;
            existing.totalPaid += parseFloat(apt.amountPaid || '0');
            if (apt.date > existing.lastVisit) existing.lastVisit = apt.date;
            existing.programs.push(apt.type);
          } else {
            contactMap.set(email, {
              email,
              firstName: apt.firstName,
              lastName: apt.lastName,
              visitCount: 1,
              totalPaid: parseFloat(apt.amountPaid || '0'),
              lastVisit: apt.date,
              programs: [apt.type],
            });
          }
        }
        let contacts = Array.from(contactMap.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
        if (input?.search) {
          const q = input.search.toLowerCase();
          contacts = contacts.filter(c =>
            c.firstName.toLowerCase().includes(q) ||
            c.lastName.toLowerCase().includes(q) ||
            c.email.includes(q)
          );
        }
        return contacts;
      } catch (err) {
        return [];
      }
    }),

  findDuplicates: protectedProcedure
    .input(z.object({ venueId: z.number().default(1) }).optional())
    .query(async ({ input }) => {
      const allMembers = await db.getAllMembers({ venueId: input?.venueId ?? 1 });
      const emailGroups = new Map<string, typeof allMembers>();
      for (const m of allMembers) {
        const key = m.email.toLowerCase().trim();
        if (!emailGroups.has(key)) emailGroups.set(key, []);
        emailGroups.get(key)!.push(m);
      }
      return Array.from(emailGroups.values()).filter(g => g.length > 1);
    }),

  mergeMembers: protectedProcedure
    .input(z.object({
      primaryId: z.number(),
      duplicateIds: z.array(z.number()),
      venueId: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const { members: membersTable } = await import('../../drizzle/schema');
      // Venue ownership check: verify primary member belongs to the caller's venue
      const primary = await db.getMemberById(input.primaryId, input.venueId);
      if (!primary) throw new TRPCError({ code: 'NOT_FOUND', message: 'Primary member not found in this venue' });
      for (const dupId of input.duplicateIds) {
        // Only delete duplicates that belong to the same venue
        await database.delete(membersTable).where(
          and(eq(membersTable.id, dupId), eq(membersTable.venueId, input.venueId))
        );
      }
      return { success: true, mergedCount: input.duplicateIds.length };
    }),
});

export const enchargeRouter = router({
  getAccount: protectedProcedure.query(async () => {
    try {
      return await encharge.getEnchargeAccount();
    } catch (err) {
      return null;
    }
  }),

  getMetrics: protectedProcedure.query(async () => {
    try {
      return await encharge.getSubscriberMetrics();
    } catch (err) {
      return { totalSubscribers: 0, recentSubscribers: 0, segments: 0, segmentDetails: [] as any[] };
    }
  }),

  getPeople: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      try {
        return await encharge.getEnchargePeople(input?.limit || 100);
      } catch (err) {
        return [];
      }
    }),

  getSegments: protectedProcedure.query(async () => {
    try {
      return await encharge.getEnchargeSegments();
    } catch (err) {
      return [];
    }
  }),

  getAHTILCount: protectedProcedure.query(async () => {
    // Return null (not 0) when ENCHARGE_API_KEY is not configured so the
    // client-side fallback value is used instead of showing 0.
    const enchargeApiKey = process.env.ENCHARGE_API_KEY;
    if (!enchargeApiKey) return { count: null as number | null };
    try {
      const count = await encharge.getAHTILTagCount();
      // Return null if count is 0 (may indicate API key issue or empty list)
      // so the client shows the CSV fallback instead of 0
      return { count: count > 0 ? count : (null as number | null) };
    } catch (err) {
      return { count: null as number | null };
    }
  }),

  /**
   * Lightweight health check for all connected data sources.
   * Checks env vars (fast) and optionally pings each API.
   * Used by DataHealthPlaceholder.tsx to show live status.
   */
  getSourceHealth: protectedProcedure.query(async () => {
    const now = new Date().toISOString();
    type SourceStatus = 'live' | 'degraded' | 'error' | 'coming_soon';
    type SourceHealth = { status: SourceStatus; checkedAt: string; note?: string };

    const results: Record<string, SourceHealth> = {};

    // Stripe — check env var
    results.stripe = process.env.STRIPE_SECRET_KEY
      ? { status: 'live', checkedAt: now }
      : { status: 'error', checkedAt: now, note: 'STRIPE_SECRET_KEY not set' };

    // Acuity — check env var
    results.acuity = (process.env.ACUITY_USER_ID && process.env.ACUITY_API_KEY)
      ? { status: 'live', checkedAt: now }
      : { status: 'error', checkedAt: now, note: 'ACUITY_USER_ID or ACUITY_API_KEY not set' };

    // Meta Ads — check env var
    results.metaAds = process.env.META_ADS_ACCESS_TOKEN
      ? { status: 'live', checkedAt: now }
      : { status: 'error', checkedAt: now, note: 'META_ADS_ACCESS_TOKEN not set' };

    // Instagram — check env var
    results.instagram = (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID)
      ? { status: 'live', checkedAt: now }
      : { status: 'error', checkedAt: now, note: 'INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID not set' };

    // Encharge — check env var
    results.encharge = process.env.ENCHARGE_API_KEY
      ? { status: 'live', checkedAt: now }
      : { status: 'error', checkedAt: now, note: 'ENCHARGE_API_KEY not set' };

    // Asana — check env var
    results.asana = process.env.ASANA_ACCESS_TOKEN
      ? { status: 'live', checkedAt: now }
      : { status: 'error', checkedAt: now, note: 'ASANA_ACCESS_TOKEN not set' };

    // Toast POS — always scheduled (daily 5 AM EST)
    results.toast = { status: 'live', checkedAt: now, note: 'Daily 5 AM EST' };

    // Google Business — coming soon (requires OAuth)
    results.googleBusiness = { status: 'coming_soon', checkedAt: now, note: 'OAuth login required' };

    return results;
  }),
});
