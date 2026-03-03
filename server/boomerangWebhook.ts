/**
 * boomerangWebhook.ts
 * Express route handler for Boomerang → Make.com → Golf VX webhook
 *
 * Endpoint: POST /api/webhooks/boomerang
 * Header:   x-webhook-secret: golfvx_boomerang_2026
 *
 * CONFIRMED payload structure (from Make.com Operation 1 screenshot):
 * {
 *   "timestamp": 1771890743,
 *   "event": "CardIssuedEvent",
 *   "data": {
 *     "serial_number": "837121-314-211",
 *     "user_template_id": 497225,
 *     "cardholder_phone": "13175010143",   ← no + prefix, includes country code
 *     "cardholder_email": "user@example.com",
 *     "cardholder_first_name": "Nick",
 *     "cardholder_last_name": "Mates",
 *     "status": "not_installed",
 *     "device_type": "",
 *     "utm_source": "qr"
 *   },
 *   "is_sandbox": false
 * }
 *
 * Also handles FLAT payload (Make.com selected-fields mode):
 * {
 *   "cardholder_first_name": "Nick",
 *   "cardholder_phone": "13175010143",
 *   "cardholder_email": "user@example.com",
 *   "cardholder_last_name": "Mates"
 * }
 *
 * MAKE.COM SETUP:
 *   Scenario: "AHTIL Boomerang Me – Encharge"
 *   Add HTTP module AFTER the Encharge "Add Tags" step:
 *     URL: https://ah.playgolfvx.com/api/webhooks/boomerang
 *     Method: POST
 *     Headers: x-webhook-secret: golfvx_boomerang_2026
 *     Body: pass full Boomerang event (see BOOMERANG_WEBHOOK_GUIDE.md)
 *
 * TEMPLATE ID → MEMBERSHIP TYPE:
 *   340717 → Swing Savers
 *   341133 → All-Access Aces
 *   341134 → Pro Membership
 *   343984 → Swing Savers – Fam
 *   865726 → Swing Savers Trial
 *   865727 → All-Access Aces Trial
 *   497225 → All-Access Aces 325  ← confirmed from Make.com screenshot
 *   359801 → Swing Savers – Black Friday
 *   528426 → Summer Pass – 750
 *   346021 → All-Access Aces – Employee
 */

import type { Request, Response } from "express";
import { getDb } from "./db";
import { emailCaptures } from "../drizzle/schema";
import { eq, or } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.BOOMERANG_WEBHOOK_SECRET ?? "golfvx_boomerang_2026";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoomerangFullPayload {
  timestamp?: number;
  event: "CardIssuedEvent" | "CardDeletedEvent" | "CardInstalledEvent" | "CardUninstalledEvent";
  data: {
    serial_number?: string;
    card_type?: string;
    device_type?: string;
    user_template_id?: number;
    short_link?: string;
    status?: "installed" | "not_installed" | "deleted";
    cardholder_id?: string;
    cardholder_phone?: string;
    cardholder_email?: string;
    cardholder_first_name?: string;
    cardholder_last_name?: string;
    cardholder_birth_date?: string;
    current_number_of_uses?: number;
    utm_source?: string;
  };
  membership_tier?: {
    count_visits?: number;
  };
  is_sandbox?: boolean;
}

interface BoomerangFlatPayload {
  cardholder_first_name?: string;
  cardholder_last_name?: string;
  cardholder_email?: string;
  cardholder_phone?: string;
  serial_number?: string;
  event?: string;
  user_template_id?: number;
  device_type?: string;
  status?: string;
  utm_source?: string;
}

type IncomingPayload = BoomerangFullPayload | BoomerangFlatPayload;

// ─── Template map ─────────────────────────────────────────────────────────────

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

// ─── Payload normalizer ───────────────────────────────────────────────────────

function normalizePayload(raw: IncomingPayload): {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  serialNumber: string;
  event: string;
  templateId: number;
  deviceType: string;
  status: string;
  utmSource: string;
  isSandbox: boolean;
} {
  // Case A: Full Boomerang payload (has .data nested object with cardholder_email)
  if ("data" in raw && raw.data && typeof raw.data === "object" && "cardholder_email" in raw.data) {
    const full = raw as BoomerangFullPayload;
    return {
      email:        (full.data.cardholder_email ?? "").toLowerCase().trim(),
      firstName:    (full.data.cardholder_first_name ?? "").trim(),
      lastName:     (full.data.cardholder_last_name ?? "").trim(),
      phone:        full.data.cardholder_phone ?? "",
      serialNumber: full.data.serial_number ?? "",
      event:        full.event ?? "CardIssuedEvent",
      templateId:   full.data.user_template_id ?? 0,
      deviceType:   full.data.device_type ?? "",
      status:       full.data.status ?? "not_installed",
      utmSource:    full.data.utm_source ?? "",
      isSandbox:    full.is_sandbox ?? false,
    };
  }

  // Case B: Flat payload — Make.com selected-fields only
  const flat = raw as BoomerangFlatPayload;
  return {
    email:        (flat.cardholder_email ?? "").toLowerCase().trim(),
    firstName:    (flat.cardholder_first_name ?? "").trim(),
    lastName:     (flat.cardholder_last_name ?? "").trim(),
    phone:        flat.cardholder_phone ?? "",
    serialNumber: flat.serial_number ?? "",
    event:        flat.event ?? "CardIssuedEvent",
    templateId:   flat.user_template_id ?? 0,
    deviceType:   flat.device_type ?? "",
    status:       flat.status ?? "not_installed",
    utmSource:    flat.utm_source ?? "",
    isSandbox:    false,
  };
}

