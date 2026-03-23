import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getSundayClinicData,
  getWinterClinicData,
  getJuniorCampData,
  getAppointmentTypes,
  getAppointments,
  filterNonCashAppointments,
} from "../acuity";
import { getAllCampaignsWithInsights } from "../metaAds";

// ─── Activity → Acuity appointment type keywords ──────────────────────────────
const ACUITY_FALLBACK_KEYWORDS: Record<string, string[]> = {
  "sunday-clinic":      ["Sunday Clinic", "Drive Day", "Sunday Drive Day", "Public Drive"],
  "winter-camp":        ["Winter Clinic", "PBGA Winter", "Tots", "Bogey", "Par Shooter", "Ladies", "Co-Ed", "Adults & Kids", "Morning Mulligan"],
  "junior-summer-camp": ["Junior Camp", "Summer Camp", "Junior Summer Camp", "Weekly Summer Camp"],
};

// ─── Activity → Meta Ads campaign name keyword ─────────────────────────────────
const META_ADS_MAPPING: Record<string, string> = {
  "sunday-clinic":      "Sunday Clinic",
  "winter-camp":        "Winter Clinic",
  "junior-summer-camp": "Summer Camp",
  "annual-giveaway":    "Annual Giveaway",
  "trial-session":      "Trial",
};

