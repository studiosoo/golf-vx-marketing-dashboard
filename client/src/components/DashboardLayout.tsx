import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  Target,
  BarChart3,
  Instagram,
  Sparkles,
  Megaphone,
  Bot,
  TrendingUp,
  DollarSign,
  FileText,
  Flag,
  Sun,
  GraduationCap,
  Trophy,
  Gift,
  UserCheck,
  UserPlus,
  User2,
  Bell,
  Workflow,
  Mail,
  Globe,
  Newspaper,
  LayoutTemplate,
  Plug,
  Settings,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Search,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Navigation structure
// ─────────────────────────────────────────────

type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
};

type NavGroup = {
  heading: string; // section label (non-clickable)
  items: NavCollapsible[];
};

type NavCollapsible = {
  label: string;
  path: string;      // base path — used for active-matching
  icon: React.ElementType;
  children?: NavItem[];
};

const NAV_STRUCTURE: Array<NavCollapsible | NavGroup> = [
  // ── Overview (top-level, no heading) ──
  {
    label: "Overview",
    path: "/overview",
    icon: LayoutDashboard,
  },
  // ── Revenue (top-level, no heading) ──
  {
    label: "Revenue",
    path: "/revenue",
    icon: DollarSign,
  },

  // ── MARKETING & PROGRAMS ──
  {
    heading: "Marketing & Programs",
    items: [
      {
        label: "Campaigns",
        path: "/campaigns",
        icon: Megaphone,
      },
      {
        label: "Intelligence",
        path: "/intelligence",
        icon: Sparkles,
        children: [
          { label: "Actions", path: "/intelligence/ai-actions", icon: Bot },
          { label: "Performance", path: "/intelligence/performance", icon: TrendingUp },
          { label: "Research", path: "/intelligence/research", icon: Search },
          { label: "Reports", path: "/intelligence/reports", icon: FileText },
        ],
      },
      {
        label: "Programs",
        path: "/programs",
        icon: Flag,
        children: [
          { label: "Drive Day Clinics", path: "/programs/drive-day", icon: Sun },
          { label: "Winter Clinics", path: "/programs/winter-clinics", icon: Target },
          { label: "Junior Summer Camp", path: "/programs/summer-camp", icon: GraduationCap },
          { label: "Leagues", path: "/programs/leagues", icon: Trophy },
        ],
      },
      {
        label: "Promotions",
        path: "/promotions",
        icon: Gift,
        children: [
          { label: "Annual Membership Giveaway", path: "/promotions/annual-giveaway", icon: Gift },
          { label: "Meta Ads", path: "/campaigns/meta-ads", icon: BarChart3 },
        ],
      },
    ],
  },

  // ── AUDIENCE ──
  {
    heading: "Audience",
    items: [
      {
        label: "List",
        path: "/list",
        icon: Users,
        children: [
          { label: "Members", path: "/list/members", icon: UserCheck },
          { label: "Leads", path: "/list/leads", icon: UserPlus },
          { label: "Guests", path: "/list/guests", icon: User2 },
        ],
      },
      {
        label: "Communication",
        path: "/communication",
        icon: Mail,
        children: [
          { label: "Hub (Email & SMS)", path: "/communication", icon: MessageSquare },
          { label: "Email Campaigns", path: "/email-campaigns", icon: Mail },
          { label: "Email Marketing", path: "/communication/email-marketing", icon: Mail },
          { label: "Announcements", path: "/communication/announcements", icon: Bell },
          { label: "Automations", path: "/communication/automations", icon: Workflow },
          { label: "Drip Campaigns", path: "/communication/drip", icon: Mail },
        ],
      },
    ],
  },

  // ── WEBSITE ──
  {
    heading: "Website",
    items: [
      { label: "Site Control", path: "/website/site-control", icon: Globe },
      { label: "Funnels", path: "/funnels", icon: LayoutTemplate },
      { label: "Instagram", path: "/website/instagram", icon: Instagram },
      { label: "News / Blog", path: "/website/news", icon: Newspaper },
    ],
  },

  // ── SETTINGS ──
  {
    heading: "Settings",
    items: [
      { label: "Integrations", path: "/settings/integrations", icon: Plug },
      { label: "Account", path: "/settings/account", icon: Settings },
    ],
  },
];

// ─────────────────────────────────────────────
// Route → path mapping (old paths → new paths)
// for breadcrumb / active detection
// ─────────────────────────────────────────────

// Flatten all nav paths for active detection
function getAllPaths(structure: typeof NAV_STRUCTURE): string[] {
  const paths: string[] = [];
  for (const item of structure) {
    if ("heading" in item) {
      for (const sub of item.items) {
        paths.push(sub.path);
        if ("children" in sub && sub.children) {
          for (const child of sub.children) paths.push(child.path);
        }
      }
    } else {
      paths.push(item.path);
      if ("children" in item && item.children) {
        for (const child of item.children) paths.push(child.path);
      }
    }
  }
  return paths;
}

