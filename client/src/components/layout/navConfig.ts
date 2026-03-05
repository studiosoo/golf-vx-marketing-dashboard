import {
  LayoutDashboard,
  BarChart3,
  BarChart2,
  Instagram,
  Bot,
  Flag,
  UserCheck,
  UserPlus,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  Zap,
  Trophy,
  Mail,
  Search,
  Brain,
  Newspaper,
  LineChart,
  TrendingUp,
  DollarSign,
  FileText,
  Wrench,
  BarChart,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
};

export type NavCollapsible = {
  label: string;
  path: string;
  icon: React.ElementType;
  children?: NavItem[];
};

export type NavGroup = {
  heading: string;
  items: NavCollapsible[];
};

// ─── Navigation Structure ─────────────────────────────────────────────────────

export const NAV_STRUCTURE: Array<NavCollapsible | NavGroup> = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    heading: "Intelligence",
    items: [
      { label: "Autopilot", path: "/intelligence/autopilot", icon: Zap },
      { label: "Assistant", path: "/intelligence/assistant", icon: Bot },
      { label: "Strategy", path: "/intelligence/strategy", icon: Brain },
      {
        label: "Analytics",
        path: "/intelligence/performance",
        icon: BarChart,
        children: [
          { label: "Performance", path: "/intelligence/performance", icon: BarChart2 },
          { label: "Revenue", path: "/intelligence/revenue", icon: DollarSign },
          { label: "Reports", path: "/intelligence/reports", icon: FileText },
          { label: "ROI & KPI", path: "/roi", icon: TrendingUp },
          { label: "Market Research", path: "/intelligence/market-research", icon: Search },
        ],
      },
    ],
  },
  {
    heading: "Marketing",
    items: [
      { label: "Programs & Events", path: "/programs", icon: Flag },
      { label: "Advertising", path: "/advertising", icon: BarChart3 },
      {
        label: "Social & Content",
        path: "/website/instagram",
        icon: Instagram,
        children: [
          { label: "Instagram", path: "/website/instagram", icon: Instagram },
          { label: "Instagram Analytics", path: "/website/instagram/analytics", icon: LineChart },
          { label: "News / Blog", path: "/website/news", icon: Newspaper },
        ],
      },
      {
        label: "Communications",
        path: "/communication",
        icon: MessageSquare,
        children: [
          { label: "Email (Encharge)", path: "/communication/email-marketing", icon: Mail },
          { label: "Drip Campaigns", path: "/communication/drip", icon: Mail },
          { label: "SMS & Announcements", path: "/communication/announcements", icon: MessageSquare },
          { label: "Automations", path: "/communication/automations", icon: Zap },
        ],
      },
    ],
  },
  {
    heading: "Contacts & CRM",
    items: [
      { label: "Members", path: "/list/members", icon: UserCheck },
      { label: "Pro Members", path: "/pro-members", icon: Trophy },
      { label: "Guests & Leads", path: "/list/guests", icon: UserPlus },
    ],
  },
  {
    heading: "Settings",
    items: [
      { label: "Integrations", path: "/settings/integrations", icon: Wrench },
      { label: "Account", path: "/settings/account", icon: Settings },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getActiveLabel(location: string): string {
  for (const item of NAV_STRUCTURE) {
    if ("heading" in item) {
      for (const sub of item.items) {
        if (sub.path === location) return sub.label;
        if (sub.children) {
          const child = sub.children.find((c) => c.path === location);
          if (child) return child.label;
        }
      }
    } else {
      if (item.path === location) return item.label;
      if (item.children) {
        const child = item.children.find((c) => c.path === location);
        if (child) return child.label;
      }
    }
  }
  return "Dashboard";
}
