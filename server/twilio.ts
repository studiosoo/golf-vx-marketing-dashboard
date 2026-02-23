/**
 * twilio.ts
 * Golf VX Marketing Dashboard — Twilio SMS + SendGrid Email Integration
 *
 * Provides SMS sending via Twilio and email sending via SendGrid.
 * Logs every message to the communicationLogs table.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID  — Twilio Account SID
 *   TWILIO_AUTH_TOKEN   — Twilio Auth Token
 *   TWILIO_PHONE_NUMBER — Twilio phone number (E.164)
 *   SENDGRID_API_KEY    — SendGrid API key
 *   SENDGRID_FROM_EMAIL — Verified sender email
 *   SENDGRID_FROM_NAME  — Sender display name (default: "Golf VX")
 */

import { getDb } from "./db";
import { communicationLogs } from "../drizzle/schema";
import { eq, and, desc, count } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendSMSParams {
  to: string;
  body: string;
  recipientId?: number;
  recipientType?: "member" | "lead";
  recipientName?: string;
  campaignName?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  recipientId?: number;
  recipientType?: "member" | "lead";
  recipientName?: string;
  campaignName?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_PHONE_NUMBER?.trim()
  );
}

export function isSendGridConfigured(): boolean {
  return Boolean(
    process.env.SENDGRID_API_KEY?.trim() &&
    process.env.SENDGRID_FROM_EMAIL?.trim()
  );
}

// ---------------------------------------------------------------------------
// SMS via Twilio
// ---------------------------------------------------------------------------

export async function sendSMS(params: SendSMSParams): Promise<SendResult> {
  const { to, body, recipientId, recipientType, recipientName, campaignName } = params;
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  // Log the attempt
  const [logEntry] = await db.insert(communicationLogs).values({
    recipientType: recipientType ?? "lead",
    recipientId: recipientId ?? null,
    recipientPhone: to,
    recipientName: recipientName ?? null,
    channel: "sms",
    direction: "outbound",
    body,
    status: "queued",
    provider: "twilio_sms",
    campaignName: campaignName ?? null,
    sentAt: Date.now(),
  }).$returningId();

  if (!isTwilioConfigured()) {
    await db
      .update(communicationLogs)
      .set({
        status: "failed",
        errorMessage: "Twilio not configured (missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER)",
      })
      .where(eq(communicationLogs.id, logEntry.id));

    return {
      success: false,
      error: "Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
    };
  }

  try {
    const twilio = require("twilio");
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    await db
      .update(communicationLogs)
      .set({
        status: "sent",
        providerMessageId: message.sid,
        providerStatus: message.status,
      })
      .where(eq(communicationLogs.id, logEntry.id));

    return { success: true, messageId: message.sid };
  } catch (err: any) {
    await db
      .update(communicationLogs)
      .set({
        status: "failed",
        errorMessage: err?.message ?? String(err),
      })
      .where(eq(communicationLogs.id, logEntry.id));

    console.error("[Twilio] sendSMS error:", err);
    return { success: false, error: err?.message ?? "SMS sending failed" };
  }
}

// ---------------------------------------------------------------------------
// Email via SendGrid
// ---------------------------------------------------------------------------

export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  const {
    to,
    subject,
    htmlBody,
    recipientId,
    recipientType,
    recipientName,
    campaignName,
  } = params;

  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  // Log the attempt
  const [logEntry] = await db.insert(communicationLogs).values({
    recipientType: recipientType ?? "lead",
    recipientId: recipientId ?? null,
    recipientEmail: to,
    recipientName: recipientName ?? null,
    channel: "email",
    direction: "outbound",
    subject,
    body: htmlBody,
    status: "queued",
    provider: "twilio_email",
    campaignName: campaignName ?? null,
    sentAt: Date.now(),
  }).$returningId();

  if (!isSendGridConfigured()) {
    await db
      .update(communicationLogs)
      .set({
        status: "failed",
        errorMessage: "SendGrid not configured (missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL)",
      })
      .where(eq(communicationLogs.id, logEntry.id));

    return {
      success: false,
      error: "SendGrid not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.",
    };
  }

  try {
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME || "Golf VX",
      },
      subject,
      html: htmlBody,
    };

    const [response] = await sgMail.send(msg);
    const messageId = response?.headers?.["x-message-id"] ?? null;

    await db
      .update(communicationLogs)
      .set({
        status: "sent",
        providerMessageId: messageId,
        providerStatus: `${response?.statusCode}`,
      })
      .where(eq(communicationLogs.id, logEntry.id));

    return { success: true, messageId };
  } catch (err: any) {
    await db
      .update(communicationLogs)
      .set({
        status: "failed",
        errorMessage: err?.message ?? String(err),
      })
      .where(eq(communicationLogs.id, logEntry.id));

    console.error("[SendGrid] sendEmail error:", err);
    return { success: false, error: err?.message ?? "Email sending failed" };
  }
}

// ---------------------------------------------------------------------------
// Communication history helpers
// ---------------------------------------------------------------------------

export async function getCommunicationHistory(params: {
  recipientId: number;
  recipientType: "member" | "lead";
  channel?: "sms" | "email" | "push";
  page?: number;
  limit?: number;
}): Promise<{
  data: any[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { recipientId, recipientType, channel, page = 1, limit = 20 } = params;

  const db = await getDb();
  if (!db) return { data: [], total: 0, page, totalPages: 0 };

  const conditions: any[] = [
    eq(communicationLogs.recipientId, recipientId),
    eq(communicationLogs.recipientType, recipientType),
  ];

  if (channel) {
    conditions.push(eq(communicationLogs.channel, channel));
  }

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ count: count() })
    .from(communicationLogs)
    .where(where);

  const total = totalResult?.count ?? 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const data = await db
    .select()
    .from(communicationLogs)
    .where(where)
    .orderBy(desc(communicationLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return { data, total, page, totalPages };
}
