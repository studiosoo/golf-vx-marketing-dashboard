import { describe, it, expect } from "vitest";

describe("Meta Ads API Credentials", () => {
  it("should have META_ADS_ACCESS_TOKEN set", () => {
    const token = process.env.META_ADS_ACCESS_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(10);
  });

  it("should have META_ADS_ACCOUNT_ID set", () => {
    const accountId = process.env.META_ADS_ACCOUNT_ID;
    expect(accountId).toBeDefined();
    expect(accountId).toBe("823266657015117");
  });

  it("should have META_ADS_SYSTEM_USER_ID set", () => {
    const systemUserId = process.env.META_ADS_SYSTEM_USER_ID;
    expect(systemUserId).toBeDefined();
    expect(systemUserId).toBe("61588538816768");
  });

  it("should successfully call Meta Graph API with the token", async () => {
    const token = process.env.META_ADS_ACCESS_TOKEN;
    const accountId = process.env.META_ADS_ACCOUNT_ID;
    
    if (!token || !accountId) {
      console.warn("Skipping API test - credentials not set");
      return;
    }

    const response = await fetch(
      `https://graph.facebook.com/v21.0/act_${accountId}?fields=name,account_status,currency&access_token=${token}`
    );
    
    const data = await response.json();
    
    // If the API call fails, log the error for debugging
    if (!response.ok) {
      console.log("Meta API response:", JSON.stringify(data, null, 2));
    }
    
    expect(response.ok).toBe(true);
    expect(data.name).toBe("Golf VX Arlington Heights");
    expect(data.currency).toBe("USD");
  });
});
