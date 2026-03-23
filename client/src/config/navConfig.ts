import {
  Activity,
  BarChart2,
  Brain,
  Database,
  FileText,
  Flag,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { appRoutes, DEFAULT_VENUE_SLUG, getVenueBasePath, withDefaultVenueSlug } from "@/lib/routes";

export type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
  matchPaths?: string[];
};

export type NavCollapsible = {
  label: string;
  path: string;
  icon: React.ElementType;
  children?: NavItem[];
  matchPaths?: string[];
};

export type NavGroup = {
  heading: string;
  items: NavCollapsible[];
};

function buildNav(venueSlug: string) {
  const venue = appRoutes.venue(withDefaultVenueSlug(venueSlug));

  return [
    // 1. Overview
    {
      label: "Overview",
      path: venue.dashboard,
      icon: LayoutDashboard,
      matchPaths: [venue.dashboard],
    },

    // 2. Reports
    {
      label: "Reports",
      path: venue.reports.home,
      icon: FileText,
      matchPaths: [venue.reports.home],
    },

    // 3. Campaigns (canonical — was studio-soo/campaigns)
    {
      label: "Campaigns",
      path: venue.campaigns.home,
      icon: Flag,
      matchPaths: [
        venue.campaigns.home,
        // Legacy aliases for backward compat
        venue.studioSoo.campaigns,
        venue.operations.campaigns,
      ],
    },

    // 4. Activities (canonical — was studio-soo/activities)
    {
      label: "Activities",
      path: venue.activities.programs,
      icon: Activity,
      matchPaths: [
        venue.activities.home,
        venue.activities.programs,
        venue.activities.promotions,
        venue.activities.localEvents,
        venue.activities.archive,
        // Legacy aliases
        venue.studioSoo.activityPrograms,
        venue.studioSoo.activityPromotions,
        venue.studioSoo.activityLocal,
        venue.studioSoo.activityAll,
        venue.studioSoo.production,
        venue.operations.programs,
        venue.operations.promotions,
        venue.operations.localMarketing,
      ],
      children: [
        { label: "Programs",       path: venue.activities.programs,    icon: BarChart2 },
        { label: "Promotions",     path: venue.activities.promotions,  icon: Flag },
        { label: "Local & Events", path: venue.activities.localEvents, icon: Activity },
      ],
    },

    // 5. Audience
    {
      label: "Audience",
      path: venue.audience.members,
      icon: Users,
      matchPaths: [
        venue.audience.home,
        venue.audience.members,
        venue.audience.subscribers,
        venue.audience.participants,
        venue.audience.unified,
        // Legacy aliases
        venue.audience.people,
        venue.audience.duplicates,
      ],
    },

    // 6. Insights
    {
      label: "Insights",
      path: venue.insights.ask,
      icon: Brain,
      matchPaths: [
        venue.insights.home,
        venue.insights.ask,
        venue.insights.research,
        venue.insights.strategy,
        venue.insights.recommendations,
        venue.insights.alerts,
      ],
      children: [
        { label: "Ask",      path: venue.insights.ask,      icon: MessageSquare },
        { label: "Research", path: venue.insights.research, icon: Search },
        { label: "Strategy", path: venue.insights.strategy, icon: Brain },
      ],
    },

    // 7. Data Health
    {
      label: "Data Health",
      path: venue.dataHealth,
      icon: Database,
      matchPaths: [venue.dataHealth],
    },

    // Settings (bottom)
    {
      label: "Settings",
      path: appRoutes.admin.integrations,
      icon: Settings,
      matchPaths: [
        appRoutes.admin.integrations,
        appRoutes.admin.overview,
      ],
    },
  ] satisfies Array<NavCollapsible>;
}

export function getNavStructure(location?: string): Array<NavCollapsible | NavGroup> {
  const venueBase = location ? getVenueBasePath(location) : null;
  const venueSlug = venueBase?.split("/")[2] ?? DEFAULT_VENUE_SLUG;
  return buildNav(venueSlug);
}

export const NAV_STRUCTURE: Array<NavCollapsible | NavGroup> = getNavStructure();

function matchesPath(location: string, candidate: string): boolean {
  return location === candidate || location.startsWith(candidate + "/");
}

export function getActiveLabel(location: string): string {
  const navStructure = getNavStructure(location);
  for (const item of navStructure) {
    if ("heading" in item) {
      for (const sub of item.items) {
        if (sub.matchPaths?.some(path => matchesPath(location, path)) || matchesPath(location, sub.path)) {
          return sub.label;
        }
        if (sub.children) {
          const child = sub.children.find((c) => matchesPath(location, c.path));
          if (child) return child.label;
        }
      }
    } else {
      if (item.matchPaths?.some(path => matchesPath(location, path)) || matchesPath(location, item.path)) {
        return item.label;
      }
      if (item.children) {
        const child = item.children.find((c) => matchesPath(location, c.path));
        if (child) return child.label;
      }
    }
  }
  if (location.startsWith("/public/")) return "Public";
  if (location.startsWith("/r/")) return "Shared Report";
  return "Overview";
}
