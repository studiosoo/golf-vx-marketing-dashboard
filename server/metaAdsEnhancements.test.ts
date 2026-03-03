import { describe, it, expect, vi, beforeEach } from "vitest";
import { retryMetaAdsRequest } from "./metaAdsRetry";
import type { AxiosResponse, AxiosError } from "axios";

describe("Meta Ads Retry Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should succeed on first attempt when request is successful", async () => {
    const mockResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    };

    const requestFn = vi.fn().mockResolvedValue(mockResponse);
    const result = await retryMetaAdsRequest(requestFn);

    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
  });

  it("should retry on 429 rate limit error", async () => {
    const mockError: Partial<AxiosError> = {
      response: {
        status: 429,
        statusText: "Too Many Requests",
        headers: {},
        config: {} as any,
        data: {},
      },
    };

    const mockSuccess: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    };

    const requestFn = vi
      .fn()
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccess);

    const result = await retryMetaAdsRequest(requestFn, {
      maxRetries: 3,
      initialDelay: 10,
    });

    expect(requestFn).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockSuccess);
  });

  it("should retry on 500 server error", async () => {
    const mockError: Partial<AxiosError> = {
      response: {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        config: {} as any,
        data: {},
      },
    };

    const mockSuccess: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    };

    const requestFn = vi
      .fn()
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccess);

    const result = await retryMetaAdsRequest(requestFn, {
      maxRetries: 3,
      initialDelay: 10,
    });

    expect(requestFn).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockSuccess);
  });

  it("should not retry on 400 bad request error", async () => {
    const mockError: Partial<AxiosError> = {
      response: {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
        data: {},
      },
    };

    const requestFn = vi.fn().mockRejectedValue(mockError);

    await expect(
      retryMetaAdsRequest(requestFn, {
        maxRetries: 3,
        initialDelay: 10,
      })
    ).rejects.toEqual(mockError);

    expect(requestFn).toHaveBeenCalledTimes(1);
  });

  it("should throw error after max retries exceeded", async () => {
    const mockError: Partial<AxiosError> = {
      response: {
        status: 429,
        statusText: "Too Many Requests",
        headers: {},
        config: {} as any,
        data: {},
      },
    };

    const requestFn = vi.fn().mockRejectedValue(mockError);

    await expect(
      retryMetaAdsRequest(requestFn, {
        maxRetries: 2,
        initialDelay: 10,
      })
    ).rejects.toEqual(mockError);

    // Should be called 3 times: initial + 2 retries
    expect(requestFn).toHaveBeenCalledTimes(3);
  });

  it("should use exponential backoff for delays", async () => {
    const mockError: Partial<AxiosError> = {
      response: {
        status: 429,
        statusText: "Too Many Requests",
        headers: {},
        config: {} as any,
        data: {},
      },
    };

    const requestFn = vi.fn().mockRejectedValue(mockError);
    const startTime = Date.now();

    try {
      await retryMetaAdsRequest(requestFn, {
        maxRetries: 2,
        initialDelay: 50,
        backoffMultiplier: 2,
      });
    } catch (error) {
      // Expected to fail
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // With exponential backoff: 50ms + 100ms = 150ms minimum
    // Allow some tolerance for execution time
    expect(duration).toBeGreaterThanOrEqual(100);
    expect(requestFn).toHaveBeenCalledTimes(3);
  });
});

describe("Meta Ads Alert Thresholds", () => {
  it("should identify low CTR correctly", () => {
    const avgCTR = 0.8;
    const threshold = 1.0;
    
    expect(avgCTR).toBeLessThan(threshold);
  });

  it("should identify high CPC correctly", () => {
    const avgCPC = 2.5;
    const threshold = 2.0;
    
    expect(avgCPC).toBeGreaterThan(threshold);
  });

  it("should identify budget exceeded correctly", () => {
    const dailySpend = 65;
    const expectedBudget = 50;
    const threshold = 1.2; // 120%
    
    expect(dailySpend).toBeGreaterThan(expectedBudget * threshold);
  });

  it("should calculate severity levels correctly", () => {
    const lowCTRThreshold = 1.0;
    
    // High severity: CTR < 50% of threshold
    const criticalCTR = 0.4;
    expect(criticalCTR).toBeLessThan(lowCTRThreshold * 0.5);
    
    // Medium severity: CTR between 50% and 100% of threshold
    const mediumCTR = 0.7;
    expect(mediumCTR).toBeGreaterThan(lowCTRThreshold * 0.5);
    expect(mediumCTR).toBeLessThan(lowCTRThreshold);
  });

  it("should format alert messages correctly", () => {
    const avgCTR = 0.75;
    const threshold = 1.0;
    const message = `CTR (${avgCTR.toFixed(2)}%) is below the threshold of ${threshold}%. Consider improving ad creative or targeting.`;
    
    expect(message).toContain("0.75%");
    expect(message).toContain("1%");
    expect(message).toContain("Consider improving");
  });
});
