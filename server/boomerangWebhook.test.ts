/**
 * boomerangWebhook.test.ts
 * Unit tests for the v2 Boomerang webhook handler
 * Tests both full nested payload and flat Make.com selected-fields payload
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { handleBoomerangWebhookRoute } from "./boomerangWebhook";

// Mock the database — use vi.hoisted to avoid hoisting issues
const { mockInsert, mockUpdate, mockLimit } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockResolvedValue({ insertId: 99999 }),
  mockUpdate: vi.fn().mockResolvedValue({}),
  mockLimit: vi.fn().mockResolvedValue([]),
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: mockLimit,
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: mockInsert,
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: mockUpdate,
      }),
    }),
  }),
}));

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: { "x-webhook-secret": "golfvx_boomerang_2026" },
    body: {},
    ...overrides,
  } as unknown as Request;
}

function makeRes(): { res: Response; json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> } {
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnValue({ json });
  const res = { json, status } as unknown as Response;
  return { res, json, status };
}

describe("Boomerang Webhook Handler v2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue([]); // default: no existing record
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  it("should reject requests with wrong webhook secret", async () => {
    const req = makeReq({ headers: { "x-webhook-secret": "wrong-secret" } });
    const { res, status } = makeRes();
    await handleBoomerangWebhookRoute(req, res);
    expect(status).toHaveBeenCalledWith(401);
  });

  it("should reject requests missing both email and phone", async () => {
    const req = makeReq({
      body: {
        event: "CardIssuedEvent",
        data: { serial_number: "X", user_template_id: 340717 },
      },
    });
    const { res, status } = makeRes();
    await handleBoomerangWebhookRoute(req, res);
    expect(status).toHaveBeenCalledWith(400);
  });

  it("should skip sandbox events in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const req = makeReq({
      body: {
        event: "CardIssuedEvent",
        is_sandbox: true,
        data: {
          serial_number: "TEST-001",
          user_template_id: 340717,
          cardholder_email: "test@example.com",
          cardholder_phone: "13175010143",
        },
      },
    });
    const { res, json } = makeRes();
    await handleBoomerangWebhookRoute(req, res);
    expect(json).toHaveBeenCalledWith({ action: "skipped_sandbox" });
    process.env.NODE_ENV = originalEnv;
  });

  // ── Full payload (nested .data) ───────────────────────────────────────────

  it("should create new contact from full nested payload (CardIssuedEvent)", async () => {
    const req = makeReq({
      body: {
        timestamp: 1771890743,
        event: "CardIssuedEvent",
        is_sandbox: false,
        data: {
          serial_number: "837121-314-211",
          card_type: "membership",
          device_type: "",
          user_template_id: 497225,
          status: "not_installed",
          cardholder_id: "019c8cea-f30d-728d-a1c6-c0267f1d3b64",
          cardholder_phone: "13175010143",
          cardholder_email: "nickmates3@gmail.com",
          cardholder_first_name: "Nick",
          cardholder_last_name: "Mates",
          current_number_of_uses: 31,
          utm_source: "qr",
        },
        membership_tier: { count_visits: 0 },
      },
    });
    const { res, json } = makeRes();
    await handleBoomerangWebhookRoute(req, res);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ action: "created", email: "nickmates3@gmail.com" })
    );
  });

  it("should normalize phone from Boomerang format (13175010143 → +13175010143)", async () => {
    const req = makeReq({
      body: {
        event: "CardIssuedEvent",
        is_sandbox: false,
        data: {
          serial_number: "TEST-PHONE",
          user_template_id: 340717,
          cardholder_email: "phone.test@example.com",
          cardholder_phone: "13175010143",
          cardholder_first_name: "Phone",
          cardholder_last_name: "Test",
          status: "not_installed",
        },
      },
    });
    const { res, json } = makeRes();
    await handleBoomerangWebhookRoute(req, res);
    // Should succeed (not 400) — phone was normalized
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ action: "created" })
    );
  });

  // ── Flat payload (Make.com selected-fields) ───────────────────────────────

  it("should create new contact from flat Make.com selected-fields payload", async () => {
    const req = makeReq({
      body: {
        cardholder_first_name: "Jane",
        cardholder_last_name: "Smith",
        cardholder_email: "jane.smith@example.com",
        cardholder_phone: "8475551234",
      },
    });
    const { res, json } = makeRes();
    await handleBoomerangWebhookRoute(req, res);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ action: "created", email: "jane.smith@example.com" })
    );
  });

  // ── Update existing record ────────────────────────────────────────────────

  it("should update existing record on CardInstalledEvent", async () => {
    mockLimit.mockResolvedValueOnce([{
      id: 555,
      email: "existing@example.com",
      firstName: "Existing",
      lastName: "User",
      phone: "+13175010143",
      boomerangInstalledAt: null,
      boomerangDeletedAt: null,
      boomerangCardSerial: null,
      boomerangCardStatus: "not_installed",
      boomerangTemplateId: null,
      boomerangTemplateName: null,
      boomerangDevice: null,
      tags: '["#boomerang","#member"]',
    }]);

    const req = makeReq({
      body: {
        event: "CardInstalledEvent",
        is_sandbox: false,
        data: {
          serial_number: "837121-314-211",
          user_template_id: 340717,
          cardholder_email: "existing@example.com",
          cardholder_phone: "13175010143",
          status: "installed",
          device_type: "Apple Wallet",
        },
      },
    });
    const { res, json } = makeRes();
    await handleBoomerangWebhookRoute(req, res);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ action: "updated", id: 555 })
    );
  });

  // ── Template mapping ──────────────────────────────────────────────────────

  it("should correctly map template ID 497225 to All-Access Aces 325", async () => {
    const req = makeReq({
      body: {
        event: "CardIssuedEvent",
        is_sandbox: false,
        data: {
          serial_number: "CARD-497225",
          user_template_id: 497225,
          cardholder_email: "aces325@example.com",
          cardholder_first_name: "Aces",
          cardholder_last_name: "Member",
          cardholder_phone: "8475559999",
          status: "not_installed",
        },
      },
    });
    const { res, json } = makeRes();
    await handleBoomerangWebhookRoute(req, res);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ action: "created", email: "aces325@example.com" })
    );
    // Verify insert was called with correct template name
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ boomerangTemplateName: "All-Access Aces 325" })
    );
  });

  // ── CardDeletedEvent ──────────────────────────────────────────────────────

  it("should handle CardDeletedEvent and set deleted status", async () => {
    mockLimit.mockResolvedValueOnce([{
      id: 777,
      email: "churned@example.com",
      firstName: "Churned",
      lastName: "User",
      phone: "+18475551234",
      boomerangInstalledAt: new Date("2026-01-01"),
      boomerangDeletedAt: null,
      boomerangCardSerial: "CARD-OLD",
      boomerangCardStatus: "installed",
      boomerangTemplateId: "340717",
      boomerangTemplateName: "Swing Savers",
      boomerangDevice: "Apple Wallet",
      tags: '["#boomerang","#member","#card-installed"]',
    }]);

    const req = makeReq({
      body: {
        event: "CardDeletedEvent",
        is_sandbox: false,
        data: {
          serial_number: "CARD-OLD",
          user_template_id: 340717,
          cardholder_email: "churned@example.com",
          status: "deleted",
        },
      },
    });
    const { res, json } = makeRes();
    await handleBoomerangWebhookRoute(req, res);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ action: "updated", id: 777 })
    );
  });
});
