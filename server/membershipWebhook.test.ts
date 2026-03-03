/**
 * membershipWebhook.test.ts
 * Tests for the membership lifecycle event webhook handler
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

vi.mock("./db", () => ({
  logMembershipEvent: vi.fn().mockResolvedValue(42),
  getMemberIdByEmail: vi.fn().mockResolvedValue(null),
  getMemberHistory: vi.fn().mockResolvedValue([]),
  getMemberHistoryByEmail: vi.fn().mockResolvedValue([]),
  getChurnedMembers: vi.fn().mockResolvedValue([]),
  getWinbackOpportunities: vi.fn().mockResolvedValue([]),
  getMembershipEventSummary: vi.fn().mockResolvedValue([]),
  getDb: vi.fn().mockResolvedValue(null),
}));

vi.mock("./enchargeSync", () => ({
  addEnchargeTag: vi.fn().mockResolvedValue(true),
  removeEnchargeTag: vi.fn().mockResolvedValue(true),
  upsertEnchargePerson: vi.fn().mockResolvedValue(true),
}));

import { handleMembershipWebhookRoute } from "./membershipWebhook";
import * as dbModule from "./db";

function makeReq(body: Record<string, any>, secret = "golfvx_boomerang_2026"): Request {
  return { headers: { "x-webhook-secret": secret }, body } as unknown as Request;
}

function makeRes() {
  const res = {
    statusCode: 200, body: null as any,
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.body = data; return this; },
  };
  return res as unknown as Response & { statusCode: number; body: any };
}

describe("Membership Webhook Handler", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should reject requests with wrong webhook secret", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "test@example.com", eventType: "joined" }, "wrong"), res);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("should reject requests missing email", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ eventType: "joined" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("email");
  });

  it("should reject requests with invalid eventType", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "test@example.com", eventType: "bad_event" }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("Invalid eventType");
  });

  it("should accept a valid joined event", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "member@example.com", eventType: "joined", tier: "all_access_aces", plan: "monthly", amount: 149 }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.eventId).toBe(42);
  });

  it("should accept a valid cancelled event", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "member@example.com", eventType: "cancelled" }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should accept an upgraded event with previous tier", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "m@e.com", eventType: "upgraded", tier: "all_access_aces", previousTier: "swing_savers" }), res);
    expect(res.statusCode).toBe(200);
  });

  it("should normalize email to lowercase", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "MEMBER@EXAMPLE.COM", eventType: "joined" }), res);
    expect(dbModule.logMembershipEvent).toHaveBeenCalledWith(expect.objectContaining({ email: "member@example.com" }));
  });

  it("should accept snake_case event_type field", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "test@example.com", event_type: "renewed" }), res);
    expect(res.statusCode).toBe(200);
  });

  it("should accept snake_case previous_tier field", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "t@e.com", eventType: "tier_changed", tier: "golf_vx_pro", previous_tier: "swing_savers" }), res);
    expect(res.statusCode).toBe(200);
    expect(dbModule.logMembershipEvent).toHaveBeenCalledWith(expect.objectContaining({ previousTier: "swing_savers" }));
  });

  it("should parse Unix timestamp in seconds", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "t@e.com", eventType: "joined", timestamp: ts }), res);
    expect(res.statusCode).toBe(200);
    const call = (dbModule.logMembershipEvent as any).mock.calls[0][0];
    expect(call.eventTimestamp).toBeInstanceOf(Date);
  });

  it("should parse Unix timestamp in milliseconds", async () => {
    const ts = Date.now();
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "t@e.com", eventType: "joined", timestamp: ts }), res);
    expect(res.statusCode).toBe(200);
  });

  it("should build name from firstName + lastName", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "t@e.com", eventType: "joined", firstName: "Jane", lastName: "Smith" }), res);
    expect(dbModule.logMembershipEvent).toHaveBeenCalledWith(expect.objectContaining({ name: "Jane Smith" }));
  });

  it("should link memberId when member exists in DB", async () => {
    vi.mocked(dbModule.getMemberIdByEmail).mockResolvedValueOnce(99);
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "existing@example.com", eventType: "cancelled" }), res);
    expect(res.body.memberId).toBe(99);
    expect(dbModule.logMembershipEvent).toHaveBeenCalledWith(expect.objectContaining({ memberId: 99 }));
  });

  it("should return memberId null when member not in DB", async () => {
    vi.mocked(dbModule.getMemberIdByEmail).mockResolvedValueOnce(null);
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "new@example.com", eventType: "joined" }), res);
    expect(res.body.memberId).toBeNull();
  });

  it("should include event type in success message", async () => {
    const res = makeRes();
    await handleMembershipWebhookRoute(makeReq({ email: "test@example.com", eventType: "payment_failed" }), res);
    expect(res.body.message).toContain("payment_failed");
    expect(res.body.message).toContain("test@example.com");
  });
});
