import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { upsertEnchargePerson, updateEnchargePersonByEmail } from "./encharge";

// Save original fetch
const originalFetch = global.fetch;

describe("Encharge Bidirectional Sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = originalFetch;
  });

  it("should return error when Write Key is not configured", async () => {
    // Without ENCHARGE_WRITE_KEY set, upsert should return error, not throw
    const originalKey = process.env.ENCHARGE_WRITE_KEY;
    delete process.env.ENCHARGE_WRITE_KEY;

    const result = await upsertEnchargePerson({
      email: "test@example.com",
      firstName: "John",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("not configured");

    // Restore
    if (originalKey) process.env.ENCHARGE_WRITE_KEY = originalKey;
  });

  it("should successfully upsert a person when configured", async () => {
    // Set a mock write key
    const originalKey = process.env.ENCHARGE_WRITE_KEY;
    process.env.ENCHARGE_WRITE_KEY = "test-write-key-12345";

    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "encharge_person_123" }),
    }) as any;

    const result = await upsertEnchargePerson({
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "+1234567890",
      tags: ["member", "active"],
      fields: {
        membershipTier: "pro",
        status: "active",
      },
    });

    expect(result.success).toBe(true);
    expect(result.personId).toBe("encharge_person_123");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://ingest.encharge.io/v1",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );

    // Restore
    if (originalKey) {
      process.env.ENCHARGE_WRITE_KEY = originalKey;
    } else {
      delete process.env.ENCHARGE_WRITE_KEY;
    }
  });

  it("should handle Encharge API errors gracefully", async () => {
    const originalKey = process.env.ENCHARGE_WRITE_KEY;
    process.env.ENCHARGE_WRITE_KEY = "test-write-key-12345";

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      statusText: "Bad Request",
      json: async () => ({ message: "Invalid email format" }),
    }) as any;

    const result = await upsertEnchargePerson({
      email: "invalid-email",
      firstName: "Test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    if (originalKey) {
      process.env.ENCHARGE_WRITE_KEY = originalKey;
    } else {
      delete process.env.ENCHARGE_WRITE_KEY;
    }
  });

  it("should update person by email when configured", async () => {
    const originalKey = process.env.ENCHARGE_WRITE_KEY;
    process.env.ENCHARGE_WRITE_KEY = "test-write-key-12345";

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "encharge_person_456" }),
    }) as any;

    const result = await updateEnchargePersonByEmail("existing@example.com", {
      firstName: "Jane",
      lastName: "Smith",
      phone: "+9876543210",
      tags: ["updated", "premium"],
    });

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://ingest.encharge.io/v1",
      expect.objectContaining({
        method: "POST",
      })
    );

    if (originalKey) {
      process.env.ENCHARGE_WRITE_KEY = originalKey;
    } else {
      delete process.env.ENCHARGE_WRITE_KEY;
    }
  });

  it("should handle network errors", async () => {
    const originalKey = process.env.ENCHARGE_WRITE_KEY;
    process.env.ENCHARGE_WRITE_KEY = "test-write-key-12345";

    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error")) as any;

    const result = await upsertEnchargePerson({
      email: "test@example.com",
      firstName: "Test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");

    if (originalKey) {
      process.env.ENCHARGE_WRITE_KEY = originalKey;
    } else {
      delete process.env.ENCHARGE_WRITE_KEY;
    }
  });

  it("should include custom fields in the request", async () => {
    const originalKey = process.env.ENCHARGE_WRITE_KEY;
    process.env.ENCHARGE_WRITE_KEY = "test-write-key-12345";

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "encharge_person_789" }),
    }) as any;

    await upsertEnchargePerson({
      email: "member@example.com",
      firstName: "Member",
      lastName: "User",
      fields: {
        membershipTier: "annual",
        lifetimeValue: 1200,
        acquisitionSource: "meta_ads",
      },
    });

    const fetchCall = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);

    expect(requestBody.email).toBe("member@example.com");
    expect(requestBody.firstName).toBe("Member");
    expect(requestBody.lastName).toBe("User");
    expect(requestBody.membershipTier).toBe("annual");
    expect(requestBody.lifetimeValue).toBe(1200);
    expect(requestBody.acquisitionSource).toBe("meta_ads");

    if (originalKey) {
      process.env.ENCHARGE_WRITE_KEY = originalKey;
    } else {
      delete process.env.ENCHARGE_WRITE_KEY;
    }
  });
});
