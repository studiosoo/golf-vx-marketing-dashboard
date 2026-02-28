/**
 * communicationRouter.ts
 * SMS / email send + history router
 */

import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { communicationLogs } from "../drizzle/schema";
import {
  sendSMS,
  sendBulkSMS,
  sendEmail,
  sendBulkEmail,
  personalizeMessage,
} from "./twilio";

const recipientTypeEnum = z.enum(["member", "lead"]);
const channelEnum = z.enum(["sms", "email", "push"]);

export const communicationRouter = router({
  // ── sendSMS ───────────────────────────────────────────────────────────────
  sendSMS: protectedProcedure
    .input(
      z.object({
        recipientId: z.number().int(),
        recipientType: recipientTypeEnum,
        recipientName: z.string().optional(),
        phone: z.string(),
        body: z.string().min(1).max(1600),
        campaignName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await sendSMS({
        to: input.phone,
        body: input.body,
        campaignName: input.campaignName,
      });

      await db.insert(communicationLogs).values({
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        recipientPhone: input.phone,
        recipientName: input.recipientName,
        channel: "sms",
        direction: "outbound",
        body: input.body,
        status: result.success ? "sent" : "failed",
        provider: "twilio_sms",
        providerMessageId: result.messageId,
        errorMessage: result.error,
        campaignName: input.campaignName,
        costCents: result.costCents,
        sentAt: result.success ? Date.now() : null,
      });

      return result;
    }),

  // ── sendEmail ─────────────────────────────────────────────────────────────
  sendEmail: protectedProcedure
    .input(
      z.object({
        recipientId: z.number().int(),
        recipientType: recipientTypeEnum,
        recipientName: z.string().optional(),
        email: z.string().email(),
        subject: z.string().min(1),
        htmlBody: z.string().min(1),
        textBody: z.string().optional(),
        campaignName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await sendEmail({
        to: input.email,
        subject: input.subject,
        htmlBody: input.htmlBody,
        textBody: input.textBody,
        campaignName: input.campaignName,
      });

      await db.insert(communicationLogs).values({
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        recipientEmail: input.email,
        recipientName: input.recipientName,
        channel: "email",
        direction: "outbound",
        subject: input.subject,
        body: input.htmlBody,
        status: result.success ? "sent" : "failed",
        provider: "twilio_email",
        providerMessageId: result.messageId,
        errorMessage: result.error,
        campaignName: input.campaignName,
        sentAt: result.success ? Date.now() : null,
      });

      return result;
    }),

  // ── sendBulkSMS ───────────────────────────────────────────────────────────
  sendBulkSMS: protectedProcedure
    .input(
      z.object({
        recipients: z.array(
          z.object({
            id: z.number().int(),
            type: recipientTypeEnum,
            phone: z.string(),
            name: z.string().optional(),
          })
        ),
        bodyTemplate: z.string().min(1).max(1600),
        campaignName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const bulkResult = await sendBulkSMS({
        recipients: input.recipients.map((r) => ({
          phone: r.phone,
          name: r.name,
        })),
        bodyTemplate: input.bodyTemplate,
        campaignName: input.campaignName,
      });

      const now = Date.now();
      for (let i = 0; i < input.recipients.length; i++) {
        const recipient = input.recipients[i];
        const smsResult = bulkResult.results[i];
        const personalizedBody = personalizeMessage(input.bodyTemplate, {
          name: recipient.name ?? "",
        });

        await db.insert(communicationLogs).values({
          recipientType: recipient.type,
          recipientId: recipient.id,
          recipientPhone: recipient.phone,
          recipientName: recipient.name,
          channel: "sms",
          direction: "outbound",
          body: personalizedBody,
          status: smsResult.success ? "sent" : "failed",
          provider: "twilio_sms",
          providerMessageId: smsResult.messageId,
          errorMessage: smsResult.error,
          campaignName: input.campaignName,
          sentAt: smsResult.success ? now : null,
        });
      }

      return bulkResult;
    }),

  // ── sendBulkEmail ─────────────────────────────────────────────────────────
  sendBulkEmail: protectedProcedure
    .input(
      z.object({
        recipients: z.array(
          z.object({
            id: z.number().int(),
            type: recipientTypeEnum,
            email: z.string().email(),
            name: z.string().optional(),
          })
        ),
        subject: z.string().min(1),
        htmlBodyTemplate: z.string().min(1),
        campaignName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const bulkResult = await sendBulkEmail({
        recipients: input.recipients.map((r) => ({
          email: r.email,
          name: r.name,
        })),
        subject: input.subject,
        htmlBodyTemplate: input.htmlBodyTemplate,
        campaignName: input.campaignName,
      });

      const now = Date.now();
      for (let i = 0; i < input.recipients.length; i++) {
        const recipient = input.recipients[i];
        const emailResult = bulkResult.results[i];

        await db.insert(communicationLogs).values({
          recipientType: recipient.type,
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          channel: "email",
          direction: "outbound",
          subject: personalizeMessage(input.subject, {
            name: recipient.name ?? "",
          }),
          body: personalizeMessage(input.htmlBodyTemplate, {
            name: recipient.name ?? "",
          }),
          status: emailResult.success ? "sent" : "failed",
          provider: "twilio_email",
          errorMessage: emailResult.error,
          campaignName: input.campaignName,
          sentAt: emailResult.success ? now : null,
        });
      }

      return bulkResult;
    }),

  // ── getHistory ────────────────────────────────────────────────────────────
  getHistory: protectedProcedure
    .input(
      z.object({
        recipientId: z.number().int().optional(),
        recipientType: recipientTypeEnum.optional(),
        channel: channelEnum.optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(200).default(50),
      })
    )
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { page, limit, recipientId, recipientType, channel } = input;
      const offset = (page - 1) * limit;

      const conditions: ReturnType<typeof eq>[] = [];
      if (recipientId !== undefined)
        conditions.push(eq(communicationLogs.recipientId, recipientId));
      if (recipientType)
        conditions.push(eq(communicationLogs.recipientType, recipientType));
      if (channel)
        conditions.push(eq(communicationLogs.channel, channel));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, countRows] = await Promise.all([
        db
          .select()
          .from(communicationLogs)
          .where(where)
          .orderBy(desc(communicationLogs.createdAt))
          .limit(limit)
          .offset(offset),

        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(communicationLogs)
          .where(where),
      ]);

      const count = countRows[0]?.count ?? 0;

      return {
        data: rows,
        total: Number(count),
        page,
        limit,
        totalPages: Math.ceil(Number(count) / limit),
      };
    }),

  // ── getStats ──────────────────────────────────────────────────────────────
  getStats: protectedProcedure
    .input(
      z.object({
        campaignName: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions: ReturnType<typeof eq>[] = [];
      if (input.campaignName) {
        conditions.push(eq(communicationLogs.campaignName, input.campaignName));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          channel: communicationLogs.channel,
          status: communicationLogs.status,
          count: sql<number>`COUNT(*)`,
          totalCostCents: sql<number>`SUM(cost_cents)`,
        })
        .from(communicationLogs)
        .where(where)
        .groupBy(communicationLogs.channel, communicationLogs.status);

      return rows;
    }),
});
