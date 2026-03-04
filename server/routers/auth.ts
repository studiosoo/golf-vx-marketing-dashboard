import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const publicRouter = router({
  trackPageEvent: publicProcedure
    .input(z.object({
      pageSlug: z.string(),
      eventType: z.enum(["page_view", "cta_click", "form_submit", "booking_started", "booking_completed", "scroll_depth", "time_on_page"] as const),
      eventData: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const page = await db.getLandingPageBySlug(input.pageSlug);
      if (!page) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
      }

      const sessionId = ctx.req.cookies.session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const referer = ctx.req.headers.referer || ctx.req.headers.referrer;
      const userAgent = ctx.req.headers["user-agent"];
      const ipAddress = ctx.req.headers["x-forwarded-for"] || ctx.req.socket.remoteAddress;

      await db.trackPageEvent({
        pageId: page.id,
        sessionId,
        eventType: input.eventType,
        eventData: input.eventData,
        referrer: Array.isArray(referer) ? referer[0] : referer,
        userAgent,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      });

      return { success: true };
    }),

  getLandingPage: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const page = await db.getLandingPageBySlug(input.slug);
      if (!page || page.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
      }
      return page;
    }),
});

export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),
});
