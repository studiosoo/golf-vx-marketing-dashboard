/**
 * membershipWebhook.ts
 * Express route handler for Boomerang membership lifecycle events
 *
 * Endpoint: POST /api/webhooks/boomerang-membership
 * Header:   x-webhook-secret: golfvx_boomerang_2026
 *
 * MAKE.COM SETUP:
 *   URL: https://golfvx-dash-a5gjfitc.manus.space/api/webhooks/boomerang-membership
 *   Method: POST
 *   Headers: x-webhook-secret: golfvx_boomerang_2026
 *   Content-Type: application/json
 *
 * PAYLOAD FIELDS:
 *   Required: email, eventType
 *   Optional: name, firstName, lastName, tier, plan, amount,
 *             previousTier, previousPlan, previousAmount, timestamp, notes
 *
 * EVENT TYPES: joined | cancelled | upgraded | downgraded | paused | resumed
 *              | tier_changed | payment_failed | payment_recovered | renewed
 *
 * TIER VALUES: all_access_aces | swing_savers | golf_vx_pro | trial | none
 */

import type { Request, Response } from "express";
import {
  logMembershipEvent,
  getMemberIdByEmail,
  getDb,
} from "./db";
import { addEnchargeTag, removeEnchargeTag, upsertEnchargePerson } from "./enchargeSync";
import { eq } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.BOOMERANG_WEBHOOK_SECRET ?? "golfvx_boomerang_2026";

// ─── Tier → Encharge tag mapping ────────────────────────────────────────────
const TIER_TAGS: Record<string, string> = {
  all_access_aces: "All-Access Ace",
  swing_savers: "Swing Saver",
  golf_vx_pro: "Pro Member",
  trial: "Trial Member",
};

const ALL_TIER_TAGS = Object.values(TIER_TAGS);

const PLAN_TAG_SUFFIX: Record<string, string> = {
  monthly: "Monthly",
  annual: "Annual",
};

function buildTierPlanTag(tier: string, plan?: string): string {
  const base = TIER_TAGS[tier] ?? tier;
  if (!plan || !PLAN_TAG_SUFFIX[plan]) return base;
  return `${base} ${PLAN_TAG_SUFFIX[plan]}`;
}

// ─── Encharge sync logic ─────────────────────────────────────────────────────

async function syncEnchargeTags(
  email: string,
  name: string,
  eventType: string,
  tier?: string | null,
  plan?: string | null,
  previousTier?: string | null,
  previousPlan?: string | null
): Promise<boolean> {
  try {
    const [firstName, ...rest] = (name ?? "").trim().split(" ");
    const lastName = rest.join(" ");
    await upsertEnchargePerson({
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      membershipPlan: tier ?? "none",
      membershipStatus: ["joined", "resumed", "renewed"].includes(eventType) ? "active" : "inactive",
    });

    if (["joined", "resumed", "renewed"].includes(eventType)) {
      for (const tag of ALL_TIER_TAGS) {
        await removeEnchargeTag(email, tag);
        await removeEnchargeTag(email, `${tag} Monthly`);
        await removeEnchargeTag(email, `${tag} Annual`);
      }
      await removeEnchargeTag(email, "Churned Member");
      await removeEnchargeTag(email, "Paused Member");

      if (tier && TIER_TAGS[tier]) {
        await addEnchargeTag(email, TIER_TAGS[tier]);
        if (plan) await addEnchargeTag(email, buildTierPlanTag(tier, plan));
      }
      await addEnchargeTag(email, "Active Member");

    } else if (["cancelled", "paused"].includes(eventType)) {
      for (const tag of ALL_TIER_TAGS) {
        await removeEnchargeTag(email, tag);
        await removeEnchargeTag(email, `${tag} Monthly`);
        await removeEnchargeTag(email, `${tag} Annual`);
      }
      await removeEnchargeTag(email, "Active Member");

      const churnTag = eventType === "cancelled" ? "Churned Member" : "Paused Member";
      await addEnchargeTag(email, churnTag);
      if (tier && TIER_TAGS[tier]) {
        await addEnchargeTag(email, `Former ${TIER_TAGS[tier]}`);
      }

    } else if (["upgraded", "downgraded", "tier_changed"].includes(eventType)) {
      if (previousTier && TIER_TAGS[previousTier]) {
        await removeEnchargeTag(email, TIER_TAGS[previousTier]);
        await removeEnchargeTag(email, `${TIER_TAGS[previousTier]} Monthly`);
        await removeEnchargeTag(email, `${TIER_TAGS[previousTier]} Annual`);
      }
      if (tier && TIER_TAGS[tier]) {
        await addEnchargeTag(email, TIER_TAGS[tier]);
        if (plan) await addEnchargeTag(email, buildTierPlanTag(tier, plan));
      }
      await addEnchargeTag(email, eventType === "upgraded" ? "Recently Upgraded" : "Recently Downgraded");

    } else if (eventType === "payment_failed") {
      await addEnchargeTag(email, "Payment Failed");
    } else if (eventType === "payment_recovered") {
      await removeEnchargeTag(email, "Payment Failed");
      await addEnchargeTag(email, "Payment Recovered");
    }

    return true;
  } catch (err) {
    console.error("[MembershipWebhook] Encharge sync error:", err);
    return false;
  }
}

