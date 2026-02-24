/**
 * boomerangWebhook.test.ts
 * Unit tests for the Boomerang webhook handler
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { handleBoomerangWebhookRoute } from "./boomerangWebhook";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({ insertId: 99999 }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
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

describe("Boomerang Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject requests with wrong webhook secret", async () => {
    const req = makeReq({ headers: { "x-webhook-secret": "wrong-secret" } });
    const { res, status } = makeRes();

    await handleBoomerangWebhookRoute(req, res);

    expect(status).toHaveBeenCalledWith(401);
  });

  it("should reject requests with missing payload", async () => {
    const req = makeReq({ body: {} });
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
        data: { serial_number: "TEST-001", user_template_id: 340717 },
      },
    });
    const { res, json } = makeRes();

    await handleBoomerangWebhookRoute(req, res);

    expect(json).toHaveBeenCalledWith({ action: "skipped_sandbox" });
    process.env.NODE_ENV = originalEnv;
  });

  it("should handle CardIssuedEvent and create new record", async () => {
    const req = makeReq({
      body: {
        event: "CardIssuedEvent",
        is_sandbox: false,
        data: {
          serial_number: "CARD-001",
          user_template_id: 340717,
          cardholder_email: "test@example.com",
          cardholder_first_name: "John",
          cardholder_last_name: "Doe",
          cardholder_phone: "8475551234",
          status: "not_installed",
          device_type: "iPhone",
        },
      },
    });
    const { res, json } = makeRes();

    await handleBoomerangWebhookRoute(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ action: "created", email: "test@example.com" })
    );
  });

  it("should handle CardInstalledEvent and update existing record", async () => {
    const { getDb } = await import("./db");
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 123,
              email: "existing@example.com",
              firstName: "Jane",
              lastName: "Doe",
              phone: "+18475559999",
              boomerangInstalledAt: null,
              boomerangDeletedAt: null,
              tags: '["#boomerang"]',
            }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const req = makeReq({
      body: {
        event: "CardInstalledEvent",
        is_sandbox: false,
        data: {
          serial_number: "CARD-001",
          user_template_id: 340717,
          cardholder_email: "existing@example.com",
          status: "installed",
          device_type: "Android",
        },
      },
    });
    const { res, json } = makeRes();

    await handleBoomerangWebhookRoute(req, res);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ action: "updated", id: 123 })
    );
  });

  it("should correctly map template IDs to membership names", async () => {
    // Reset mock to return empty (no existing record)
    const { getDb } = await import("./db");
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({ insertId: 88888 }),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const req = makeReq({
      body: {
        event: "CardIssuedEvent",
        is_sandbox: false,
        data: {
          serial_number: "CARD-002",
          user_template_id: 341133, // All-Access Aces
          cardholder_email: "aces@example.com",
          cardholder_first_name: "Ace",
          cardholder_last_name: "Player",
          status: "not_installed",
        },
      },
    });
    const { res, json } = makeRes();

    await handleBoomerangWebhookRoute(req, res);

    // Should create with All-Access Aces template name
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ action: "created", email: "aces@example.com" })
    );
  });
});
