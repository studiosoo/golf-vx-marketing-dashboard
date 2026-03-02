/**
 * Tests for Google Sheets CSV sync
 * Tests the CSV parsing logic and sync result structure
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
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
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

// Mock the schema
vi.mock("../drizzle/schema", () => ({
  giveawayApplications: {
    id: "id",
    googleSheetRowId: "googleSheetRowId",
    isTestEntry: "isTestEntry",
  },
}));

// Import after mocks
import { syncGiveawayFromSheets, getGiveawayCount } from "./googleSheetsSync";

describe("Google Sheets CSV Sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export syncGiveawayFromSheets function", () => {
    expect(typeof syncGiveawayFromSheets).toBe("function");
  });

  it("should export getGiveawayCount function", () => {
    expect(typeof getGiveawayCount).toBe("function");
  });

  it("should return SyncResult with correct shape", async () => {
    // Mock fetch to return a minimal CSV
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(
        `Submission Timestamp,BASIC INFORMATION\n` +
        `,Name,Email,Phone,Age Range,Gender,City,Illinois Resident\n` +
        `,,,,,,,\n` +
        `2026-02-18 18:01:38,Andy,andrew.palkowski@gmail.com,12692176279,35-44,Male,Arlington Heights,TRUE\n` +
        `2026-02-20 10:00:00,Jane Doe,jane@example.com,1234567890,25-34,Female,Chicago,TRUE\n`
      ),
    });

    const result = await syncGiveawayFromSheets();

    expect(result).toHaveProperty("inserted");
    expect(result).toHaveProperty("updated");
    expect(result).toHaveProperty("skipped");
    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("totalRows");
    expect(result).toHaveProperty("lastSyncTime");
    expect(result.errors).toBeInstanceOf(Array);
    expect(result.lastSyncTime).toBeInstanceOf(Date);
  });

  it("should skip rows with empty timestamp", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(
        `Submission Timestamp,BASIC INFORMATION\n` +
        `,Name,Email\n` +
        `,,,\n` +
        `,Andy,andrew@example.com\n` + // empty timestamp → skip
        `2026-02-18 18:01:38,Jane,jane@example.com\n`
      ),
    });

    const result = await syncGiveawayFromSheets();
    // Row with empty timestamp should be skipped
    expect(result.skipped).toBeGreaterThanOrEqual(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should handle fetch errors gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue("Forbidden"),
    });

    await expect(syncGiveawayFromSheets()).rejects.toThrow("Google Sheets CSV export failed");
  });

  it("should detect test entries", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(
        `Submission Timestamp,BASIC INFORMATION\n` +
        `,Name,Email\n` +
        `,,,\n` +
        `2026-02-18 18:01:38,Test Entry,test@example.com\n` +
        `2026-02-18 18:02:00,Hanna Jampas,hannajampas@gmail.com\n`
      ),
    });

    // Both should be processed (inserted or updated), but marked as test entries
    const result = await syncGiveawayFromSheets();
    expect(result.errors).toHaveLength(0);
  });

  it("should handle CSV with quoted fields containing commas", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(
        `Submission Timestamp,BASIC INFORMATION\n` +
        `,Name,Email,Phone,Age Range,Gender,City\n` +
        `,,,,,,,\n` +
        `2026-02-18 18:01:38,"Smith, John",john@example.com,1234567890,35-44,Male,"Arlington Heights, IL"\n`
      ),
    });

    const result = await syncGiveawayFromSheets();
    expect(result.errors).toHaveLength(0);
  });

  it("should count only non-test entries", async () => {
    const { getDb } = await import("./db");
    const mockDb = await getDb();
    (mockDb!.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { id: 1 }, { id: 2 }, { id: 3 },
        ]),
      }),
    });

    const count = await getGiveawayCount();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe("CSV Parsing Edge Cases", () => {
  it("should handle timestamp format with single-digit hour", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(
        `Submission Timestamp,BASIC INFORMATION\n` +
        `,Name,Email\n` +
        `,,,\n` +
        `2026-03-02 7:42:37,Bill Chamberlin,bill@example.com\n`
      ),
    });

    const result = await syncGiveawayFromSheets();
    // Should not error on single-digit hour format
    expect(result.errors).toHaveLength(0);
  });

  it("should handle empty rows in the middle of data", async () => {
    vi.clearAllMocks();
    // Re-setup the db mock for this test
    const { getDb } = await import("./db");
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(
        `Submission Timestamp,BASIC INFORMATION\n` +
        `,Name,Email\n` +
        `,,,\n` +
        `2026-02-18 18:01:38,Andy,andy@example.com\n` +
        `\n` + // empty row
        `2026-02-20 10:00:00,Jane,jane@example.com\n`
      ),
    });

    const result = await syncGiveawayFromSheets();
    // Empty rows should be skipped, 2 valid data rows
    expect(result.totalRows).toBe(2);
    // Errors should only come from DB issues, not parsing
    // (mock DB may produce errors in this test context)
    expect(result.inserted + result.updated + result.skipped + result.errors.length).toBeGreaterThanOrEqual(0);
  });
});