// ─── Update member record in DB ──────────────────────────────────────────────

async function updateMemberRecord(
  memberId: number,
  eventType: string,
  tier?: string | null,
  plan?: string | null,
  amount?: number | null
): Promise<void> {
  const db = await getDb();
  if (!db || !memberId) return;

  const updates: Record<string, any> = { updatedAt: new Date() };

  if (tier) updates.membershipTier = tier;
  if (plan) updates.paymentInterval = plan;
  if (amount != null) updates.monthlyAmount = String(amount);

  if (["joined", "resumed", "renewed"].includes(eventType)) {
    updates.status = "active";
    updates.customerStatus = "active";
    updates.cancellationDate = null;
    if (eventType === "joined") updates.joinDate = new Date();
  } else if (eventType === "cancelled") {
    updates.status = "cancelled";
    updates.cancellationDate = new Date();
  } else if (eventType === "paused") {
    updates.status = "inactive";
  }

  const { members } = await import("../drizzle/schema");
  await db.update(members).set(updates).where(eq(members.id, memberId));
}

// ─── Main webhook handler ────────────────────────────────────────────────────

export async function handleMembershipWebhookRoute(req: Request, res: Response): Promise<void> {
  // 1. Validate secret
  const secret = req.headers["x-webhook-secret"] as string;
  if (secret !== WEBHOOK_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as Record<string, any>;

  // 2. Validate required fields
  const email = (body.email ?? "").toString().toLowerCase().trim();
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const rawEventType = (body.eventType ?? body.event_type ?? "").toString().toLowerCase();
  const validEventTypes = [
    "joined", "cancelled", "upgraded", "downgraded",
    "paused", "resumed", "tier_changed",
    "payment_failed", "payment_recovered", "renewed",
  ];
  if (!validEventTypes.includes(rawEventType)) {
    res.status(400).json({ error: `Invalid eventType: ${rawEventType}. Must be one of: ${validEventTypes.join(", ")}` });
    return;
  }

  const eventType = rawEventType as "joined" | "cancelled" | "upgraded" | "downgraded" | "paused" | "resumed" | "tier_changed" | "payment_failed" | "payment_recovered" | "renewed";

  // 3. Parse optional fields
  const firstName = (body.firstName ?? "").toString().trim();
  const lastName = (body.lastName ?? "").toString().trim();
  const fullName = (body.name ?? (firstName ? `${firstName} ${lastName}`.trim() : null)) as string | null;

  const tier = (body.tier ?? null) as "all_access_aces" | "swing_savers" | "golf_vx_pro" | "trial" | "none" | null;
  const plan = (body.plan ?? null) as "monthly" | "annual" | null;
  const amount = body.amount != null ? Number(body.amount) : null;

  const previousTier = (body.previousTier ?? body.previous_tier ?? null) as "all_access_aces" | "swing_savers" | "golf_vx_pro" | "trial" | "none" | null;
  const previousPlan = (body.previousPlan ?? body.previous_plan ?? null) as "monthly" | "annual" | null;
  const previousAmount = body.previousAmount != null ? Number(body.previousAmount) : null;

  // Parse timestamp
  let eventTimestamp: Date;
  if (body.timestamp) {
    const ts = Number(body.timestamp);
    if (!isNaN(ts)) {
      eventTimestamp = new Date(ts > 1e10 ? ts : ts * 1000);
    } else {
      eventTimestamp = new Date(body.timestamp);
    }
  } else {
    eventTimestamp = new Date();
  }

  const notes = (body.notes ?? null) as string | null;

  // 4. Resolve memberId from email
  const memberId = await getMemberIdByEmail(email);

  // 5. Log the event
  const eventId = await logMembershipEvent({
    email,
    memberId: memberId ?? undefined,
    name: fullName ?? undefined,
    eventType,
    tier: tier ?? undefined,
    plan: plan ?? undefined,
    amount: amount != null ? String(amount) : undefined,
    previousTier: previousTier ?? undefined,
    previousPlan: previousPlan ?? undefined,
    previousAmount: previousAmount != null ? String(previousAmount) : undefined,
    eventTimestamp,
    source: "make_com",
    webhookPayload: body,
    enchargeTagged: false,
    notes: notes ?? undefined,
  });

  // 6. Sync Encharge tags
  let enchargeTagged = false;
  try {
    enchargeTagged = await syncEnchargeTags(
      email,
      fullName ?? email,
      eventType,
      tier,
      plan,
      previousTier,
      previousPlan
    );

    if (enchargeTagged && eventId) {
      const db = await getDb();
      if (db) {
        const { membershipEvents } = await import("../drizzle/schema");
        await db
          .update(membershipEvents)
          .set({ enchargeTagged: true, enchargeTaggedAt: new Date() })
          .where(eq(membershipEvents.id, eventId));
      }
    }
  } catch (err) {
    console.error("[MembershipWebhook] Encharge sync failed:", err);
  }

  // 7. Update member record in DB
  if (memberId) {
    await updateMemberRecord(memberId, eventType, tier, plan, amount);
  }

  // 8. Respond
  res.status(200).json({
    success: true,
    eventId,
    memberId,
    enchargeTagged,
    message: `Membership event '${eventType}' logged for ${email}`,
  });
}
