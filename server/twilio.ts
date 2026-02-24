/**
 * OUTPUT_twilio.ts
 * Golf VX Marketing Dashboard — Twilio SMS + SendGrid Email Module
 *
 * SMS  : Twilio REST API  (npm: twilio)
 * Email: Twilio SendGrid  (npm: @sendgrid/mail)
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID    — Twilio Account SID
 *   TWILIO_AUTH_TOKEN     — Twilio Auth Token
 *   TWILIO_PHONE_NUMBER   — Twilio source phone number, e.g. "+18472001234"
 *   SENDGRID_API_KEY      — SendGrid API key
 *   SENDGRID_FROM_EMAIL   — Verified sender email address
 *
 * Graceful degradation: all functions return error-safe objects when
 * credentials are missing — never throw uncaught exceptions.
 */

import Twilio from "twilio";
import sgMail from "@sendgrid/mail";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TwilioConfig {
  isConfigured: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
}

export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  costCents?: number;
}

export interface BulkSMSResult {
  sent: number;
  failed: number;
  results: Array<{
    phone: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  sent: number;
  failed: number;
  results: Array<{
    email: string;
    success: boolean;
    error?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Lazy client initialisation
// ---------------------------------------------------------------------------

let _twilioClient: ReturnType<typeof Twilio> | null = null;
let _sgInitialised = false;

function getTwilioClient(): ReturnType<typeof Twilio> | null {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!sid || !token) return null;

  if (!_twilioClient) {
    _twilioClient = Twilio(sid, token);
  }
  return _twilioClient;
}

function getSendGridClient(): boolean {
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) return false;

  if (!_sgInitialised) {
    sgMail.setApiKey(key);
    _sgInitialised = true;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 1. Configuration
// ---------------------------------------------------------------------------

/**
 * Returns a config object describing which services are available.
 */
export function isTwilioConfigured(): TwilioConfig {
  const smsEnabled = Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_PHONE_NUMBER?.trim()
  );

  const emailEnabled = Boolean(
    process.env.SENDGRID_API_KEY?.trim() &&
      process.env.SENDGRID_FROM_EMAIL?.trim()
  );

  return {
    isConfigured: smsEnabled || emailEnabled,
    smsEnabled,
    emailEnabled,
  };
}

// ---------------------------------------------------------------------------
// 2. SMS
// ---------------------------------------------------------------------------

/**
 * Sends a single SMS message via Twilio.
 *
 * @param params.to          E.164 phone number, e.g. "+18471234567"
 * @param params.body        Message text (max 1600 chars; segmented at 160)
 * @param params.campaignName Optional label for internal logging
 */
export async function sendSMS(params: {
  to: string;
  body: string;
  campaignName?: string;
}): Promise<SMSSendResult> {
  const config = isTwilioConfigured();
  if (!config.smsEnabled) {
    return {
      success: false,
      error: "Twilio SMS is not configured. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
    };
  }

  const client = getTwilioClient();
  if (!client) {
    return { success: false, error: "Failed to initialise Twilio client." };
  }

  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: params.to,
      body: params.body,
    });

    // Twilio price is returned as a negative string, e.g. "-0.0075"
    const costCents =
      message.price != null
        ? Math.round(Math.abs(parseFloat(message.price)) * 100)
        : undefined;

    return {
      success: true,
      messageId: message.sid,
      costCents,
    };
  } catch (err: any) {
    console.error("[Twilio SMS] sendSMS error:", err);
    return {
      success: false,
      error: err?.message ?? "Unknown Twilio SMS error",
    };
  }
}

/**
 * Sends personalised SMS messages to multiple recipients.
 * Uses {{name}} token replacement in the body template.
 */
export async function sendBulkSMS(params: {
  recipients: Array<{ phone: string; name?: string }>;
  bodyTemplate: string;
  campaignName?: string;
}): Promise<BulkSMSResult> {
  const result: BulkSMSResult = { sent: 0, failed: 0, results: [] };

  for (const recipient of params.recipients) {
    const body = personalizeMessage(params.bodyTemplate, {
      name: recipient.name ?? "",
    });

    const smsResult = await sendSMS({
      to: recipient.phone,
      body,
      campaignName: params.campaignName,
    });

    result.results.push({
      phone: recipient.phone,
      success: smsResult.success,
      messageId: smsResult.messageId,
      error: smsResult.error,
    });

    if (smsResult.success) {
      result.sent++;
    } else {
      result.failed++;
    }

    // Twilio rate limit: ~1 message/second on standard accounts
    await new Promise((r) => setTimeout(r, 1100));
  }

  return result;
}

// ---------------------------------------------------------------------------
// 3. Email (via SendGrid)
// ---------------------------------------------------------------------------

/**
 * Sends a single transactional / campaign email via SendGrid.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  campaignName?: string;
}): Promise<EmailSendResult> {
  const config = isTwilioConfigured();
  if (!config.emailEnabled) {
    return {
      success: false,
      error: "SendGrid email is not configured. Check SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.",
    };
  }

  const ready = getSendGridClient();
  if (!ready) {
    return { success: false, error: "Failed to initialise SendGrid client." };
  }

  try {
    const [response] = await sgMail.send({
      to: params.to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: params.subject,
      html: params.htmlBody,
      text: params.textBody ?? stripHtml(params.htmlBody),
    });

    // SendGrid returns the message ID in the x-message-id header
    const messageId =
      (response.headers as Record<string, string>)["x-message-id"] ??
      undefined;

    return { success: true, messageId };
  } catch (err: any) {
    console.error("[SendGrid] sendEmail error:", err);
    const errorMsg =
      err?.response?.body?.errors?.[0]?.message ?? err?.message ?? "Unknown SendGrid error";
    return { success: false, error: errorMsg };
  }
}

/**
 * Sends personalised emails to multiple recipients.
 * Personalises both subject and HTML body with {{name}} tokens.
 */
export async function sendBulkEmail(params: {
  recipients: Array<{ email: string; name?: string }>;
  subject: string;
  htmlBodyTemplate: string;
  campaignName?: string;
}): Promise<BulkEmailResult> {
  const result: BulkEmailResult = { sent: 0, failed: 0, results: [] };

  for (const recipient of params.recipients) {
    const tokens = { name: recipient.name ?? "" };
    const htmlBody = personalizeMessage(params.htmlBodyTemplate, tokens);
    const subject = personalizeMessage(params.subject, tokens);

    const emailResult = await sendEmail({
      to: recipient.email,
      subject,
      htmlBody,
      campaignName: params.campaignName,
    });

    result.results.push({
      email: recipient.email,
      success: emailResult.success,
      error: emailResult.error,
    });

    if (emailResult.success) {
      result.sent++;
    } else {
      result.failed++;
    }

    // Small delay to stay within SendGrid rate limits
    await new Promise((r) => setTimeout(r, 50));
  }

  return result;
}

// ---------------------------------------------------------------------------
// 4. Template helpers
// ---------------------------------------------------------------------------

/**
 * Replaces `{{key}}` tokens in a template string with values from the data map.
 *
 * @example
 * personalizeMessage("Hi {{name}}, your membership expires {{date}}.", { name: "Alice", date: "2026-12-31" })
 * // → "Hi Alice, your membership expires 2026-12-31."
 */
export function personalizeMessage(
  template: string,
  data: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

/**
 * Very lightweight HTML-to-plain-text stripper for fallback text bodies.
 * Not a full HTML parser — good enough for transactional email copy.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
