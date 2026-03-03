/**
 * Stripe Webhook Handler for Golf VX
 *
 * Handles subscription and payment events from Stripe.
 * Stripe sends events for:
 *   - customer.subscription.created / updated / deleted
 *   - invoice.payment_succeeded / invoice.payment_failed
 *   - payment_intent.succeeded / payment_intent.payment_failed
 *
 * Pro Member billing flow:
 *   1. Stripe charges $500/mo base fee per Pro Member (golf_vx_pro tier)
 *   2. On invoice.payment_succeeded → update pro_member_billing.stripeStatus = "paid"
 *   3. On invoice.payment_failed    → update pro_member_billing.stripeStatus = "failed"
 *
 * Setup:
 *   - Set STRIPE_SECRET_KEY in environment
 *   - Set STRIPE_WEBHOOK_SECRET in environment (from Stripe Dashboard → Webhooks)
 *   - Register endpoint: POST /api/webhooks/stripe
 *   - Add stripeCustomerId to each Pro Member record via Members page
 */

import type { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { proMemberBilling, members } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ─── Stripe client (lazy init so missing key doesn't crash on startup) ────────
let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[StripeWebhook] STRIPE_SECRET_KEY not set — Stripe features disabled");
    return null;
  }
  _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  return _stripe;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBillingMonthFromTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function findMemberByStripeCustomerId(
  db: Awaited<ReturnType<typeof getDb>>,
  customerId: string
) {
  if (!db) return null;
  const rows = await db
    .select({
      id: members.id,
      name: members.name,
      email: members.email,
      membershipTier: members.membershipTier,
    })
    .from(members)
    .where(eq(members.stripeCustomerId, customerId))
    .limit(1);
  return rows[0] ?? null;
}

async function upsertProBillingRecord(
  db: Awaited<ReturnType<typeof getDb>>,
  memberId: number,
  billingMonth: string,
  update: Partial<{
    stripePaymentIntentId: string;
    stripeStatus: "pending" | "paid" | "failed" | "refunded" | "waived";
    netBill: string;
    notes: string;
  }>
) {
  if (!db) return;
  const existing = await db
    .select({ id: proMemberBilling.id })
    .from(proMemberBilling)
    .where(
      and(
        eq(proMemberBilling.memberId, memberId),
        eq(proMemberBilling.billingMonth, billingMonth)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(proMemberBilling)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(proMemberBilling.id, existing[0].id));
  } else {
    await db.insert(proMemberBilling).values({
      memberId,
      billingMonth,
      baseFee: "500.00",
      sessionCount: 0,
      bayCreditTotal: "0.00",
      overageHrs: "0.00",
      overageAmount: "0.00",
      netBill: update.netBill ?? "500.00",
      stripePaymentIntentId: update.stripePaymentIntentId ?? null,
      stripeStatus: update.stripeStatus ?? "pending",
      notes: update.notes ?? null,
    });
  }
}

// ─── Event handlers ───────────────────────────────────────────────────────────
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const db = await getDb();
  if (!db) return;

  // customer is string ID or Customer object
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : (invoice.customer as Stripe.Customer | null)?.id;
  if (!customerId) return;

  const member = await findMemberByStripeCustomerId(db, customerId);
  if (!member || member.membershipTier !== "golf_vx_pro") {
    console.log(
      `[StripeWebhook] invoice.payment_succeeded: no Golf VX Pro Member found for customer ${customerId}`
    );
    return;
  }

  const billingMonth = getBillingMonthFromTimestamp(invoice.created);
  const amountPaid = (invoice.amount_paid / 100).toFixed(2);
  // Use invoice.id as the billing reference (charge/PI not directly on Invoice in v20)
  const billingRef = invoice.id;

  await upsertProBillingRecord(db, member.id, billingMonth, {
    stripePaymentIntentId: billingRef,
    stripeStatus: "paid",
    netBill: amountPaid,
    notes: `Stripe invoice ${invoice.id} paid $${amountPaid}`,
  });

  console.log(
    `[StripeWebhook] Pro Member ${member.name} (${member.email}) — ${billingMonth} invoice paid $${amountPaid}`
  );
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const db = await getDb();
  if (!db) return;

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : (invoice.customer as Stripe.Customer | null)?.id;
  if (!customerId) return;

  const member = await findMemberByStripeCustomerId(db, customerId);
  if (!member || member.membershipTier !== "golf_vx_pro") return;

  const billingMonth = getBillingMonthFromTimestamp(invoice.created);

  await upsertProBillingRecord(db, member.id, billingMonth, {
    stripePaymentIntentId: invoice.id,
    stripeStatus: "failed",
    notes: `Stripe invoice ${invoice.id} payment failed`,
  });

  console.log(
    `[StripeWebhook] Pro Member ${member.name} (${member.email}) — ${billingMonth} invoice FAILED`
  );
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : (subscription.customer as Stripe.Customer | null)?.id;
  if (!customerId) return;

  const db = await getDb();
  if (!db) return;

  const member = await findMemberByStripeCustomerId(db, customerId);
  if (!member) return;

  const status = subscription.status;
  console.log(
    `[StripeWebhook] Subscription ${subscription.id} for ${member.email} → status: ${status}`
  );

  if (status === "canceled") {
    console.warn(`[StripeWebhook] Pro Member ${member.email} subscription CANCELED`);
    // Future: update member status to inactive
  }
}

// ─── Main webhook route handler ───────────────────────────────────────────────
export async function handleStripeWebhookRoute(req: Request, res: Response) {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: "Stripe not configured — set STRIPE_SECRET_KEY" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      // Verify signature using raw body (requires express.raw() on this route)
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        webhookSecret
      );
    } else {
      // Development / no-secret mode: accept unsigned events
      console.warn(
        "[StripeWebhook] No webhook secret — skipping signature verification (dev mode)"
      );
      const raw = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
      event = JSON.parse(raw) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("[StripeWebhook] Signature verification failed:", err.message);
    return res
      .status(400)
      .json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log(`[StripeWebhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.created":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      case "payment_intent.succeeded":
        console.log(
          `[StripeWebhook] PaymentIntent succeeded: ${(event.data.object as Stripe.PaymentIntent).id}`
        );
        break;
      default:
        console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
    }
    res.json({ received: true, type: event.type });
  } catch (err: any) {
    console.error(`[StripeWebhook] Error handling ${event.type}:`, err.message);
    res.status(500).json({ error: err.message });
  }
}
