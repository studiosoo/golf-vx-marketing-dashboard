import { describe, it, expect } from "vitest";

describe("Instagram Access Token", () => {
  it("should have a valid INSTAGRAM_ACCESS_TOKEN env variable set", () => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    expect(token).toBeDefined();
    expect(token?.length).toBeGreaterThan(50);
    // Instagram long-lived tokens start with EAA
    expect(token?.startsWith("EAA")).toBe(true);
  });

  it("should be able to call the Instagram Graph API with the token", async () => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) {
      throw new Error("INSTAGRAM_ACCESS_TOKEN is not set");
    }
    const res = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${token}`
    );
    const data = await res.json() as any;
    expect(data.error).toBeUndefined();
    expect(data.id).toBeDefined();
    expect(typeof data.id).toBe("string");
  }, 15000);
});
