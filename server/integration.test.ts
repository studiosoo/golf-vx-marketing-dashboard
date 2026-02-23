/**
 * integration.test.ts
 * Tests for the new emailCapture, boomerang, and communication routers
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@golfvx.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

// ─────────────────────────────────────────────────────────────────────────────
// emailCapture router tests
// ─────────────────────────────────────────────────────────────────────────────

describe("emailCapture router", () => {
  it("list returns paginated results with correct shape", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.emailCapture.list({
      page: 1,
      limit: 10,
    });

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it("list supports source and status filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.emailCapture.list({
      page: 1,
      limit: 10,
      source: "web_form",
      status: "new",
    });

    expect(result).toHaveProperty("data");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("list supports search parameter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.emailCapture.list({
      page: 1,
      limit: 10,
      search: "test@example.com",
    });

    expect(result).toHaveProperty("data");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("create inserts a new email capture and returns its id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.emailCapture.create({
      email: `test-${Date.now()}@golfvx.com`,
      firstName: "Test",
      lastName: "Lead",
      phone: "+12345678901",
      source: "web_form",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");

    // Verify the created record via getById
    const fetched = await caller.emailCapture.getById({ id: result.id });
    expect(fetched).not.toBeNull();
    expect(fetched!.email).toContain("@golfvx.com");
    expect(fetched!.firstName).toBe("Test");
    expect(fetched!.lastName).toBe("Lead");
    expect(fetched!.source).toBe("web_form");
    expect(fetched!.status).toBe("new");
  });

  it("getById returns a lead by ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create first
    const created = await caller.emailCapture.create({
      email: `getbyid-${Date.now()}@golfvx.com`,
      firstName: "GetById",
      source: "manual_csv",
    });

    // Get by ID
    const result = await caller.emailCapture.getById({ id: created.id });
    expect(result).not.toBeNull();
    expect(result!.id).toBe(created.id);
    expect(result!.firstName).toBe("GetById");
  });

  it("updateStatus changes the status of a lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create first
    const created = await caller.emailCapture.create({
      email: `status-${Date.now()}@golfvx.com`,
      source: "giveaway",
    });

    // Update status
    await caller.emailCapture.updateStatus({
      id: created.id,
      status: "contacted",
    });

    // Verify
    const updated = await caller.emailCapture.getById({ id: created.id });
    expect(updated!.status).toBe("contacted");
  });

  it("delete removes a lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create first
    const created = await caller.emailCapture.create({
      email: `delete-${Date.now()}@golfvx.com`,
      source: "other",
    });

    // Delete
    const result = await caller.emailCapture.delete({ id: created.id });
    expect(result).toEqual({ success: true });

    // Verify it's gone — getById throws NOT_FOUND for missing records
    await expect(
      caller.emailCapture.getById({ id: created.id })
    ).rejects.toThrow();
  });

  it("bulkImport inserts multiple leads and skips duplicates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const uniqueEmail = `bulk-${Date.now()}@golfvx.com`;

    const result = await caller.emailCapture.bulkImport({
      leads: [
        { email: uniqueEmail, firstName: "Bulk1", source: "manual_csv" },
        { email: `bulk2-${Date.now()}@golfvx.com`, firstName: "Bulk2", source: "manual_csv" },
      ],
    });

    expect(result).toHaveProperty("inserted");
    expect(result).toHaveProperty("skipped");
    expect(result.inserted).toBeGreaterThanOrEqual(1);

    // Import same email again — should be skipped
    const result2 = await caller.emailCapture.bulkImport({
      leads: [{ email: uniqueEmail, firstName: "Bulk1Again", source: "manual_csv" }],
    });
    expect(result2.skipped).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// boomerang router tests
// ─────────────────────────────────────────────────────────────────────────────

describe("boomerang router", () => {
  it("getTemplates returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This calls the Boomerang API — may return empty array if no API key
    const result = await caller.boomerang.getTemplates();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getAllMembers requires a templateId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Should work with a valid template ID (even if API returns empty)
    const result = await caller.boomerang.getAllMembers({ templateId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// communication router tests
// ─────────────────────────────────────────────────────────────────────────────

describe("communication router", () => {
  it("getHistory returns paginated results with correct shape", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.getHistory({
      page: 1,
      limit: 10,
    });

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it("getHistory supports channel filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.getHistory({
      page: 1,
      limit: 10,
      channel: "sms",
    });

    expect(result).toHaveProperty("data");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("getHistory supports recipientId and recipientType filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.getHistory({
      page: 1,
      limit: 10,
      recipientId: 1,
      recipientType: "member",
    });

    expect(result).toHaveProperty("data");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("getStats returns an array of aggregated stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.getStats({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("getStats supports campaignName filter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.communication.getStats({
      campaignName: "test-campaign",
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Schema validation tests
// ─────────────────────────────────────────────────────────────────────────────

describe("schema validation", () => {
  it("emailCapture.create rejects invalid email", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.emailCapture.create({
        email: "not-an-email",
        source: "web_form",
      })
    ).rejects.toThrow();
  });

  it("emailCapture.create rejects invalid source", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.emailCapture.create({
        email: "valid@email.com",
        source: "invalid_source" as any,
      })
    ).rejects.toThrow();
  });

  it("emailCapture.updateStatus rejects invalid status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.emailCapture.updateStatus({
        id: 1,
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });

  it("communication.sendSMS returns a result object", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Sending to a non-existent phone without Twilio configured
    // should return { success: false } gracefully
    const result = await caller.communication.sendSMS({
      recipientId: 1,
      recipientType: "member",
      recipientName: "Test",
      phone: "+10000000000",
      body: "Hello test",
    });

    expect(result).toHaveProperty("success");
    expect(typeof result.success).toBe("boolean");
  });

  it("communication.sendEmail rejects empty email address", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // z.string().email() should reject empty string
    await expect(
      caller.communication.sendEmail({
        recipientId: 1,
        recipientType: "member",
        recipientName: "Test",
        email: "", // empty email should fail zod validation
        subject: "Test",
        htmlBody: "<p>Hello</p>",
      })
    ).rejects.toThrow();
  });
});
