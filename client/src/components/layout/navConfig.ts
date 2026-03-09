import {
  BarChart3,
  FileText,
  Flag,
  Gauge,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Search,
  Settings,
  Target,
  Users,
  Workflow,
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
      label: "Dashboard",
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
      label: "Performance",
      path: venue.performance,
      icon: Gauge,
      matchPaths: [venue.performance],
    },
    {
      label: "Operations",
      path: venue.operations.campaigns,
      icon: Workflow,
      matchPaths: [
        venue.operations.home,
        venue.operations.campaigns,
        venue.operations.paidMedia,
        venue.operations.programs,
        venue.operations.promotions,
        venue.operations.content,
      ],
      children: [
        { label: "Campaigns", path: venue.operations.campaigns, icon: Flag },
        { label: "Paid Media", path: venue.operations.paidMedia, icon: BarChart3 },
        { label: "Programs", path: venue.operations.programs, icon: Target },
        { label: "Promotions", path: venue.operations.promotions, icon: Lightbulb },
        { label: "Content & Social", path: venue.operations.content, icon: FileText },
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
      path: venue.insights.recommendations,
      icon: Search,
      matchPaths: [
        venue.insights.home,
        venue.insights.recommendations,
        venue.insights.ask,
        venue.insights.research,
      ],
      children: [
        { label: "Recommendations", path: venue.insights.recommendations, icon: Lightbulb },
        { label: "Ask", path: venue.insights.ask, icon: MessageSquare },
        { label: "Research", path: venue.insights.research, icon: Search },
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
  return "Dashboard";
}
