export const DEFAULT_VENUE_SLUG = "arlington-heights";

export type VenueScopedSection =
  | "dashboard"
  | "reports"
  | "campaigns"
  | "activities"
  | "audience"
  | "insights"
  | "dataHealth"
  // Legacy (kept for backward compat)
  | "studioSoo"
  | "performance"
  | "operations";

export function withDefaultVenueSlug(venueSlug?: string | null): string {
  return venueSlug?.trim() || DEFAULT_VENUE_SLUG;
}

export const appRoutes = {
  root: "/app",
  accountProfile: "/app/account/profile",
  admin: {
    overview: "/app/admin/overview",
    users: "/app/admin/users",
    roles: "/app/admin/roles",
    integrations: "/app/admin/integrations",
    venues: "/app/admin/venues",
    kpiDefinitions: "/app/admin/kpi-definitions",
    syncHealth: "/app/admin/sync-health",
    reportSettings: "/app/admin/report-settings",
    auditLog: "/app/admin/audit-log",
  },
  venue: (venueSlug = DEFAULT_VENUE_SLUG) => {
    const venue = withDefaultVenueSlug(venueSlug);
    const base = `/app/${venue}`;

    return {
      base,
      dashboard: `${base}/dashboard`,

      reports: {
        home: `${base}/reports`,
        templates: `${base}/reports/templates`,
        schedules: `${base}/reports/schedules`,
        archive: `${base}/reports/archive`,
        briefs: `${base}/reports/briefs`,
        detail: (reportId: string | number) => `${base}/reports/${reportId}`,
      },

      // ── Canonical top-level routes (IA Redefinition Directive) ──────────────

      campaigns: {
        home: `${base}/campaigns`,
        detail: (id: string | number) => `${base}/campaigns/${id}`,
        trialConversion: `${base}/campaigns/trial-conversion`,
        membershipAcquisition: `${base}/campaigns/membership-acquisition`,
        memberRetention: `${base}/campaigns/member-retention`,
        b2bEvents: `${base}/campaigns/b2b-events`,
      },

      activities: {
        home: `${base}/activities`,
        programs: `${base}/activities/programs`,
        promotions: `${base}/activities/promotions`,
        localEvents: `${base}/activities/local-events`,
        archive: `${base}/activities/archive`,
        detail: (tab: string, id: string) => `${base}/activities/${tab}/${id}`,
        programDetail: (id: string) => `${base}/activities/programs/${id}`,
        promotionDetail: (id: string) => `${base}/activities/promotions/${id}`,
        localDetail: (id: string) => `${base}/activities/local-events/${id}`,
      },

      audience: {
        home: `${base}/audience`,
        members: `${base}/audience/members`,
        subscribers: `${base}/audience/subscribers`,
        participants: `${base}/audience/participants`,
        unified: `${base}/audience/unified`,
        // Legacy aliases
        people: `${base}/audience/people`,
        segments: `${base}/audience/segments`,
        duplicates: `${base}/audience/duplicates`,
        profile: (profileId: string | number) => `${base}/audience/${profileId}`,
      },

      insights: {
        home: `${base}/insights`,
        ask: `${base}/insights/ask`,
        research: `${base}/insights/research`,
        strategy: `${base}/insights/strategy`,
        // Legacy aliases
        alerts: `${base}/insights/alerts`,
        recommendations: `${base}/insights/recommendations`,
      },

      dataHealth: `${base}/data-health`,

      // ── Legacy paths (kept for redirects, do not add new links here) ────────

      performance: `${base}/performance`,

      operations: {
        home: `${base}/operations`,
        thisWeek: `${base}/operations/this-week`,
        inbox: `${base}/operations/inbox`,
        issues: `${base}/operations/issues`,
        tasks: `${base}/operations/tasks`,
        calendar: `${base}/operations/calendar`,
        campaigns: `${base}/operations/campaigns`,
        campaignDetail: (campaignId: string | number) => `${base}/operations/campaigns/${campaignId}`,
        paidMedia: `${base}/operations/paid-media`,
        paidMediaDetail: (channelCampaignId: string | number) => `${base}/operations/paid-media/${channelCampaignId}`,
        programs: `${base}/operations/programs`,
        programDetail: (programId: string | number) => `${base}/operations/programs/${programId}`,
        promotions: `${base}/operations/promotions`,
        promotionDetail: (promotionId: string | number) => `${base}/operations/promotions/${promotionId}`,
        communications: `${base}/operations/communications`,
        communicationDetail: (communicationId: string | number) => `${base}/operations/communications/${communicationId}`,
        content: `${base}/operations/content`,
        localMarketing: `${base}/operations/local-marketing`,
      },

      studioSoo: {
        home: `${base}/studio-soo`,
        autopilot: `${base}/studio-soo/autopilot`,
        campaigns: `${base}/studio-soo/campaigns`,
        campaignDetail: (id: string | number) => `${base}/studio-soo/campaigns/${id}`,
        production: `${base}/studio-soo/production`,
        activityPrograms: `${base}/studio-soo/activities/programs`,
        activityPromotions: `${base}/studio-soo/activities/promotions`,
        activityLocal: `${base}/studio-soo/activities/local`,
        activityAll: `${base}/studio-soo/activities/all`,
        activityDetail: (tab: string, id: string) => `${base}/studio-soo/activities/${tab}/${id}`,
        activityProgramDetail: (id: string) => `${base}/studio-soo/activities/programs/${id}`,
        activityPromotionDetail: (id: string) => `${base}/studio-soo/activities/promotions/${id}`,
        activityLocalDetail: (id: string) => `${base}/studio-soo/activities/local/${id}`,
      },
    };
  },
};

export const publicRoutes = {
  home: "/public",
  promotion: (slug: string) => `/public/promotions/${slug}`,
  promotions: "/public/promotions",
  trial: (slug = "trial-session") => `/public/trials/${slug}`,
  giveawayAnniversary: "/public/giveaways/anniversary",
  giveawayAnniversaryApply: "/public/giveaways/anniversary/apply",
  giveawayAnniversaryThankYou: "/public/giveaways/anniversary/thank-you",
};

export const sharedRoutes = {
  report: (shareId: string) => `/r/${shareId}`,
};

export function getVenueBasePath(pathname: string): string | null {
  const match = pathname.match(/^\/app\/([^/]+)/);
  if (!match) return null;
  return `/app/${match[1]}`;
}

export function getVenueSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/app\/([^/]+)/);
  return match?.[1] ?? null;
}

export function getDefaultVenueRoute(section: VenueScopedSection = "dashboard"): string {
  const venue = appRoutes.venue(DEFAULT_VENUE_SLUG);
  switch (section) {
    case "reports":
      return venue.reports.home;
    case "campaigns":
      return venue.campaigns.home;
    case "activities":
      return venue.activities.programs;
    case "audience":
      return venue.audience.members;
    case "insights":
      return venue.insights.ask;
    case "dataHealth":
      return venue.dataHealth;
    // Legacy
    case "studioSoo":
      return venue.studioSoo.autopilot;
    case "performance":
      return venue.performance;
    case "operations":
      return venue.operations.thisWeek;
    case "dashboard":
    default:
      return venue.dashboard;
  }
}
