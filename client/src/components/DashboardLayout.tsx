import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  BarChart3,
  Instagram,
  Sparkles,
  Bot,
  TrendingUp,
  DollarSign,
  FileText,
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
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
};

type NavCollapsible = {
  label: string;
  path: string;
  icon: React.ElementType;
  children?: NavItem[];
};

type NavGroup = {
  heading: string;
  items: NavCollapsible[];
};

// ─────────────────────────────────────────────
// Navigation structure
// ─────────────────────────────────────────────
const NAV_STRUCTURE: Array<NavCollapsible | NavGroup> = [
  {
    label: "Command Center",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    heading: "Strategic",
    items: [
      { label: "Reports", path: "/intelligence/reports", icon: FileText },
    ],
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
          { label: "AI Workspace", path: "/workspace", icon: Bot },
          { label: "Action Plan", path: "/intelligence/action-plan", icon: Lightbulb },
        ],
      },
    ],
  },
  {
    heading: "Marketing",
    items: [
      { label: "Programs & Events", path: "/programs", icon: Flag },
      { label: "Advertising", path: "/advertising", icon: BarChart3 },
      { label: "Social & Content", path: "/website/instagram", icon: Instagram },
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
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getActiveLabel(location: string): string {
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

const SIDEBAR_WIDTH_KEY = "sidebar-width-v2";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

// ─────────────────────────────────────────────
// CollapsibleNavItem
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
  const hasChildren = !!item.children?.length;
  const isSelfActive =
    location === item.path ||
    (item.path !== "/" && location.startsWith(item.path + "/"));
  const isChildActive = hasChildren
    ? item.children!.some((c) => location === c.path)
    : false;
  const isActive = isSelfActive || isChildActive;
  const [open, setOpen] = useState(isActive || isChildActive);

  useEffect(() => {
    if (isChildActive || isSelfActive) setOpen(true);
  }, [location]);

  if (!hasChildren) {
    return (
      <button
        onClick={() => setLocation(item.path)}
        className={cn(
          "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 text-left group",
          isActive
            ? "bg-[#F5C72C]/15 text-[#111111] font-semibold"
            : "text-[#555555] hover:bg-[#F5F5F5] hover:text-[#111111]"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isActive ? "text-[#111111]" : "text-[#AAAAAA] group-hover:text-[#555555]"
          )}
        />
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C72C] shrink-0" />
            )}
          </>
        )}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => {
          if (isCollapsed) setLocation(item.children![0].path);
          else setOpen((o) => !o);
        }}
        className={cn(
          "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 text-left group",
          isActive || isChildActive
            ? "text-[#111111] font-semibold"
            : "text-[#555555] hover:bg-[#F5F5F5] hover:text-[#111111]"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0",
            isActive || isChildActive
              ? "text-[#111111]"
              : "text-[#AAAAAA] group-hover:text-[#555555]"
          )}
        />
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#AAAAAA] shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[#AAAAAA] shrink-0" />
            )}
          </>
        )}
      </button>
      {!isCollapsed && open && (
        <div className="ml-5 mt-0.5 border-l border-[#E8E8E8] pl-3 space-y-0.5">
          {item.children!.map((child) => {
            const childActive = location === child.path;
            return (
              <button
                key={child.path}
                onClick={() => setLocation(child.path)}
                className={cn(
                  "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150 text-left",
                  childActive
                    ? "text-[#111111] font-semibold bg-[#F5C72C]/10"
                    : "text-[#888888] hover:text-[#111111] hover:bg-[#F5F5F5]"
                )}
              >
                <child.icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    childActive ? "text-[#111111]" : "text-[#CCCCCC]"
                  )}
                />
                <span className="truncate">{child.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main layout
// ─────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading: isLoading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const activeLabel = getActiveLabel(location);

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_WIDTH;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<number>(sidebarWidth);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      resizeRef.current = newWidth;
      setSidebarWidth(newWidth);
    };
    const onUp = () => {
      setIsResizing(false);
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(resizeRef.current));
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  if (isLoading) return <DashboardLayoutSkeleton />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center space-y-5">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663329642625/LwjZZbOogTHBMDfo.png"
            alt="Golf VX"
            className="h-10 w-auto mx-auto"
          />
          <p className="text-[#888888] text-sm">Sign in to access the dashboard</p>
          <Button
            className="bg-[#F5C72C] text-[#111111] font-semibold hover:brightness-95 active:scale-95 transition-all px-8"
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const sidebarStyle: CSSProperties =
    !isMobile && !isCollapsed
      ? { width: sidebarWidth, minWidth: sidebarWidth }
      : {};

  const SidebarNav = ({
    onNavigate,
  }: {
    onNavigate?: (path: string) => void;
  }) => (
    <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      {NAV_STRUCTURE.map((item, idx) => {
        if ("heading" in item) {
          return (
            <div key={item.heading} className={cn(idx > 0 && "mt-4")}>
              {!isCollapsed && (
                <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA] select-none">
                  {item.heading}
                </p>
              )}
              {isCollapsed && idx > 0 && (
                <div className="mx-2 my-2 h-px bg-[#E0E0E0]" />
              )}
              <div className="space-y-0.5">
                {item.items.map((subItem) => (
                  <CollapsibleNavItem
                    key={subItem.path}
                    item={subItem}
                    location={location}
                    setLocation={(p) => {
                      setLocation(p);
                      onNavigate?.(p);
                    }}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            </div>
          );
        }
        return (
          <CollapsibleNavItem
            key={item.path}
            item={item}
            location={location}
            setLocation={(p) => {
              setLocation(p);
              onNavigate?.(p);
            }}
            isCollapsed={isCollapsed}
          />
        );
      })}
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#FAFAFA]"
      style={{
        fontFamily: "-apple-system, 'SF Pro Text', 'Inter', sans-serif",
      }}
    >
      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <div
          className={cn(
            "relative flex flex-col bg-white border-r border-[#E0E0E0] h-screen shrink-0 overflow-hidden",
            isCollapsed ? "w-14" : ""
          )}
          style={sidebarStyle}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-3 h-14 border-b border-[#E0E0E0] shrink-0">
            <button
              onClick={() => setIsCollapsed((c) => !c)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] transition-colors shrink-0"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-4 w-4 text-[#888888]" />
            </button>
            {!isCollapsed && (
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663329642625/LwjZZbOogTHBMDfo.png"
                alt="Golf VX"
                className="h-7 w-auto object-contain"
              />
            )}
          </div>

          <SidebarNav />

          {/* Footer */}
          <div className="border-t border-[#E0E0E0] p-2 space-y-0.5 shrink-0">
            <button
              onClick={() => setLocation("/settings/account")}
              className={cn(
                "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-150 text-left",
                location.startsWith("/settings")
                  ? "bg-[#F5C72C]/15 text-[#111111] font-semibold"
                  : "text-[#888888] hover:bg-[#F5F5F5] hover:text-[#111111]"
              )}
              title={isCollapsed ? "Settings" : undefined}
            >
              <Settings className="h-4 w-4 shrink-0 text-[#AAAAAA]" />
              {!isCollapsed && <span>Settings</span>}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[#F5F5F5] transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-7 w-7 border border-[#E0E0E0] shrink-0">
                    <AvatarFallback className="text-[11px] font-bold bg-[#F5C72C] text-[#111111]">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#111111] truncate leading-none">
                        {user?.name || "—"}
                      </p>
                      <p className="text-[11px] text-[#888888] truncate mt-0.5">
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
          </div>

          {/* Resize handle */}
          {!isCollapsed && (
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#F5C72C]/40 transition-colors"
              onMouseDown={() => setIsResizing(true)}
              style={{ zIndex: 50 }}
            />
          )}
        </div>
      )}

      {/* ── Mobile top bar ── */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white border-b border-[#E0E0E0] h-14 px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5]"
          >
            <PanelLeft className="h-4 w-4 text-[#888888]" />
          </button>
          <span className="text-sm font-semibold text-[#111111]">
            {activeLabel}
          </span>
          <div className="w-9" />
        </div>
      )}

      {/* ── Mobile drawer ── */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-[#E0E0E0] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-3 h-14 border-b border-[#E0E0E0]">
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663329642625/LwjZZbOogTHBMDfo.png"
                alt="Golf VX"
                className="h-7 w-auto object-contain"
              />
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-[#E0E0E0] p-3">
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div
        className={cn(
          "flex-1 min-w-0 flex flex-col overflow-hidden",
          isMobile && "mt-14"
        )}
      >
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
