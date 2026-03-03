/**
 * boomerangRouter.ts
 * Boomerang loyalty card management router
 */

import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { emailCaptures, communicationLogs } from "../drizzle/schema";
import * as Boomerang from "./boomerang";

export const boomerangRouter = router({
  // ── getConfig ─────────────────────────────────────────────────────────────
  getConfig: protectedProcedure.query(() => {
    return Boomerang.getBoomerangConfig();
  }),

  // ── getTemplates ──────────────────────────────────────────────────────────
  getTemplates: protectedProcedure.query(async () => {
    const templates = await Boomerang.getTemplates();
    return templates.map((t) => ({
      ...t,
      isMembership: t.type === 6,
    }));
  }),

  // ── getMembers ────────────────────────────────────────────────────────────
  getMembers: protectedProcedure
    .input(
      z.object({
        templateId: z.number().int(),
        page: z.number().int().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      return await Boomerang.getClientList(input.templateId, input.page);
    }),

  // ── getAllMembers ─────────────────────────────────────────────────────────
  getAllMembers: protectedProcedure
    .input(z.object({ templateId: z.number().int() }))
    .query(async ({ input }) => {
      return await Boomerang.getAllClients(input.templateId);
    }),

  // ── syncMembers ───────────────────────────────────────────────────────────
  syncMembers: protectedProcedure.mutation(async () => {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const syncData = await Boomerang.syncAllMembershipData();

    let synced = 0;
    for (const member of syncData.members) {
      if (!member.email) continue;

      const existing = await db
        .select({ id: emailCaptures.id })
        .from(emailCaptures)
        .where(eq(emailCaptures.email, member.email))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(emailCaptures)
          .set({
            boomerangClientId: String(member.id),
            boomerangCardSerial: member.card?.serialNumber,
            boomerangSyncedAt: Date.now(),
          })
          .where(eq(emailCaptures.id, existing[0].id));
      } else {
        await db.insert(emailCaptures).values({
          email: member.email,
          firstName: member.fName,
          lastName: member.sName,
          phone: member.phone,
          source: "boomerang",
          boomerangClientId: String(member.id),
          boomerangCardSerial: member.card?.serialNumber,
          boomerangSyncedAt: Date.now(),
          capturedAt: Date.now(),
          status: "new",
        });
      }
      synced++;
    }

    return {
      ...syncData,
      dbSynced: synced,
      members: syncData.members.map((m) => ({
        id: m.id,
        fName: m.fName,
        sName: m.sName,
        email: m.email,
        phone: m.phone,
        cardStatus: m.card?.status ?? "not installed",
        cardSerial: m.card?.serialNumber ?? null,
      })),
    };
  }),

  // ── lookupMember ─────────────────────────────────────────────────────────
  lookupMember: protectedProcedure
    .input(
      z
        .object({
          email: z.string().email().optional(),
          phone: z.string().optional(),
        })
        .refine((d) => d.email || d.phone, {
          message: "Provide at least one of email or phone.",
        })
    )
    .query(async ({ input }) => {
      const templates = await Boomerang.getMembershipTemplates();
      const results: Array<{
        template: Boomerang.BoomerangTemplate;
        client: Boomerang.BoomerangClient;
        cards: Boomerang.BoomerangCard[];
      }> = [];

      for (const template of templates) {
        const search = input.email ?? input.phone!;
        const client = await Boomerang.searchClient(template.id, search);
        if (!client) continue;

        const cards = input.email
          ? await Boomerang.getCardsByEmail(input.email)
          : await Boomerang.getCardsByPhone(input.phone!);

        results.push({ template, client, cards });
      }

      return results;
    }),

  // ── getCardInfo ──────────────────────────────────────────────────────────
  getCardInfo: protectedProcedure
    .input(z.object({ serialNumber: z.string() }))
    .query(async ({ input }) => {
      return await Boomerang.getCardInfo(input.serialNumber);
    }),

  // ── getTemplateCardStatus ─────────────────────────────────────────────────
  getTemplateCardStatus: protectedProcedure
    .input(z.object({ templateId: z.number().int() }))
    .query(async ({ input }) => {
      return await Boomerang.getTemplateCardStatus(input.templateId);
    }),

  // ── sendPush ─────────────────────────────────────────────────────────────
  sendPush: protectedProcedure
    .input(
      z.object({
        serialNumber: z.string(),
        message: z.string().min(1).max(240),
      })
    )
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const success = await Boomerang.sendPushToClient(
        input.serialNumber,
        input.message
      );

      await db.insert(communicationLogs).values({
        recipientType: "member",
        channel: "push",
        direction: "outbound",
        body: input.message,
        status: success ? "sent" : "failed",
        provider: "boomerang_push",
        providerMessageId: input.serialNumber,
        sentAt: Date.now(),
      });

      return { success };
    }),

  // ── broadcastPush ─────────────────────────────────────────────────────────
  broadcastPush: protectedProcedure
    .input(
      z.object({
        templateId: z.number().int(),
        message: z.string().min(1).max(240),
      })
    )
    .mutation(async ({ input }) => {
      const count = await Boomerang.sendPushToAll(input.templateId, input.message);
      return { sent: count };
    }),
});
