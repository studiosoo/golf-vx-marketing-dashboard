export const DEFAULT_VENUE_SLUG = "arlington-heights";

export type VenueScopedSection =
  | "dashboard"
  | "reports"
  | "performance"
  | "operations"
  | "audience"
  | "insights";

export type NavMatchOptions = {
  exact?: boolean;
};

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
      },
      audience: {
        home: `${base}/audience`,
        people: `${base}/audience/people`,
        segments: `${base}/audience/segments`,
        duplicates: `${base}/audience/duplicates`,
        profile: (profileId: string | number) => `${base}/audience/${profileId}`,
      },
      insights: {
        home: `${base}/insights`,
        alerts: `${base}/insights/alerts`,
        recommendations: `${base}/insights/recommendations`,
        ask: `${base}/insights/ask`,
        research: `${base}/insights/research`,
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
    case "performance":
      return venue.performance;
    case "operations":
      return venue.operations.thisWeek;
    case "audience":
      return venue.audience.people;
    case "insights":
      return venue.insights.alerts;
    case "dashboard":
    default:
      return venue.dashboard;
  }
}

export function isRouteActive(currentPath: string, targetPath: string, options: NavMatchOptions = {}): boolean {
  if (options.exact) return currentPath === targetPath;
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}
