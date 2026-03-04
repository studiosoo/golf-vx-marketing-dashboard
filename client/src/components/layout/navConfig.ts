import {
  LayoutDashboard,
  BarChart3,
  Instagram,
  Sparkles,
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
  Lightbulb,
  Globe,
  Newspaper,
  Megaphone,
  Gift,
  Target,
  LineChart,
  Wrench,
  Users,
  ClipboardList,
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
      {
        label: "AI Analysis",
        path: "/intelligence",
        icon: Sparkles,
        children: [
          { label: "Actions", path: "/intelligence/ai-actions", icon: Zap },
          { label: "Market Research", path: "/intelligence/market-research", icon: Search },
        ],
      },
      { label: "AI Workspace", path: "/workspace", icon: Bot },
    ],
  },
  {
    heading: "Marketing",
    items: [
      { label: "Programs & Events", path: "/programs", icon: Flag },
      { label: "Advertising", path: "/advertising", icon: BarChart3 },
      { label: "Promotions", path: "/promotions/annual-giveaway", icon: Gift },
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
    heading: "Website",
    items: [
      { label: "Site Control", path: "/website/site-control", icon: Globe },
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
