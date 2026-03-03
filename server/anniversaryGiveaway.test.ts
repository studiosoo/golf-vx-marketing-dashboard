import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createGiveawayEntry, updateGiveawayEntry, getGiveawayEntryByEmail } from "./db";

describe("Anniversary Giveaway Form Submission", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testData = {
    firstName: "Test",
    email: testEmail,
    ipAddress: "127.0.0.1",
    userAgent: "Test Agent",
  };

  it("should create a new giveaway entry", async () => {
    const result = await createGiveawayEntry(testData);
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should retrieve giveaway entry by email", async () => {
    const entry = await getGiveawayEntryByEmail(testEmail);
    expect(entry).toBeDefined();
    expect(entry?.email).toBe(testEmail);
  });

  it("should update giveaway entry with application data", async () => {
    const applicationData = {
      email: testEmail,
      fullName: "Test User",
      ageRange: "25-34",
      gender: "Male",
      city: "Arlington Heights",
      isIllinoisResident: true,
      golfExperience: "Beginner",
      hasVisitedBefore: "Yes",
      phoneNumber: "555-1234",
      consentToContact: true,
    };

    const result = await updateGiveawayEntry(applicationData);
    expect(result).toBeDefined();
    expect(result.fullName).toBe("Test User");
    expect(result.ageRange).toBe("25-34");
  });

  it("should retrieve updated entry with all fields", async () => {
    const entry = await getGiveawayEntryByEmail(testEmail);
    expect(entry).toBeDefined();
    expect(entry?.fullName).toBe("Test User");
    expect(entry?.city).toBe("Arlington Heights");
    expect(entry?.isIllinoisResident).toBe(true);
  });
});
