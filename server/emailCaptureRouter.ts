/**
 * emailCaptureRouter.ts
 * Golf VX Marketing Dashboard — Email Captures / Leads tRPC Router
 */
import { z } from "zod";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { emailCaptures } from "../drizzle/schema";
import { upsertEnchargePerson } from "./enchargeSync";

const emailSourceEnum = z.enum([
  "web_form", "meta_lead_ad", "giveaway", "clickfunnels",
  "instagram", "manual_csv", "boomerang", "acuity", "referral", "walk_in", "other",
]);

const emailStatusEnum = z.enum([
  "new", "contacted", "qualified", "converted", "unsubscribed", "bounced",
]);

export const emailCaptureRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(200).default(50),
      source: emailSourceEnum.optional(),
      status: emailStatusEnum.optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { page, limit, source, status, search } = input;
      const offset = (page - 1) * limit;
      const conditions: any[] = [];
      if (source) conditions.push(eq(emailCaptures.source, source));
      if (status) conditions.push(eq(emailCaptures.status, status));
      if (search) {
        const term = `%${search}%`;
        conditions.push(or(
          like(emailCaptures.email, term),
          like(emailCaptures.firstName, term),
          like(emailCaptures.lastName, term),
        ) as any);
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const [rows, [{ count }]] = await Promise.all([
        db.select().from(emailCaptures).where(where)
          .orderBy(desc(emailCaptures.capturedAt)).limit(limit).offset(offset),
        db.select({ count: sql<number>`COUNT(*)` }).from(emailCaptures).where(where),
      ]);
      return { data: rows, total: Number(count), page, limit, totalPages: Math.ceil(Number(count) / limit) };
    }),

  getStats: protectedProcedure.query(async () => {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [{ count: total }] = await db.select({ count: sql<number>`COUNT(*)` }).from(emailCaptures);
    const byStatus = await db
      .select({ status: emailCaptures.status, count: sql<number>`COUNT(*)` })
      .from(emailCaptures).groupBy(emailCaptures.status);
    const bySource = await db
      .select({ source: emailCaptures.source, count: sql<number>`COUNT(*)` })
      .from(emailCaptures).groupBy(emailCaptures.source);
    return {
      total: Number(total),
      byStatus: Object.fromEntries(byStatus.map(r => [r.status, Number(r.count)])),
      bySource: Object.fromEntries(bySource.map(r => [r.source, Number(r.count)])),
    };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(emailCaptures)
        .where(eq(emailCaptures.id, input.id)).limit(1);
      if (rows.length === 0) throw new Error(`Lead ${input.id} not found`);
      return rows[0];
    }),

  create: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      source: emailSourceEnum,
      sourceDetail: z.string().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const now = Date.now();
      const [result] = await db.insert(emailCaptures).values({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        source: input.source,
        sourceDetail: input.sourceDetail,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        notes: input.notes,
        capturedAt: now,
        status: "new",
      });
      return { id: (result as any).insertId as number };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, tags, ...rest } = input;
      await db.update(emailCaptures).set({
        ...rest,
        tags: tags !== undefined ? JSON.stringify(tags) : undefined,
      }).where(eq(emailCaptures.id, id));
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number().int(), status: emailStatusEnum }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(emailCaptures).set({ status: input.status })
        .where(eq(emailCaptures.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(emailCaptures).where(eq(emailCaptures.id, input.id));
      return { success: true };
    }),

  bulkImport: protectedProcedure
    .input(z.object({
      leads: z.array(z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        source: emailSourceEnum.default("manual_csv"),
        sourceDetail: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const now = Date.now();
      let inserted = 0, skipped = 0;
      const uniqueMap = new Map<string, (typeof input.leads)[number]>();
      for (const lead of input.leads) uniqueMap.set(lead.email.toLowerCase(), lead);
      for (const lead of Array.from(uniqueMap.values())) {
        const existing = await db.select({ id: emailCaptures.id })
          .from(emailCaptures).where(eq(emailCaptures.email, lead.email)).limit(1);
        if (existing.length > 0) { skipped++; continue; }
        await db.insert(emailCaptures).values({
          email: lead.email, firstName: lead.firstName, lastName: lead.lastName,
          phone: lead.phone, source: lead.source, sourceDetail: lead.sourceDetail,
          capturedAt: now, status: "new",
        });
        inserted++;
      }
      return { inserted, skipped };
    }),

  syncToEncharge: protectedProcedure
    .input(z.object({ ids: z.array(z.number().int()).optional() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const leads = input.ids && input.ids.length > 0
        ? await db.select().from(emailCaptures)
            .where(sql`id IN (${sql.join(input.ids.map(id => sql`${id}`), sql`, `)})`)
        : await db.select().from(emailCaptures);
      let synced = 0, errors = 0;
      for (const lead of leads) {
        if (!lead.email) continue;
        try {
          await upsertEnchargePerson({
            email: lead.email,
            firstName: lead.firstName ?? undefined,
            lastName: lead.lastName ?? undefined,
            phone: lead.phone ?? undefined,
            tags: lead.tags ? JSON.parse(lead.tags) : [],
          });
          await db.update(emailCaptures)
            .set({ enchargeId: lead.email, enchargeSyncedAt: Date.now() })
            .where(eq(emailCaptures.id, lead.id));
          synced++;
        } catch { errors++; }
      }
      return { synced, errors };
    }),
});