// Get label for current location
function getActiveLabel(location: string): string {
  for (const item of NAV_STRUCTURE) {
    if ("heading" in item) {
      for (const sub of item.items) {
        if (sub.path === location) return sub.label;
        if ("children" in sub && sub.children) {
          const child = sub.children.find((c) => c.path === location);
          if (child) return child.label;
        }
      }
    } else {
      if (item.path === location) return item.label;
      if ("children" in item && item.children) {
        const child = item.children.find((c) => c.path === location);
        if (child) return child.label;
      }
    }
  }
  return "Dashboard";
}

// ─────────────────────────────────────────────
// Sidebar width resizing
// ─────────────────────────────────────────────

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

// ─────────────────────────────────────────────
// Collapsible nav item component
// ─────────────────────────────────────────────

function CollapsibleNavItem({
  item,
  location,
  setLocation,
  isCollapsed,
}: {
  item: NavCollapsible;
  location: string;
  setLocation: (path: string) => void;
  isCollapsed: boolean;
}) {
  const hasChildren = "children" in item && item.children && item.children.length > 0;
  const isChildActive = hasChildren
    ? item.children!.some((c) => location === c.path || location.startsWith(c.path + "/"))
    : false;
  const isSelfActive = location === item.path || location.startsWith(item.path + "/");
  const isActive = isSelfActive || isChildActive;

  const [open, setOpen] = useState(() => isChildActive || isSelfActive);

  // Auto-expand if a child becomes active (e.g., direct navigation)
  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => setLocation(item.path)}
          tooltip={item.label}
          className="h-9 transition-all font-normal"
        >
          <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
          <span className="truncate">{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      {/* Parent button */}
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => {
          if (isCollapsed) {
            // When sidebar collapsed, navigate to first child
            setLocation(item.children![0].path);
          } else {
            setOpen((prev) => !prev);
          }
        }}
        tooltip={item.label}
        className="h-9 transition-all font-normal"
      >
        <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
        <span className="flex-1 truncate">{item.label}</span>
        {!isCollapsed && (
          open
            ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </SidebarMenuButton>

      {/* Children */}
      {!isCollapsed && open && (
        <div className="mt-0.5 ml-4 border-l border-border/50 pl-2 flex flex-col gap-0.5">
          {item.children!.map((child) => {
            const childActive = location === child.path || location.startsWith(child.path + "/");
            return (
              <button
                key={child.path}
                onClick={() => setLocation(child.path)}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors w-full text-left",
                  childActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <child.icon className={cn("h-3.5 w-3.5 shrink-0", childActive && "text-primary")} />
                <span className="truncate">{child.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </SidebarMenuItem>
  );
}

// ─────────────────────────────────────────────
// Main layout
// ─────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">Sign in to continue</h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

// ─────────────────────────────────────────────
// Inner layout content (needs sidebar context)
// ─────────────────────────────────────────────

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const activeLabel = getActiveLabel(location);

  // ── Resize logic ──
  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newW = e.clientX - left;
      if (newW >= MIN_WIDTH && newW <= MAX_WIDTH) setSidebarWidth(newW);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>

          {/* ── Header: logo + toggle ── */}
          <SidebarHeader className="h-14 justify-center border-b border-border/40">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <img
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663329642625/LwjZZbOogTHBMDfo.png"
                    alt="Golf VX"
                    className="h-8 w-auto object-contain shrink-0"
                  />
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* ── Navigation ── */}
          <SidebarContent className="gap-0 overflow-y-auto">
            <SidebarMenu className="px-2 py-2 gap-0.5">
              {NAV_STRUCTURE.map((item, idx) => {
                // Section group with heading
                if ("heading" in item) {
                  return (
                    <div key={item.heading} className={cn("", idx > 0 && "mt-3")}>
                      {!isCollapsed && (
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none mb-0.5">
                          {item.heading}
                        </p>
                      )}
                      {isCollapsed && idx > 0 && (
                        <div className="mx-2 my-1.5 h-px bg-border/40" />
                      )}
                      {item.items.map((subItem) => (
                        <CollapsibleNavItem
                          key={subItem.path}
                          item={subItem}
                          location={location}
                          setLocation={setLocation}
                          isCollapsed={isCollapsed}
                        />
                      ))}
                    </div>
                  );
                }

                // Top-level item (Overview)
                return (
                  <CollapsibleNavItem
                    key={item.path}
                    item={item}
                    location={location}
                    setLocation={setLocation}
                    isCollapsed={isCollapsed}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          {/* ── Footer: user account ── */}
          <SidebarFooter className="p-3 border-t border-border/40">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-none">
                        {user?.name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {user?.email || "—"}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* ── Resize handle ── */}
        <div
          className={cn(
            "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors",
            isCollapsed && "hidden"
          )}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      {/* ── Main content ── */}
      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="text-sm font-medium text-foreground">{activeLabel}</span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
