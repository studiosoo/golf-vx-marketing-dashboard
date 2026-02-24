/**
 * boomerangWebhook.ts
 * Express route handler for Boomerang → Make.com → Golf VX webhook
 *
 * Endpoint: POST /api/webhooks/boomerang
 * Header:   x-webhook-secret: golfvx_boomerang_2026
 *
 * Events handled:
 *   CardIssuedEvent    → upsert contact in email_captures, tag as #member
 *   CardInstalledEvent → update card status to installed
 *   CardDeletedEvent   → update card status to deleted, tag as #churned
 */

import type { Request, Response } from "express";
import { getDb } from "./db";
import { emailCaptures } from "../drizzle/schema";
import { eq, or } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.BOOMERANG_WEBHOOK_SECRET ?? "golfvx_boomerang_2026";

const TEMPLATE_MAP: Record<number, string> = {
  340717: "Swing Savers",
  341133: "All-Access Aces",
  341134: "Pro Membership",
  343984: "Swing Savers – Fam",
  865726: "Swing Savers Trial",
  865727: "All-Access Aces Trial",
  497225: "All-Access Aces 325",
  359801: "Swing Savers – Black Friday",
  528426: "Summer Pass – 750",
  346021: "All-Access Aces – Employee",
};

function getMembershipType(templateId: number): string {
  return TEMPLATE_MAP[templateId] ?? `Unknown (Template ${templateId})`;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return digits ? `+${digits}` : "";
}

export async function handleBoomerangWebhookRoute(req: Request, res: Response) {
  // Verify webhook secret
  const secret = req.headers["x-webhook-secret"];
  if (secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = req.body;
  const { event, data, is_sandbox } = payload ?? {};

  if (!event || !data) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  // Skip sandbox events in production
  if (is_sandbox && process.env.NODE_ENV === "production") {
    return res.json({ action: "skipped_sandbox" });
  }

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const membershipType = getMembershipType(data.user_template_id);
    const phone = normalizePhone(data.cardholder_phone ?? "");
    const email = (data.cardholder_email ?? "").toLowerCase().trim();
    const firstName = (data.cardholder_first_name ?? "").trim() || null;
    const lastName = (data.cardholder_last_name ?? "").trim() || null;
    const now = new Date();

    // Determine card status
    let cardStatus: "installed" | "not_installed" | "deleted" = "not_installed";
    if (event === "CardInstalledEvent") cardStatus = "installed";
    else if (event === "CardDeletedEvent") cardStatus = "deleted";
    else if (data.status === "installed") cardStatus = "installed";

    // Build tags
    const tags: string[] = ["#boomerang"];
    if (event === "CardIssuedEvent") tags.push("#member");
    if (event === "CardDeletedEvent") tags.push("#churned");
    if (membershipType.toLowerCase().includes("trial")) tags.push("#trial");

    // Try to find existing record by email or phone
    const conditions = [];
    if (email) conditions.push(eq(emailCaptures.email, email));
    if (phone) conditions.push(eq(emailCaptures.phone, phone));

    const existing = conditions.length > 0
      ? await db.select().from(emailCaptures).where(or(...conditions)).limit(1)
      : [];

    if (existing.length > 0) {
      // Update existing record
      const existingRecord = existing[0];
      const existingTags: string[] = JSON.parse(existingRecord.tags ?? "[]");
      await db.update(emailCaptures)
        .set({
          firstName: existingRecord.firstName || firstName || undefined,
          lastName: existingRecord.lastName || lastName || undefined,
          phone: existingRecord.phone || phone || undefined,
          boomerangCardSerial: data.serial_number,
          boomerangCardStatus: cardStatus,
          boomerangTemplateId: String(data.user_template_id),
          boomerangTemplateName: membershipType,
          boomerangDevice: data.device_type || null,
          boomerangInstalledAt: cardStatus === "installed" ? now : existingRecord.boomerangInstalledAt,
          boomerangDeletedAt: cardStatus === "deleted" ? now : existingRecord.boomerangDeletedAt,
          tags: JSON.stringify(Array.from(new Set([...existingTags, ...tags]))),
          updatedAt: now,
        })
        .where(eq(emailCaptures.id, existingRecord.id));

      return res.json({ action: "updated", id: existingRecord.id, email });
    } else {
      // Insert new record
      if (!email && !phone) {
        return res.status(400).json({ error: "No email or phone in payload" });
      }

      const inserted = await db.insert(emailCaptures).values({
        email: email || `boomerang_${data.serial_number}@noemail.local`,
        phone: phone || null,
        firstName,
        lastName,
        source: "boomerang",
        boomerangCardSerial: data.serial_number,
        boomerangCardStatus: cardStatus,
        boomerangTemplateId: String(data.user_template_id),
        boomerangTemplateName: membershipType,
        boomerangDevice: data.device_type || null,
        boomerangInstalledAt: cardStatus === "installed" ? now : null,
        tags: JSON.stringify(tags),
        capturedAt: Date.now(),
        createdAt: now,
        updatedAt: now,
      });

      return res.json({ action: "created", id: (inserted as any).insertId, email });
    }
  } catch (err: any) {
    console.error("[BoomerangWebhook] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
