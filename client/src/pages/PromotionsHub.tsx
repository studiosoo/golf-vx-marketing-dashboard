import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DEFAULT_VENUE_SLUG, appRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  Tag, Plus, QrCode, Users, BarChart2, ExternalLink,
  CheckCircle2, Clock, XCircle, Loader2, Copy, Check,
  ChevronRight, Zap, X,
} from "lucide-react";

// ─── Types & constants ────────────────────────────────────────────────────────

const OFFER_LABELS: Record<string, string> = {
  free_session: "Free Session",
  discount: "Discount",
  gift_card: "Gift Card",
  trial: "Trial",
  event: "Event",
  other: "Other",
};

const STATUS_META = {
  active:   { label: "Active",   color: "#3DB855", bg: "#3DB85518" },
  inactive: { label: "Inactive", color: "#888888", bg: "#88888818" },
  expired:  { label: "Expired",  color: "#AAAAAA", bg: "#AAAAAA18" },
};

// ─── Create promo dialog ──────────────────────────────────────────────────────

function CreatePromoDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    offerType: "trial" as string,
    description: "",
    enchargeTag: "Promo",
    createSqrLink: true,
    expiresAt: "",
  });

  const createMutation = trpc.promos.create.useMutation({
    onSuccess: () => { onCreated(); onClose(); },
  });

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);

  const handleTitleChange = (v: string) => {
    setForm((f) => ({ ...f, title: v, slug: autoSlug(v) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: form.title,
      slug: form.slug,
      offerType: form.offerType as any,
      description: form.description || undefined,
      enchargeTag: form.enchargeTag,
      createSqrLink: form.createSqrLink,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md sm:mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0]">
          <h2 className="text-[15px] font-bold text-[#111111]">New Promo</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5F5F5]">
            <X className="h-4 w-4 text-[#888888]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">Offer Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. 1 Hour Free — Golf Show"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#F5C72C]"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">
              URL Slug * <span className="normal-case font-normal text-[#AAAAAA]">(auto-generated, editable)</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#AAAAAA] shrink-0">/p/</span>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                placeholder="1-hour-free-golf-show"
                className="flex-1 border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#F5C72C]"
              />
            </div>
          </div>

          {/* Offer type */}
          <div>
            <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">Offer Type</label>
            <select
              value={form.offerType}
              onChange={(e) => setForm({ ...form, offerType: e.target.value })}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] bg-white focus:outline-none"
            >
              {Object.entries(OFFER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does this offer include? Any conditions?"
              rows={2}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#F5C72C] resize-none"
            />
          </div>

          {/* Encharge tag */}
          <div>
            <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">Encharge Tag</label>
            <input
              value={form.enchargeTag}
              onChange={(e) => setForm({ ...form, enchargeTag: e.target.value })}
              placeholder="Promo"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#F5C72C]"
            />
            <p className="text-[11px] text-[#AAAAAA] mt-1">Applied to every contact who claims this offer. Also adds <code className="bg-[#F5F5F5] px-1 rounded">promo-{form.slug || "slug"}</code></p>
          </div>

          {/* Expiry */}
          <div>
            <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">Expires On (optional)</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] bg-white focus:outline-none focus:ring-1 focus:ring-[#F5C72C]"
            />
          </div>

          {/* SQR toggle */}
          <label className="flex items-center gap-3 cursor-pointer py-2 px-3 rounded-lg border border-[#E0E0E0] hover:bg-[#F9F9F9]">
            <input
              type="checkbox"
              checked={form.createSqrLink}
              onChange={(e) => setForm({ ...form, createSqrLink: e.target.checked })}
              className="accent-[#F5C72C]"
            />
            <div>
              <p className="text-[13px] font-semibold text-[#111111]">Create SQR short link</p>
              <p className="text-[11px] text-[#888888]">sqr.co/{form.slug || "slug"} — tracks scan count & analytics</p>
            </div>
          </label>

          {/* Error */}
          {createMutation.isError && (
            <p className="text-[12px] text-red-500">{createMutation.error?.message}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 border border-[#E0E0E0] rounded-lg text-[13px] font-semibold text-[#888888] hover:bg-[#F5F5F5]">Cancel</button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 h-10 bg-[#F5C72C] rounded-lg text-[13px] font-semibold text-[#111111] hover:brightness-95 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Promo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── QR Viewer ────────────────────────────────────────────────────────────────

function QRViewer({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}&margin=10`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 shadow-2xl w-full max-w-xs mx-4 text-center">
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[#F5F5F5]">
          <X className="h-4 w-4 text-[#888888]" />
        </button>
        <p className="text-[13px] font-bold text-[#111111] mb-4">{title}</p>
        <img src={qrSrc} alt="QR Code" className="mx-auto rounded-lg" width={200} height={200} />
        <div className="mt-4 flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2">
          <span className="flex-1 text-[11px] text-[#666666] truncate">{url}</span>
          <button onClick={copy} className="shrink-0 text-[#888888] hover:text-[#111111]">
            {copied ? <Check className="h-3.5 w-3.5 text-[#3DB855]" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#007AFF] hover:underline">
          <ExternalLink className="h-3 w-3" />
          Open landing page
        </a>
      </div>
    </div>
  );
}

// ─── Promo card ───────────────────────────────────────────────────────────────

function PromoCard({
  promo,
  onSelect,
  onToggleStatus,
  onQR,
}: {
  promo: any;
  onSelect: () => void;
  onToggleStatus: () => void;
  onQR: () => void;
}) {
  const sm = STATUS_META[promo.status as keyof typeof STATUS_META] ?? STATUS_META.inactive;
  const expiry = promo.expiresAt
    ? new Date(promo.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Status + type */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="h-5 px-2 rounded-full text-[10px] font-semibold flex items-center" style={{ background: sm.bg, color: sm.color }}>
              {sm.label}
            </span>
            <span className="text-[10px] text-[#888888] bg-[#F5F5F5] px-2 h-5 rounded-full flex items-center">
              {OFFER_LABELS[promo.offerType] ?? "Other"}
            </span>
            {expiry && <span className="text-[10px] text-[#AAAAAA] ml-auto">Expires {expiry}</span>}
          </div>

          <button onClick={onSelect} className="text-left">
            <p className="text-[14px] font-semibold text-[#111111] leading-snug hover:underline">{promo.title}</p>
            <p className="text-[11px] text-[#AAAAAA] mt-0.5">/p/{promo.slug}</p>
          </button>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-3">
            <button onClick={onSelect} className="flex items-center gap-1 text-[12px] font-semibold text-[#888888] hover:text-[#111111]">
              <Users className="h-3 w-3" />
              {promo.leadCount} leads
            </button>
            {promo.sqrShortUrl && (
              <a href={`https://sqr.co/${promo.sqrLinkSlug || promo.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] text-[#007AFF] hover:underline">
                <BarChart2 className="h-3 w-3" />
                SQR stats
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={onQR}
            className="h-7 px-2.5 rounded-lg bg-[#111111] text-white text-[11px] font-semibold flex items-center gap-1 hover:bg-[#333333] transition-colors"
          >
            <QrCode className="h-3 w-3" />QR
          </button>
          <button
            onClick={onToggleStatus}
            className={cn(
              "h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-colors",
              promo.status === "active"
                ? "border border-[#E0E0E0] text-[#888888] hover:border-red-200 hover:text-red-400"
                : "bg-[#F5C72C] text-[#111111] hover:brightness-95"
            )}
          >
            {promo.status === "active" ? "Pause" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Leads panel ─────────────────────────────────────────────────────────────

function LeadsPanel({ promoId, promoTitle, onClose }: { promoId: number; promoTitle: string; onClose: () => void }) {
  const { data: leads = [], isLoading } = trpc.promos.getLeads.useQuery({ promoId });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg sm:mx-4 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0] shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-[#111111]">Leads — {promoTitle}</h2>
            <p className="text-[12px] text-[#888888]">{leads.length} total</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5F5F5]">
            <X className="h-4 w-4 text-[#888888]" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#F5C72C]" /></div>
          ) : leads.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-8 w-8 text-[#CCCCCC] mx-auto mb-3" />
              <p className="text-[13px] font-semibold text-[#888888]">No leads yet</p>
              <p className="text-[11px] text-[#AAAAAA] mt-1">Share the QR code to start collecting</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E0E0E0]">
                  {["Name", "Email", "Phone", "Synced", "Date"].map((h) => (
                    <th key={h} className="text-[11px] text-[#AAAAAA] font-normal px-4 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3 text-[13px] font-semibold text-[#111111] whitespace-nowrap">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#888888]">{lead.email}</td>
                    <td className="px-4 py-3 text-[12px] text-[#888888]">{lead.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      {lead.enchargeStatus === "synced"
                        ? <CheckCircle2 className="h-4 w-4 text-[#3DB855]" />
                        : lead.enchargeStatus === "failed"
                        ? <XCircle className="h-4 w-4 text-red-400" />
                        : <Clock className="h-4 w-4 text-[#F5C72C]" />}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#AAAAAA]">
                      {new Date(lead.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SQR links panel ──────────────────────────────────────────────────────────

function SqrLinksPanel() {
  const { data: links = [], isLoading } = trpc.promos.getSqrLinks.useQuery(undefined, {
    retry: false,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#F5C72C]" /></div>;
  }

  if (links.length === 0) {
    return (
      <div className="py-12 text-center">
        <Zap className="h-8 w-8 text-[#CCCCCC] mx-auto mb-3" />
        <p className="text-[13px] font-semibold text-[#888888]">No SQR links for active promos</p>
        <p className="text-[11px] text-[#AAAAAA] mt-1">Create a promo with "Create SQR short link" enabled to see it here</p>
      </div>
    );
  }

  const totalScans = links.reduce((s: number, l: any) => s + (l.clicks ?? l.visits ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-3">
          <p className="text-[10px] text-[#AAAAAA] uppercase tracking-wide mb-1">Golf VX Links</p>
          <p className="text-[22px] font-bold text-[#111111]">{links.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-3">
          <p className="text-[10px] text-[#AAAAAA] uppercase tracking-wide mb-1">Total Scans</p>
          <p className="text-[22px] font-bold text-[#F5C72C]">{totalScans}</p>
        </div>
      </div>

      {/* Link list */}
      <div className="space-y-2">
        {links.map((link: any) => {
          const clicks = link.clicks ?? link.visits ?? 0;
          const alias = link.alias ?? link.short_url?.replace(/.*\//, "") ?? "—";
          const dest = link.url ?? link.location_url ?? "";
          const promo = link.promo;
          const sm = promo ? STATUS_META[promo.status as keyof typeof STATUS_META] ?? STATUS_META.inactive : null;

          return (
            <div key={link.id} className="bg-white rounded-xl border border-[#E0E0E0] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Promo title */}
                  {promo && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[11px] font-semibold text-[#111111]">{promo.title}</span>
                      {sm && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: sm.bg, color: sm.color }}>
                          {sm.label}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Short URL */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://sqr.co/${alias}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
                    >
                      sqr.co/{alias}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {/* Destination URL */}
                  <p className="text-[11px] text-[#AAAAAA] truncate mt-0.5">{dest}</p>
                </div>

                {/* Scan count */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <BarChart2 className="h-3.5 w-3.5 text-[#F5C72C]" />
                    <span className="text-[16px] font-bold text-[#111111]">{clicks}</span>
                  </div>
                  <p className="text-[10px] text-[#AAAAAA]">scans</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PromotionsHub() {
  const venueSlug = DEFAULT_VENUE_SLUG;
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"promos" | "sqr">("promos");
  const [showCreate, setShowCreate] = useState(false);
  const [qrPromo, setQrPromo] = useState<{ url: string; title: string } | null>(null);
  const [leadsPromo, setLeadsPromo] = useState<{ id: number; title: string } | null>(null);

  const utils = trpc.useUtils();
  const { data: promos = [], isLoading } = trpc.promos.list.useQuery();

  const toggleStatusMutation = trpc.promos.updateStatus.useMutation({
    onSuccess: () => utils.promos.list.invalidate(),
  });

  const activeCount = promos.filter((p) => p.status === "active").length;
  const totalLeads = promos.reduce((s, p) => s + (p.leadCount ?? 0), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Tag className="h-5 w-5 text-[#F5C72C]" />
          <div>
            <h1 className="text-lg font-semibold text-[#111111]">In-Store Promotions</h1>
            <p className="text-xs text-[#888888]">QR-based capture forms for walk-in customers · syncs to Encharge</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 h-9 px-4 bg-[#F5C72C] rounded-lg text-[13px] font-semibold text-[#111111] hover:brightness-95 active:scale-95 transition-all shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Promo
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active promos", value: activeCount, icon: CheckCircle2, color: "#3DB855" },
          { label: "Total leads", value: totalLeads, icon: Users, color: "#F5C72C" },
          { label: "SQR links", value: "→ tab", icon: Zap, color: "#007AFF" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E0E0E0] px-3 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-3.5 w-3.5" style={{ color }} />
              <span className="text-[10px] text-[#AAAAAA] font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-[22px] font-bold text-[#111111]">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E0E0E0]">
        {([
          { key: "promos", label: "Promos" },
          { key: "sqr", label: "SQR Links" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 h-11 text-[13px] font-semibold transition-all border-b-2 -mb-px",
              tab === key ? "text-[#111111] border-[#F5C72C]" : "text-[#888888] border-transparent hover:text-[#111111]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "promos" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#F5C72C]" />
              <span className="text-[13px] text-[#888888]">Loading…</span>
            </div>
          ) : promos.length === 0 ? (
            <div className="py-14 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-3">
                <Tag className="h-6 w-6 text-[#CCCCCC]" />
              </div>
              <p className="text-[14px] font-semibold text-[#888888]">No promotions yet</p>
              <p className="text-[12px] text-[#AAAAAA] mt-1">Create your first promo to get a QR code + capture form</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-1.5 h-9 px-4 bg-[#F5C72C] rounded-lg text-[13px] font-semibold text-[#111111] hover:brightness-95 mx-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                New Promo
              </button>
            </div>
          ) : (
            promos.map((promo) => (
              <PromoCard
                key={promo.id}
                promo={promo}
                onSelect={() => setLocation(appRoutes.venue(venueSlug).operations.promotionDetail(promo.id))}
                onToggleStatus={() =>
                  toggleStatusMutation.mutate({
                    id: promo.id,
                    status: promo.status === "active" ? "inactive" : "active",
                  })
                }
                onQR={() => setQrPromo({ url: promo.landingUrl, title: promo.title })}
              />
            ))
          )}
        </div>
      )}

      {tab === "sqr" && <SqrLinksPanel />}

      {/* Dialogs */}
      {showCreate && (
        <CreatePromoDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => utils.promos.list.invalidate()}
        />
      )}
      {qrPromo && <QRViewer url={qrPromo.url} title={qrPromo.title} onClose={() => setQrPromo(null)} />}
      {leadsPromo && <LeadsPanel promoId={leadsPromo.id} promoTitle={leadsPromo.title} onClose={() => setLeadsPromo(null)} />}
    </div>
  );
}
