import {
  Brain,
  FileText,
  Flag,
  Grid,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Users,
  Workflow,
  Zap,
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
    {
      label: "Overview",
      path: venue.dashboard,
      icon: LayoutDashboard,
      matchPaths: [venue.dashboard],
    },
    {
      label: "Reports",
      path: venue.reports.home,
      icon: FileText,
      matchPaths: [venue.reports.home],
    },
    {
      label: "Studio Soo",
      path: venue.studioSoo.autopilot,
      icon: Workflow,
      matchPaths: [
        venue.studioSoo.home,
        venue.studioSoo.autopilot,
        venue.studioSoo.campaigns,
        venue.studioSoo.production,
        venue.studioSoo.activityPrograms,
        venue.studioSoo.activityPromotions,
        venue.studioSoo.activityLocal,
        venue.studioSoo.activityAll,
        // Keep matching old operations paths for backward compatibility
        venue.operations.home,
        venue.operations.paidMedia,
        venue.operations.programs,
        venue.operations.promotions,
        venue.operations.localMarketing,
        venue.operations.content,
      ],
      children: [
        { label: "Autopilot",   path: venue.studioSoo.autopilot,        icon: Zap },
        { label: "Campaigns",   path: venue.studioSoo.campaigns,        icon: Flag },
        { label: "Activities",  path: venue.studioSoo.activityPrograms, icon: Grid },
        { label: "Production",  path: venue.studioSoo.production,       icon: Layers },
      ],
    },
    {
      label: "Audience",
      path: venue.audience.people,
      icon: Users,
      matchPaths: [
        venue.audience.home,
        venue.audience.people,
      ],
    },
    {
      label: "Insights",
      path: venue.insights.ask,
      icon: Search,
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
