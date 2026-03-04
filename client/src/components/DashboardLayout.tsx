import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LogOut, PanelLeft, Settings } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./layout/SidebarNav";
import { getActiveLabel } from "./layout/navConfig";

const SIDEBAR_WIDTH_KEY = "sidebar-width-v2";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

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

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#FAFAFA]"
      style={{ fontFamily: "-apple-system, 'SF Pro Text', 'Inter', sans-serif" }}
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

          <SidebarNav
            isCollapsed={isCollapsed}
            location={location}
            setLocation={setLocation}
          />

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
          <span className="text-sm font-semibold text-[#111111]">{activeLabel}</span>
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
            <SidebarNav
              isCollapsed={false}
              location={location}
              setLocation={setLocation}
              onNavigate={() => setMobileOpen(false)}
            />
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
