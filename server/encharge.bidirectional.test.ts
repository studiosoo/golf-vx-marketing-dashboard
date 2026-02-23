import { describe, it, expect, vi, beforeEach } from "vitest";
import { upsertEnchargePerson, updateEnchargePersonByEmail } from "./encharge";

// Mock fetch globally
global.fetch = vi.fn();

describe("Encharge Bidirectional Sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully upsert a person to Encharge", async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "encharge_person_123" }),
    });

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
  });

  it("should handle Encharge API errors gracefully", async () => {
    // Mock failed API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: "Bad Request",
      json: async () => ({ message: "Invalid email format" }),
    });

    const result = await upsertEnchargePerson({
      email: "invalid-email",
      firstName: "Test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should update person by email", async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "encharge_person_456" }),
    });

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
  });

  it("should handle network errors", async () => {
    // Mock network error
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const result = await upsertEnchargePerson({
      email: "test@example.com",
      firstName: "Test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  it("should include custom fields in the request", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "encharge_person_789" }),
    });

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
  });
});
