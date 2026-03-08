import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  FileBarChart,
  FileClock,
  FileStack,
  FileText,
  Flag,
  Gauge,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Search,
  Settings,
  Shield,
  Target,
  Users,
  UserCircle2,
  Workflow,
  Wrench,
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
      matchPaths: [
        venue.reports.home,
        venue.reports.templates,
        venue.reports.schedules,
        venue.reports.archive,
        venue.reports.briefs,
      ],
      children: [
        { label: "Overview", path: venue.reports.home, icon: FileText },
        { label: "Templates", path: venue.reports.templates, icon: FileStack },
        { label: "Schedules", path: venue.reports.schedules, icon: FileClock },
        { label: "Archive", path: venue.reports.archive, icon: FileBarChart },
        { label: "Briefs", path: venue.reports.briefs, icon: ClipboardList },
      ],
    },
    {
      label: "Performance",
      path: venue.performance,
      icon: Gauge,
      matchPaths: [venue.performance],
    },
    {
      label: "Operations",
      path: venue.operations.thisWeek,
      icon: Workflow,
      matchPaths: [
        venue.operations.home,
        venue.operations.thisWeek,
        venue.operations.inbox,
        venue.operations.issues,
        venue.operations.tasks,
        venue.operations.calendar,
        venue.operations.campaigns,
        venue.operations.paidMedia,
        venue.operations.programs,
        venue.operations.promotions,
        venue.operations.communications,
        venue.operations.content,
      ],
      children: [
        { label: "This Week", path: venue.operations.thisWeek, icon: ClipboardList },
        { label: "Inbox", path: venue.operations.inbox, icon: MessageSquare },
        { label: "Campaigns", path: venue.operations.campaigns, icon: Flag },
        { label: "Paid Media", path: venue.operations.paidMedia, icon: BarChart3 },
        { label: "Programs", path: venue.operations.programs, icon: Target },
        { label: "Promotions", path: venue.operations.promotions, icon: Lightbulb },
        { label: "Communications", path: venue.operations.communications, icon: MessageSquare },
        { label: "Content", path: venue.operations.content, icon: FileText },
        { label: "Issues", path: venue.operations.issues, icon: AlertTriangle },
        { label: "Tasks", path: venue.operations.tasks, icon: ClipboardList },
      ],
    },
    {
      label: "Audience",
      path: venue.audience.people,
      icon: Users,
      matchPaths: [
        venue.audience.home,
        venue.audience.people,
        venue.audience.segments,
        venue.audience.duplicates,
      ],
      children: [
        { label: "People", path: venue.audience.people, icon: Users },
        { label: "Segments", path: venue.audience.segments, icon: Target },
        { label: "Duplicates", path: venue.audience.duplicates, icon: AlertTriangle },
      ],
    },
    {
      label: "Insights",
      path: venue.insights.alerts,
      icon: Search,
      matchPaths: [
        venue.insights.home,
        venue.insights.alerts,
        venue.insights.recommendations,
        venue.insights.ask,
        venue.insights.research,
      ],
      children: [
        { label: "Alerts", path: venue.insights.alerts, icon: AlertTriangle },
        { label: "Recommendations", path: venue.insights.recommendations, icon: Lightbulb },
        { label: "Ask", path: venue.insights.ask, icon: MessageSquare },
        { label: "Research", path: venue.insights.research, icon: Search },
      ],
    },
    {
      label: "Admin",
      path: appRoutes.admin.overview,
      icon: Shield,
      matchPaths: [
        appRoutes.admin.overview,
        appRoutes.admin.users,
        appRoutes.admin.roles,
        appRoutes.admin.integrations,
        appRoutes.admin.venues,
        appRoutes.admin.kpiDefinitions,
        appRoutes.admin.syncHealth,
        appRoutes.admin.reportSettings,
        appRoutes.admin.auditLog,
        appRoutes.accountProfile,
      ],
      children: [
        { label: "Overview", path: appRoutes.admin.overview, icon: Shield },
        { label: "Integrations", path: appRoutes.admin.integrations, icon: Wrench },
        { label: "Venues", path: appRoutes.admin.venues, icon: Users },
        { label: "KPI Definitions", path: appRoutes.admin.kpiDefinitions, icon: Target },
        { label: "Sync Health", path: appRoutes.admin.syncHealth, icon: AlertTriangle },
        { label: "Report Settings", path: appRoutes.admin.reportSettings, icon: FileClock },
        { label: "Audit Log", path: appRoutes.admin.auditLog, icon: FileBarChart },
        { label: "Profile", path: appRoutes.accountProfile, icon: UserCircle2 },
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
