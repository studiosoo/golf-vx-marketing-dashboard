import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, Target, Mail, Brain, Menu, X, ChevronRight,
  BarChart3, DollarSign, Megaphone, Settings, Globe, Zap, Trophy,
  Calendar, TrendingUp, Eye, LogIn, Bot, Newspaper, Droplets,
  UserCheck, UserPlus, Lock,
} from "lucide-react";
import { GuestModeProvider } from "@/contexts/GuestModeContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const guestNavItems: NavItem[] = [
  { href: "/guest", label: "Dashboard", icon: <LayoutDashboard size={18} />, section: "Core" },
  { href: "/guest/overview", label: "Overview", icon: <BarChart3 size={18} />, section: "Core" },
  { href: "/guest/performance", label: "Performance", icon: <TrendingUp size={18} />, section: "Core" },
  { href: "/guest/revenue", label: "Revenue", icon: <DollarSign size={18} />, section: "Core" },
  { href: "/guest/intelligence", label: "Marketing Intelligence", icon: <Brain size={18} />, section: "Intelligence" },
  { href: "/guest/intelligence/ai-actions", label: "AI Actions", icon: <Bot size={18} />, section: "Intelligence" },
  { href: "/guest/intelligence/news", label: "News Manager", icon: <Newspaper size={18} />, section: "Intelligence" },
  { href: "/guest/members", label: "Members", icon: <Users size={18} />, section: "Members" },
  { href: "/guest/guests", label: "Guests", icon: <UserCheck size={18} />, section: "Members" },
  { href: "/guest/leads", label: "Leads", icon: <UserPlus size={18} />, section: "Members" },
  { href: "/guest/campaigns", label: "Campaigns", icon: <Target size={18} />, section: "Campaigns" },
  { href: "/guest/campaigns/meta-ads", label: "Meta Ads", icon: <Zap size={18} />, section: "Campaigns" },
  { href: "/guest/campaigns/email", label: "Email Campaigns", icon: <Mail size={18} />, section: "Campaigns" },
  { href: "/guest/campaigns/funnels", label: "Funnels", icon: <Target size={18} />, section: "Campaigns" },
  { href: "/guest/campaigns/automations", label: "Automations", icon: <Settings size={18} />, section: "Campaigns" },
  { href: "/guest/campaigns/drip", label: "Drip Campaigns", icon: <Droplets size={18} />, section: "Campaigns" },
  { href: "/guest/announcements", label: "Announcements", icon: <Megaphone size={18} />, section: "Campaigns" },
  { href: "/guest/programs", label: "Programs", icon: <Calendar size={18} />, section: "Programs" },
  { href: "/guest/programs/leagues", label: "Leagues", icon: <Trophy size={18} />, section: "Programs" },
  { href: "/guest/programs/events", label: "Private Events", icon: <Calendar size={18} />, section: "Programs" },
  { href: "/guest/site-control", label: "Site Control", icon: <Globe size={18} />, section: "Tools" },
  { href: "/guest/integrations", label: "Integrations", icon: <Settings size={18} />, section: "Tools" },
  { href: "/guest/settings", label: "Account Settings", icon: <Settings size={18} />, section: "Tools" },
];

interface GuestDashboardLayoutProps {
  children: React.ReactNode;
}

export default function GuestDashboardLayout({ children }: GuestDashboardLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Group nav items by section
  const sections = guestNavItems.reduce((acc, item) => {
    const section = item.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <GuestModeProvider isGuest={true}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Guest Preview Banner */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-black text-center py-1.5 text-xs font-semibold flex items-center justify-center gap-2">
          <Eye size={13} />
          <span>Guest Preview Mode — Read Only. Action buttons are disabled.</span>
          <a
            href="/"
            className="ml-3 underline font-bold hover:text-black/70 flex items-center gap-1"
          >
            <LogIn size={12} />
            Login for full access
          </a>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:relative inset-y-0 left-0 z-30 w-64 flex flex-col bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out mt-8 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">VX</span>
              </div>
              <div>
                <div className="text-sm font-bold text-sidebar-foreground leading-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  GOLF VX
                </div>
                <div className="text-xs text-muted-foreground leading-tight">Guest Preview</div>
              </div>
            </div>
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {Object.entries(sections).map(([section, items]) => (
              <div key={section} className="mb-2">
                <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section}
                </div>
                {items.map((item) => {
                  const isActive = location === item.href || (item.href !== "/guest" && location.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {isActive && <ChevronRight size={14} className="ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Login CTA */}
          <div className="px-3 py-4 border-t border-sidebar-border">
            <div className="bg-sidebar-accent rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock size={12} />
                <span>Actions disabled in guest mode</span>
              </div>
              <a
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full justify-center"
              >
                <LogIn size={14} />
                Login for Full Access
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden mt-8">
          {/* Top bar (mobile) */}
          <header className="flex items-center gap-4 px-4 py-3 border-b border-border bg-card lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">VX</span>
              </div>
              <span className="text-sm font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>GOLF VX</span>
            </div>
            <span className="ml-auto text-xs text-yellow-500 font-semibold flex items-center gap-1">
              <Eye size={12} /> Guest
            </span>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </GuestModeProvider>
  );
}