// ─── Phone normalizer ─────────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  // Boomerang sends "13175010143" (11 digits, starts with 1, no + prefix)
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return digits ? `+${digits}` : "";
}

// ─── Tag builder ──────────────────────────────────────────────────────────────

function buildTags(
  event: string,
  info: { status: string; deviceType: string; utmSource: string; membershipType: string; templateId: number }
): string[] {
  const { status, deviceType, utmSource, membershipType } = info;
  const tags: string[] = ["#boomerang", "#member"];

  const typeSlug = membershipType.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (!typeSlug.includes("unknown")) tags.push(`#membership-${typeSlug}`);

  if (status === "installed")     tags.push("#card-installed");
  if (status === "not_installed") tags.push("#card-not-installed");
  if (status === "deleted")       tags.push("#card-deleted", "#churned");

  if (deviceType?.toLowerCase().includes("apple"))  tags.push("#apple-wallet");
  if (deviceType?.toLowerCase().includes("google")) tags.push("#google-pay");
  if (deviceType?.toLowerCase() === "pwa")          tags.push("#pwa-card");

  if (utmSource) tags.push(`#utm-${utmSource}`);
  if (membershipType.toLowerCase().includes("trial")) tags.push("#trial");

  return tags;
}

// ─── Express route handler ────────────────────────────────────────────────────

export async function handleBoomerangWebhookRoute(req: Request, res: Response) {
  // 1. Auth check
  const secret = req.headers["x-webhook-secret"];
  if (secret !== WEBHOOK_SECRET) {
    console.warn("[BoomerangWebhook] Unauthorized — secret mismatch");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Parse & normalize payload (handles both full and flat formats)
  const raw: IncomingPayload = req.body ?? {};
  const contact = normalizePayload(raw);

  console.log(`[BoomerangWebhook] event="${contact.event}" email="${contact.email}" name="${contact.firstName} ${contact.lastName}"`);

  // 3. Validate minimum required fields
  if (!contact.email && !contact.phone) {
    return res.status(400).json({ error: "Missing required fields: cardholder_email or cardholder_phone" });
  }

  // 4. Skip sandbox events in production
  if (contact.isSandbox && process.env.NODE_ENV === "production") {
    return res.json({ action: "skipped_sandbox" });
  }

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const membershipType = getMembershipType(contact.templateId);
    const normalizedPhone = contact.phone ? normalizePhone(contact.phone) : null;
    const now = new Date();
    const tags = buildTags(contact.event, {
      status: contact.status,
      deviceType: contact.deviceType,
      utmSource: contact.utmSource,
      membershipType,
      templateId: contact.templateId,
    });

    // Determine card status
    let cardStatus: "installed" | "not_installed" | "deleted" = "not_installed";
    if (contact.event === "CardInstalledEvent" || contact.status === "installed") cardStatus = "installed";
    else if (contact.event === "CardDeletedEvent" || contact.status === "deleted") cardStatus = "deleted";

    // Find existing record by email or phone
    const conditions = [];
    if (contact.email) conditions.push(eq(emailCaptures.email, contact.email));
    if (normalizedPhone) conditions.push(eq(emailCaptures.phone, normalizedPhone));

    const existing = conditions.length > 0
      ? await db.select().from(emailCaptures).where(or(...conditions)).limit(1)
      : [];

    if (existing.length > 0) {
      // Update existing record
      const rec = existing[0];
      const existingTags: string[] = JSON.parse(rec.tags ?? "[]");
      const mergedTags = Array.from(new Set([...existingTags, ...tags]));

      await db.update(emailCaptures)
        .set({
          firstName:            rec.firstName || contact.firstName || undefined,
          lastName:             rec.lastName  || contact.lastName  || undefined,
          phone:                rec.phone     || normalizedPhone   || undefined,
          boomerangCardSerial:  contact.serialNumber || rec.boomerangCardSerial || undefined,
          boomerangCardStatus:  cardStatus,
          boomerangTemplateId:  contact.templateId ? String(contact.templateId) : rec.boomerangTemplateId || undefined,
          boomerangTemplateName: membershipType.startsWith("Unknown") ? rec.boomerangTemplateName || undefined : membershipType,
          boomerangDevice:      contact.deviceType || rec.boomerangDevice || undefined,
          boomerangInstalledAt: cardStatus === "installed" ? now : rec.boomerangInstalledAt,
          boomerangDeletedAt:   cardStatus === "deleted"   ? now : rec.boomerangDeletedAt,
          tags:                 JSON.stringify(mergedTags),
          updatedAt:            now,
        })
        .where(eq(emailCaptures.id, rec.id));

      return res.json({ action: "updated", id: rec.id, email: contact.email });
    } else {
      // Insert new record
      const inserted = await db.insert(emailCaptures).values({
        email:                contact.email || `boomerang_${contact.serialNumber}@noemail.local`,
        phone:                normalizedPhone || null,
        firstName:            contact.firstName || null,
        lastName:             contact.lastName  || null,
        source:               "boomerang",
        sourceDetail:         `webhook-${contact.event}`,
        boomerangCardSerial:  contact.serialNumber || null,
        boomerangCardStatus:  cardStatus,
        boomerangTemplateId:  contact.templateId ? String(contact.templateId) : null,
        boomerangTemplateName: membershipType.startsWith("Unknown") ? null : membershipType,
        boomerangDevice:      contact.deviceType || null,
        boomerangInstalledAt: cardStatus === "installed" ? now : null,
        tags:                 JSON.stringify(tags),
        capturedAt:           Date.now(),
        createdAt:            now,
        updatedAt:            now,
      });

      return res.json({ action: "created", id: (inserted as any).insertId, email: contact.email });
    }
  } catch (err: any) {
    console.error("[BoomerangWebhook] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
