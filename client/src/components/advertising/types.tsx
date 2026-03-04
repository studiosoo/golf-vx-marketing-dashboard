import { Instagram, Youtube, Facebook, Globe, School, Trophy, Heart, Building2, Music, Star, Clock, AlertCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

// ─── Domain Types ──────────────────────────────────────────────────────────
export type InfluencerStatus = "negotiating" | "contracted" | "in_progress" | "completed" | "cancelled";
export type OutreachStatus = "received" | "under_review" | "approved" | "rejected" | "fulfilled" | "follow_up";
export type OutreachRequestType = "cash_donation" | "gift_card" | "product_donation" | "service_donation" | "sponsorship" | "partnership" | "networking";

// ─── Config Maps ───────────────────────────────────────────────────────────
export const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram size={14} />,
  youtube: <Youtube size={14} />,
  facebook: <Facebook size={14} />,
  tiktok: <span className="text-xs font-bold">TT</span>,
  other: <Globe size={14} />,
};

export const INFLUENCER_STATUS_CONFIG: Record<InfluencerStatus, { label: string; color: string }> = {
  negotiating: { label: "Negotiating", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  contracted: { label: "Contracted", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  in_progress: { label: "In Progress", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export const OUTREACH_STATUS_CONFIG: Record<OutreachStatus, { label: string; color: string; icon: React.ReactNode }> = {
  received: { label: "Received", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Clock size={12} /> },
  under_review: { label: "Under Review", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <AlertCircle size={12} /> },
  approved: { label: "Approved", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle2 size={12} /> },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle size={12} /> },
  fulfilled: { label: "Fulfilled", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <Star size={12} /> },
  follow_up: { label: "Follow Up", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <RefreshCw size={12} /> },
};

export const ORG_TYPE_ICONS: Record<string, React.ReactNode> = {
  school_pta: <School size={14} />,
  school_sports: <Trophy size={14} />,
  nonprofit: <Heart size={14} />,
  civic: <Building2 size={14} />,
  arts_culture: <Music size={14} />,
  sports_league: <Trophy size={14} />,
  religious: <Star size={14} />,
  business: <Building2 size={14} />,
  other: <Globe size={14} />,
};

export const REQUEST_TYPE_LABELS: Record<OutreachRequestType, string> = {
  cash_donation: "Cash Donation",
  gift_card: "Gift Card",
  product_donation: "Product/Item",
  service_donation: "Free Service",
  sponsorship: "Sponsorship",
  partnership: "Partnership",
  networking: "Networking",
};

export const PRINT_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  negotiating: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export const EVENT_STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-muted/50 text-muted-foreground border-border",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  trade_show: "Trade Show",
  expo: "Expo",
  sponsorship: "Sponsorship",
  community_event: "Community Event",
  golf_tournament: "Golf Tournament",
  other: "Other",
};

// ─── Formatter Helpers ─────────────────────────────────────────────────────
export function fmt$(v: unknown): string {
  const n = parseFloat(String(v || 0));
  return n === 0 ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmtNum(v: unknown): string {
  const n = parseInt(String(v || 0));
  return n === 0 ? "—" : n.toLocaleString();
}

export function getContractProgress(
  startDate: string | null,
  endDate: string | null,
  months: number
): { elapsed: number; remaining: number; pct: number } {
  if (!startDate) return { elapsed: 0, remaining: months, pct: 0 };
  const start = new Date(startDate);
  const now = new Date();
  const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const remaining = Math.max(0, months - elapsed);
  const pct = Math.min(100, Math.round((elapsed / months) * 100));
  return { elapsed, remaining, pct };
}
