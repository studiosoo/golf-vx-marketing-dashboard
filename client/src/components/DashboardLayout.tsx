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
import { Lock, LogOut, PanelLeft, Settings } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./layout/SidebarNav";
import { getActiveLabel } from "./layout/navConfig";
import { appRoutes, DEFAULT_VENUE_SLUG, getVenueSlugFromPath } from "@/lib/routes";
import { MetaAdsStatusBadge } from "./MetaAdsStatusBadge";

const SIDEBAR_WIDTH_KEY = "sidebar-width-v2";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated: _isAuthenticated, loading: _isLoading, user: _user, logout } = useAuth();
  // DEV BYPASS — remove before deploy
  const DEV_BYPASS = import.meta.env.DEV;
  const isAuthenticated = DEV_BYPASS || _isAuthenticated;
  const isLoading = DEV_BYPASS ? false : _isLoading;
  const user = DEV_BYPASS ? { name: "Dev Preview", email: "dev@local" } : _user;
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const activeLabel = getActiveLabel(location);
  const currentVenueSlug = getVenueSlugFromPath(location) ?? DEFAULT_VENUE_SLUG;

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_WIDTH;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<number>(sidebarWidth);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Password login state
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setLoginError((data as any).error || "Invalid password");
      }
    } catch {
      setLoginError("Connection error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

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
        <div className="text-center space-y-5 max-w-sm w-full px-6">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663329642625/LwjZZbOogTHBMDfo.png"
            alt="Golf VX"
            className="h-10 w-auto mx-auto"
          />
          <p className="text-[#888888] text-sm">Sign in to access the dashboard</p>
          <form onSubmit={handlePasswordLogin} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
              <Input
                type="password"
                placeholder="Enter dashboard password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="pl-9 border-[#DEDEDA] focus:border-[#F2DD48] focus:ring-[#F2DD48] bg-white"
                autoFocus
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-500">{loginError}</p>
            )}
            <Button
              type="submit"
              disabled={loginLoading || !loginPassword}
              className="bg-[#F2DD48] text-[#222222] font-semibold hover:brightness-95 active:scale-95 transition-all w-full"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-xs text-[#BBBBBB]">
            Or{" "}
            <button
              type="button"
              className="underline hover:text-[#888888] transition-colors"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              sign in with Manus
            </button>
          </p>
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
      className="flex h-screen overflow-hidden bg-[#FAFAFA] max-w-full"
      style={{ fontFamily: "-apple-system, 'SF Pro Text', 'Inter', sans-serif" }}
    >
      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <div
          className={cn(
            "relative flex flex-col bg-white border-r border-[#DEDEDA] h-screen shrink-0 overflow-hidden",
            isCollapsed ? "w-14" : ""
          )}
          style={sidebarStyle}
        >
          <div className="flex items-center gap-2.5 px-3 h-14 border-b border-[#DEDEDA] shrink-0">
            <button
              onClick={() => setIsCollapsed((c) => !c)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F1F1EF] transition-colors shrink-0"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-4 w-4 text-[#888888]" />
            </button>
            {!isCollapsed && (
              <div className="min-w-0">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663329642625/LwjZZbOogTHBMDfo.png"
                  alt="Golf VX"
                  className="h-7 w-auto object-contain"
                />
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#AAAAAA] mt-0.5 truncate">
                  {currentVenueSlug.replace(/-/g, " ")}
                </p>
              </div>
            )}
          </div>

          <SidebarNav
            isCollapsed={isCollapsed}
            location={location}
            setLocation={setLocation}
          />

          {!isCollapsed && (
            <div className="px-3 py-2 border-t border-[#DEDEDA] shrink-0">
              <MetaAdsStatusBadge />
            </div>
          )}

          <div className="border-t border-[#DEDEDA] p-2 space-y-0.5 shrink-0">
            <button
              onClick={() => setLocation(appRoutes.accountProfile)}
              className={cn(
                "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-150 text-left",
                location.startsWith("/app/account") || location.startsWith("/app/admin")
                  ? "bg-[#F2DD48]/15 text-[#222222] font-semibold"
                  : "text-[#888888] hover:bg-[#F1F1EF] hover:text-[#222222]"
              )}
              title={isCollapsed ? "Settings" : undefined}
            >
              <Settings className="h-4 w-4 shrink-0 text-[#AAAAAA]" />
              {!isCollapsed && <span>Settings</span>}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[#F1F1EF] transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-7 w-7 border border-[#DEDEDA] shrink-0">
                    <AvatarFallback className="text-[11px] font-bold bg-[#F2DD48] text-[#222222]">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#222222] truncate leading-none">
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
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#F2DD48]/40 transition-colors"
              onMouseDown={() => setIsResizing(true)}
              style={{ zIndex: 50 }}
            />
          )}
        </div>
      )}

      {/* ── Mobile top bar ── */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white border-b border-[#DEDEDA] h-14 px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[#F1F1EF]"
          >
            <PanelLeft className="h-4 w-4 text-[#888888]" />
          </button>
          <span className="text-sm font-semibold text-[#222222]">{activeLabel}</span>
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
            className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-[#DEDEDA] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-3 h-14 border-b border-[#DEDEDA]">
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
            <div className="border-t border-[#DEDEDA] p-3">
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 text-sm text-[#E8453C] hover:text-red-600"
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
        style={{ maxWidth: '100%' }}
      >
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