export const activitiesRouter = router({
  /**
   * Fetch Acuity appointment data for a specific activity.
   * Uses dedicated per-activity functions for the three known programs,
   * and falls back to name-based type matching for others.
   */
  getActivityAcuityData: protectedProcedure
    .input(z.object({
      venueId:      z.string(),
      activityId:   z.string(),
      activityName: z.string(),
    }))
    .query(async ({ input }) => {
      const { activityId, activityName } = input;

      type RecentApt = { date: string; type: string; firstName: string; lastInitial: string; status: "confirmed" | "cancelled" };

      try {
        // ── Sunday Clinic / Drive Day ──────────────────────────────────────
        if (activityId === "sunday-clinic") {
          const data = await getSundayClinicData();
          const allApts = data.events.flatMap(e => e.appointments);
          // Filter out cash payments (system entry errors — not real revenue)
          const nonCashApts = await filterNonCashAppointments(allApts);
          const sorted = nonCashApts
            .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

          // Use _actualAmount (real charged amount from /payments) not amountPaid (listed price)
          const revenue = sorted.reduce(
            (sum, a) => sum + ((a as typeof a & { _actualAmount?: number })._actualAmount ?? 0), 0
          );

          const recent: RecentApt[] = sorted.slice(0, 5).map(a => ({
            date:        a.datetime,
            type:        a.type,
            firstName:   a.firstName,
            lastInitial: a.lastName?.[0] ?? "",
            status:      a.canceled ? "cancelled" : "confirmed",
          }));

          return {
            source:             "mapped" as const,
            participants:       data.uniqueAttendees,
            totalBookings:      data.totalBookings,
            revenue,
            recentAppointments: recent,
          };
        }

        // ── PBGA Winter Clinic ─────────────────────────────────────────────
        if (activityId === "winter-camp") {
          const [data, rawApts] = await Promise.all([
            getWinterClinicData(),
            getAppointments({ minDate: "2026-01-01", maxDate: "2026-03-31", canceled: false }),
          ]);
          const clinicApts = rawApts.filter(apt => {
            const name = apt.type.toLowerCase();
            return name.includes("clinic") && (
              name.includes("tots")        || name.includes("bogey")       ||
              name.includes("par shooter") || name.includes("h.s.")        ||
              name.includes("player/prep") || name.includes("ladies")      ||
              name.includes("co-ed")       || name.includes("adults & kids") ||
              name.includes("adults and kids") || name.includes("morning mulligan")
            );
          });
          const recent: RecentApt[] = [...clinicApts]
            .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
            .slice(0, 5)
            .map(a => ({
              date:        a.datetime,
              type:        a.type,
              firstName:   a.firstName,
              lastInitial: a.lastName?.[0] ?? "",
              status:      a.canceled ? "cancelled" : "confirmed",
            }));

          return {
            source:             "mapped" as const,
            participants:       data.uniqueStudents,
            totalBookings:      data.totalRegistrations,
            revenue:            data.totalRevenue,
            recentAppointments: recent,
          };
        }

        // ── PBGA Junior Summer Camp ────────────────────────────────────────
        if (activityId === "junior-summer-camp") {
          const [data, rawApts] = await Promise.all([
            getJuniorCampData(),
            getAppointments({ minDate: "2026-06-01", maxDate: "2026-08-31", canceled: false }),
          ]);
          const campApts = rawApts.filter(apt => {
            const cat  = (apt.category || "").toLowerCase();
            const name = apt.type.toLowerCase();
            return cat.includes("summer camp") || name.includes("summer camp") || name.includes("weekly summer camp");
          });
          const recent: RecentApt[] = [...campApts]
            .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
            .slice(0, 5)
            .map(a => ({
              date:        a.datetime,
              type:        a.type,
              firstName:   a.firstName,
              lastInitial: a.lastName?.[0] ?? "",
              status:      a.canceled ? "cancelled" : "confirmed",
            }));

          return {
            source:             "mapped" as const,
            participants:       data.uniqueParticipants,
            totalBookings:      data.totalRegistrations,
            revenue:            data.totalRevenue,
            recentAppointments: recent,
          };
        }

        // ── Generic fallback: keyword match on appointment type name ───────
        const keywords = ACUITY_FALLBACK_KEYWORDS[activityId] ?? [activityName];
        const types = await getAppointmentTypes();
        const matchedTypes = types.filter(t =>
          keywords.some(kw => t.name.toLowerCase().includes(kw.toLowerCase()))
        );

        if (matchedTypes.length === 0) {
          return {
            source:             "no_match" as const,
            participants:       null as number | null,
            totalBookings:      null as number | null,
            revenue:            null as number | null,
            recentAppointments: [] as RecentApt[],
            mappingNote:        "Appointment type match not found. Check Acuity type names in server/acuity.ts",
          };
        }

        const matchedIds = new Set(matchedTypes.map(t => t.id));
        const allApts    = await getAppointments({ canceled: false });
        const rawFiltered = allApts.filter(a => matchedIds.has(a.appointmentTypeID));
        // Filter out cash payments (system entry errors — not real revenue)
        const filtered   = await filterNonCashAppointments(rawFiltered);
        // Use _actualAmount (real charged amount from /payments) not amountPaid (listed price)
        const revenue    = filtered.reduce((sum, a) => sum + (a._actualAmount ?? 0), 0);
        const unique     = new Set(filtered.map(a => a.email.toLowerCase()));
        const recent: RecentApt[] = [...filtered]
          .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
          .slice(0, 5)
          .map(a => ({
            date:        a.datetime,
            type:        a.type,
            firstName:   a.firstName,
            lastInitial: a.lastName?.[0] ?? "",
            status:      a.canceled ? "cancelled" : "confirmed",
          }));

        return {
          source:             "mapped" as const,
          participants:       unique.size,
          totalBookings:      filtered.length,
          revenue,
          recentAppointments: recent,
        };

      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.toLowerCase().includes("credentials not configured")) {
          return {
            source:             "no_credentials" as const,
            participants:       null as number | null,
            totalBookings:      null as number | null,
            revenue:            null as number | null,
            recentAppointments: [] as RecentApt[],
          };
        }
        throw error;
      }
    }),

  /**
   * Fetch Meta Ads campaign stats for a specific activity.
   * Reads from the Meta Ads cache — does not make a live API call.
   */
  getActivityMetaAdsData: protectedProcedure
    .input(z.object({
      venueId:      z.string(),
      activityId:   z.string(),
      activityName: z.string(),
    }))
    .query(async ({ input }) => {
      const keyword = META_ADS_MAPPING[input.activityId];
      if (!keyword) return { matched: false as const };

      try {
        const campaigns = await getAllCampaignsWithInsights();
        const match = (campaigns as any[]).find((c: any) =>
          c.name.toLowerCase().includes(keyword.toLowerCase())
        );

        if (!match) return { matched: false as const };

        const ins = match.insights;
        return {
          matched:      true as const,
          campaignName: match.name as string,
          spend:        parseFloat(ins.spend       || "0"),
          impressions:  parseInt(ins.impressions   || "0", 10),
          reach:        parseInt(ins.reach         || "0", 10),
          clicks:       parseInt(ins.clicks        || "0", 10),
          cpm:          parseFloat(ins.cpm         || "0"),
          cpc:          parseFloat(ins.cpc         || "0"),
          ctr:          parseFloat(ins.ctr         || "0"),
          dateStart:    ins.date_start as string,
          dateStop:     ins.date_stop  as string,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.toLowerCase().includes("credentials not configured")) {
          return { matched: false as const };
        }
        throw error;
      }
    }),
});
