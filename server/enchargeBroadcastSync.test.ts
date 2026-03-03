import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock fetch globally ───────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Mock DB ──────────────────────────────────────────────────────────────────
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockExecute = vi.fn();

vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    execute: mockExecute,
  })),
}));

vi.mock("../drizzle/schema", () => ({
  enchargeBroadcasts: { broadcastId: "broadcast_id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeBroadcast(overrides = {}) {
  return {
    id: 173189,
    name: "February Tournament",
    status: "sent",
    emailId: 420832,
    audience: { type: "segment", segmentId: 1069860 },
    sendAt: "2026-02-04T15:00:00.000Z",
    cachedMetric: {
      data: { open: 448, click: 4, delivered: 1332 },
      isStale: false,
    },
    peopleEntered: 0,
    ...overrides,
  };
}

function makeApiResponse(items: any[]) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({ items }),
  };
}

function makeSegmentResponse() {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      segments: [{ id: 1069860, name: "All Members", peopleCount: 108 }],
    }),
  };
}

function makeEmailResponse() {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      subject: "February Tournament - Golf VX",
      fromEmail: "arlingtonheights@playgolfvx.com",
      fromName: "Golf VX Arlington Heights",
    }),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Encharge Broadcast Sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENCHARGE_API_KEY = "test-api-key";
  });

  describe("Rate calculations", () => {
    it("calculates open rate correctly", () => {
      const delivered = 1332;
      const opens = 448;
      const openRate = delivered > 0 ? ((opens / delivered) * 100) : 0;
      expect(openRate).toBeCloseTo(33.63, 1);
    });

    it("calculates click rate correctly", () => {
      const delivered = 1332;
      const clicks = 4;
      const clickRate = delivered > 0 ? ((clicks / delivered) * 100) : 0;
      expect(clickRate).toBeCloseTo(0.30, 1);
    });

    it("calculates click-to-open rate correctly", () => {
      const opens = 448;
      const clicks = 4;
      const ctor = opens > 0 ? ((clicks / opens) * 100) : 0;
      expect(ctor).toBeCloseTo(0.89, 1);
    });

    it("returns 0 rates when delivered is 0", () => {
      const delivered = 0;
      const opens = 0;
      const clicks = 0;
      expect(delivered > 0 ? (opens / delivered) * 100 : 0).toBe(0);
      expect(delivered > 0 ? (clicks / delivered) * 100 : 0).toBe(0);
    });

    it("returns 0 CTOR when opens is 0", () => {
      const opens = 0;
      const clicks = 0;
      expect(opens > 0 ? (clicks / opens) * 100 : 0).toBe(0);
    });
  });

  describe("API response parsing", () => {
    it("extracts metrics from cachedMetric.data", () => {
      const broadcast = makeBroadcast();
      const metrics = broadcast.cachedMetric?.data || {};
      expect(metrics.delivered).toBe(1332);
      expect(metrics.open).toBe(448);
      expect(metrics.click).toBe(4);
    });

    it("handles missing cachedMetric gracefully", () => {
      const broadcast = makeBroadcast({ cachedMetric: undefined });
      const metrics = broadcast.cachedMetric?.data || {};
      expect(metrics.delivered || 0).toBe(0);
      expect(metrics.open || 0).toBe(0);
    });

    it("extracts segmentId from audience", () => {
      const broadcast = makeBroadcast();
      expect(broadcast.audience?.segmentId).toBe(1069860);
    });

    it("handles broadcast without audience", () => {
      const broadcast = makeBroadcast({ audience: undefined });
      expect(broadcast.audience?.segmentId).toBeUndefined();
    });

    it("parses sendAt date correctly", () => {
      const broadcast = makeBroadcast();
      const sendAt = broadcast.sendAt ? new Date(broadcast.sendAt) : null;
      expect(sendAt).toBeInstanceOf(Date);
      expect(sendAt?.getFullYear()).toBe(2026);
    });

    it("handles draft broadcast with no sendAt", () => {
      const broadcast = makeBroadcast({ status: "draft", sendAt: undefined });
      const sendAt = broadcast.sendAt ? new Date(broadcast.sendAt) : null;
      expect(sendAt).toBeNull();
    });
  });

  describe("Broadcast status handling", () => {
    it("identifies sent broadcasts", () => {
      const broadcast = makeBroadcast({ status: "sent" });
      expect(broadcast.status).toBe("sent");
    });

    it("identifies draft broadcasts", () => {
      const broadcast = makeBroadcast({ status: "draft" });
      expect(broadcast.status).toBe("draft");
    });

    it("identifies scheduled broadcasts", () => {
      const broadcast = makeBroadcast({ status: "scheduled" });
      expect(broadcast.status).toBe("scheduled");
    });
  });

  describe("Performance summary calculations", () => {
    it("calculates average open rate across broadcasts", () => {
      const broadcasts = [
        { openRate: "33.63", delivered: 1332 },
        { openRate: "43.23", delivered: 962 },
      ];
      const sentWithMetrics = broadcasts.filter(b => parseFloat(b.openRate) > 0);
      const avg = sentWithMetrics.reduce((sum, b) => sum + parseFloat(b.openRate), 0) / sentWithMetrics.length;
      expect(avg).toBeCloseTo(38.43, 1);
    });

    it("returns 0 average when no sent broadcasts", () => {
      const broadcasts: any[] = [];
      const avg = broadcasts.length > 0
        ? broadcasts.reduce((sum, b) => sum + parseFloat(b.openRate || "0"), 0) / broadcasts.length
        : 0;
      expect(avg).toBe(0);
    });

    it("sums total delivered correctly", () => {
      const broadcasts = [{ delivered: 1332 }, { delivered: 962 }, { delivered: 8 }];
      const total = broadcasts.reduce((sum, b) => sum + b.delivered, 0);
      expect(total).toBe(2302);
    });
  });
});
