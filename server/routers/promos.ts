import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function landingUrl(slug: string): string {
  return `${ENV.appBaseUrl}/p/${slug}`;
}

function qrImageUrl(url: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=10`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const promosRouter = router({

  // ── Protected: management endpoints ────────────────────────────────────────

  list: protectedProcedure.query(async () => {
    const { getDb } = await import("../db");
    const { promos, promoLeads } = await import("../../drizzle/schema");
    const { desc, eq, count } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const rows = await db.select().from(promos).orderBy(desc(promos.createdAt));

    // Get lead counts per promo
    const leadCounts = await Promise.all(
      rows.map(async (p) => {
        const [res] = await db
          .select({ total: count() })
          .from(promoLeads)
          .where(eq(promoLeads.promoId, p.id));
        return { promoId: p.id, total: Number(res?.total ?? 0) };
      })
    );

    const countMap = Object.fromEntries(leadCounts.map((r) => [r.promoId, r.total]));

    return rows.map((p) => ({
      ...p,
      leadCount: countMap[p.id] ?? 0,
      landingUrl: landingUrl(p.slug),
      qrImageUrl: qrImageUrl(landingUrl(p.slug)),
    }));
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(256),
      slug: z.string().min(2).max(128).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
      offerType: z.enum(["free_session", "discount", "gift_card", "trial", "event", "other"]),
      description: z.string().max(1000).optional(),
      expiresAt: z.number().optional(),
      enchargeTag: z.string().default("Promo"),
      createSqrLink: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { promos } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const now = Date.now();
      const url = landingUrl(input.slug);

      // Optionally create SQR short link
      let sqrLinkId: string | undefined;
      let sqrLinkSlug: string | undefined;
      let sqrShortUrl: string | undefined;

      if (input.createSqrLink && ENV.sqrApiKey) {
        try {
          const { createSqrLink } = await import("../sqr");
          const link = await createSqrLink(input.slug, url);
          sqrLinkId = String(link.id);
          sqrLinkSlug = link.alias ?? input.slug;
          sqrShortUrl = link.short_url ?? `https://sqr.co/${input.slug}`;
        } catch (err) {
          console.error("SQR link creation failed:", err);
          // Continue without SQR link — not a blocking error
        }
      }

      const [result] = await db.insert(promos).values({
        slug: input.slug,
        title: input.title,
        offerType: input.offerType,
        description: input.description ?? null,
        status: "active",
        expiresAt: input.expiresAt ?? null,
        sqrLinkId: sqrLinkId ?? null,
        sqrLinkSlug: sqrLinkSlug ?? null,
        sqrShortUrl: sqrShortUrl ?? null,
        enchargeTag: input.enchargeTag,
        landingUrl: url,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, id: (result as any).insertId, landingUrl: url };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "inactive", "expired"]),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { promos } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(promos).set({ status: input.status, updatedAt: Date.now() }).where(eq(promos.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { promos } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(promos).where(eq(promos.id, input.id));
      return { success: true };
    }),

  getLeads: protectedProcedure
    .input(z.object({ promoId: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { promoLeads } = await import("../../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(promoLeads).where(eq(promoLeads.promoId, input.promoId)).orderBy(desc(promoLeads.submittedAt));
    }),

  getSqrStats: protectedProcedure
    .input(z.object({ sqrLinkId: z.string() }))
    .query(async ({ input }) => {
      const { getSqrLinkStats } = await import("../sqr");
      return await getSqrLinkStats(input.sqrLinkId);
    }),

  getSqrLinks: protectedProcedure.query(async () => {
    const { getSqrLinks } = await import("../sqr");
    const { getDb } = await import("../db");
    const { promos } = await import("../../drizzle/schema");
    const { isNotNull } = await import("drizzle-orm");

    // Get all SQR links from the API
    const allLinks = await getSqrLinks();

    // Get promos that have SQR links from our DB
    const db = await getDb();
    const promoRows = db
      ? await db.select({
          id: promos.id,
          title: promos.title,
          slug: promos.slug,
          sqrLinkSlug: promos.sqrLinkSlug,
          sqrLinkId: promos.sqrLinkId,
          status: promos.status,
        }).from(promos).where(isNotNull(promos.sqrLinkSlug))
      : [];

    // Build a set of known Golf VX SQR slugs
    const knownSlugs = new Set(promoRows.map((p) => p.sqrLinkSlug).filter(Boolean));

    // Filter SQR API links to only those that belong to our promos
    const filteredLinks = allLinks.filter((link) => {
      const alias = link.alias ?? "";
      return knownSlugs.has(alias);
    });

    // Enrich each filtered link with promo metadata from DB
    const promoBySlug = Object.fromEntries(promoRows.map((p) => [p.sqrLinkSlug, p]));

    return filteredLinks.map((link) => {
      const alias = link.alias ?? "";
      const promo = promoBySlug[alias] ?? null;
      return {
        ...link,
        promo: promo ? {
          id: promo.id,
          title: promo.title,
          slug: promo.slug,
          status: promo.status,
        } : null,
      };
    });
  }),

  // ── Public: landing page + lead capture ────────────────────────────────────

  getPublic: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const { promos } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return null;

      const [promo] = await db
        .select({
          id: promos.id,
          slug: promos.slug,
          title: promos.title,
          offerType: promos.offerType,
          description: promos.description,
          status: promos.status,
          expiresAt: promos.expiresAt,
        })
        .from(promos)
        .where(and(eq(promos.slug, input.slug), eq(promos.status, "active")));

      return promo ?? null;
    }),

  submitLead: publicProcedure
    .input(z.object({
      slug: z.string(),
      firstName: z.string().min(1).max(128),
      lastName: z.string().min(1).max(128),
      phone: z.string().max(32).optional(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { promos, promoLeads } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [promo] = await db.select().from(promos).where(eq(promos.slug, input.slug));
      if (!promo) throw new TRPCError({ code: "NOT_FOUND", message: "Promo not found" });
      if (promo.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "This promotion has ended" });

      const now = Date.now();

      // Save lead
      await db.insert(promoLeads).values({
        promoId: promo.id,
        venueId: promo.venueId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        email: input.email,
        submittedAt: now,
        enchargeStatus: "pending",
      });

      // Sync to Encharge (fire-and-forget, update status asynchronously)
      const tags = [promo.enchargeTag, `promo-${promo.slug}`].filter(Boolean);
      import("../encharge")
        .then(({ upsertEnchargePerson }) =>
          upsertEnchargePerson({
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            tags,
            fields: {
              promoSource: promo.slug,
              promoTitle: promo.title,
              promoClaimedAt: new Date(now).toISOString(),
            },
          })
        )
        .then(async (res) => {
          if (!res.success) return;
          const { eq: eqUpdate } = await import("drizzle-orm");
          await db
            .update(promoLeads)
            .set({ enchargeStatus: "synced", syncedAt: Date.now() })
            .where(eqUpdate(promoLeads.email, input.email));
        })
        .catch(console.error);

      return { success: true };
    }),
});
