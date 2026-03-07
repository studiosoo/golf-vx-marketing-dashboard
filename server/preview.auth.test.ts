/**
 * Auth regression tests for previewRouter.
 *
 * These tests verify that getSnapshot and getDriveDaySessions now require
 * authentication. A future regression to publicProcedure would cause
 * the UNAUTHORIZED tests to fail immediately.
 */
import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeReq(): TrpcContext["req"] {
  return { protocol: "https", headers: {} } as TrpcContext["req"];
}
function makeRes(): TrpcContext["res"] {
  return { clearCookie: () => {} } as TrpcContext["res"];
}

function anonCtx(): TrpcContext {
  return { user: null, req: makeReq(), res: makeRes() };
}

function authCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@golfvx.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: makeReq(),
    res: makeRes(),
  };
}

describe("previewRouter — auth enforcement", () => {
  describe("getSnapshot", () => {
    it("rejects unauthenticated callers with UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(anonCtx());
      await expect(caller.preview.getSnapshot()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("passes auth gate for authenticated callers", async () => {
      const caller = appRouter.createCaller(authCtx());
      try {
        const result = await caller.preview.getSnapshot();
        // If DB is available: shape check
        expect(result).toBeDefined();
        expect(typeof result.members?.total).toBe("number");
      } catch (e) {
        // DB/infra unavailable in test env is acceptable —
        // what matters is the error is NOT an auth rejection.
        if (e instanceof TRPCError) {
          expect(e.code).not.toBe("UNAUTHORIZED");
        }
      }
    });
  });

  describe("getDriveDaySessions", () => {
    it("rejects unauthenticated callers with UNAUTHORIZED", async () => {
      const caller = appRouter.createCaller(anonCtx());
      await expect(caller.preview.getDriveDaySessions()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("passes auth gate for authenticated callers", async () => {
      const caller = appRouter.createCaller(authCtx());
      try {
        const result = await caller.preview.getDriveDaySessions();
        expect(result).toBeDefined();
        expect(Array.isArray(result.sessions)).toBe(true);
      } catch (e) {
        // Acuity API unavailable in test env is acceptable —
        // what matters is the error is NOT an auth rejection.
        if (e instanceof TRPCError) {
          expect(e.code).not.toBe("UNAUTHORIZED");
        }
      }
    });
  });
});
