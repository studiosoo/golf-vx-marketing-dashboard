import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import * as encharge from "../encharge";

export const membersRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(['active', 'inactive', 'cancelled', 'trial']).optional(),
      membershipTier: z.enum(['trial', 'monthly', 'annual', 'corporate', 'none', 'all_access_aces', 'swing_savers', 'golf_vx_pro']).optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getAllMembers(input || {});
    }),

  getStats: protectedProcedure.query(async () => {
    return await db.getMemberStats();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const member = await db.getMemberById(input.id);
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

  findDuplicates: protectedProcedure.query(async () => {
    const allMembers = await db.getAllMembers();
    const emailGroups = new Map<string, typeof allMembers>();
    for (const m of allMembers) {
      const key = m.email.toLowerCase().trim();
      if (!emailGroups.has(key)) emailGroups.set(key, []);
      emailGroups.get(key)!.push(m);
    }
    return Array.from(emailGroups.values()).filter(g => g.length > 1);
  }),

  mergeMembers: protectedProcedure
    .input(z.object({ primaryId: z.number(), duplicateIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const { members: membersTable } = await import('../../drizzle/schema');
      for (const dupId of input.duplicateIds) {
        await database.delete(membersTable).where(eq(membersTable.id, dupId));
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
    try {
      return { count: await encharge.getAHTILTagCount() };
    } catch (err) {
      return { count: 0 };
    }
  }),
});
