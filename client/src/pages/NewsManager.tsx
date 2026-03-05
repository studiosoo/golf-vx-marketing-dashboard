import { useState } from "react";
import {
  Newspaper, Plus, Inbox, FileText, CheckCircle2,
  Clock, Building2, User, ExternalLink, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Source = "hq" | "studio_soo";
type Status = "inbox" | "in_progress" | "published";
type Category = "blog" | "announcement" | "promotion" | "program" | "event";

interface ContentItem {
  id: string;
  title: string;
  source: Source;
  category: Category;
  status: Status;
  notes: string;
  link?: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  blog:         { label: "Blog",         color: "#888888" },
  announcement: { label: "Announcement", color: "#007AFF" },
  promotion:    { label: "Promotion",    color: "#F5C72C" },
  program:      { label: "Program",      color: "#3DB855" },
  event:        { label: "Event",        color: "#E8453C" },
};

const STATUS_META: Record<Status, { label: string; icon: React.ElementType; color: string }> = {
  inbox:       { label: "Inbox",       icon: Inbox,        color: "#888888" },
  in_progress: { label: "In Progress", icon: Clock,        color: "#F5C72C" },
  published:   { label: "Published",   icon: CheckCircle2, color: "#3DB855" },
};

const TABS: { key: Status; label: string; icon: React.ElementType }[] = [
  { key: "inbox",       label: "HQ Requests",  icon: Inbox },
  { key: "in_progress", label: "In Progress",  icon: Clock },
  { key: "published",   label: "Published",    icon: CheckCircle2 },
];

// ─── Empty state seed data ─────────────────────────────────────────────────────
// These are examples — replace with DB-backed items when backend is connected.

const SEED_ITEMS: ContentItem[] = [
  {
    id: "1",
    title: "Spring Membership Drive Announcement",
    source: "hq",
    category: "announcement",
    status: "inbox",
    notes: "HQ wants a location-specific version for Arlington Heights. Deadline: end of month.",
    createdAt: "2026-03-01",
  },
  {
    id: "2",
    title: "Junior Summer Camp 2026 — Blog Post",
    source: "studio_soo",
    category: "blog",
    status: "in_progress",
    notes: "Draft in progress. Include camp dates, pricing, and instructor bios.",
    createdAt: "2026-02-20",
  },
  {
    id: "3",
    title: "Drive Day — March Recap",
    source: "studio_soo",
    category: "blog",
    status: "published",
    notes: "Published on the website. Promoted via Instagram.",
    link: "https://playgolfvx.com/blog",
    createdAt: "2026-02-15",
  },
];

// ─── Add Item Dialog ───────────────────────────────────────────────────────────

function AddItemDialog({ onAdd, onClose }: {
  onAdd: (item: ContentItem) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    source: "studio_soo" as Source,
    category: "blog" as Category,
    status: "inbox" as Status,
    notes: "",
    link: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      id: Date.now().toString(),
      title: form.title,
      source: form.source,
      category: form.category,
      status: form.status,
      notes: form.notes,
      link: form.link || undefined,
      createdAt: new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md sm:mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0]">
          <h2 className="text-[15px] font-bold text-[#111111]">Add Content Item</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5F5F5]">
            <X className="h-4 w-4 text-[#888888]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">
              Title *
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Spring Membership Blog Post"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#F5C72C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">
                Source
              </label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as Source })}
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] bg-white focus:outline-none"
              >
                <option value="studio_soo">Studio Soo</option>
                <option value="hq">HQ Request</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] bg-white focus:outline-none"
              >
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">
              Status
            </label>
            <div className="flex gap-2">
              {(["inbox", "in_progress", "published"] as Status[]).map((s) => {
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, status: s })}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[12px] font-semibold transition-all",
                      form.status === s
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-white text-[#888888] border-[#E0E0E0] hover:border-[#CCCCCC]"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Context, deadline, or instructions..."
              rows={3}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#F5C72C] resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide block mb-1.5">
              Link (optional)
            </label>
            <input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://..."
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#F5C72C]"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-[#E0E0E0] rounded-lg text-[13px] font-semibold text-[#888888] hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-10 bg-[#F5C72C] rounded-lg text-[13px] font-semibold text-[#111111] hover:brightness-95 active:scale-95 transition-all"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────

function ContentCard({
  item,
  onStatusChange,
  onDelete,
}: {
  item: ContentItem;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
}) {
  const cat = CATEGORY_META[item.category];
  const nextStatus: Record<Status, Status | null> = {
    inbox: "in_progress",
    in_progress: "published",
    published: null,
  };
  const next = nextStatus[item.status];
  const nextLabel = next === "in_progress" ? "Start" : next === "published" ? "Publish" : null;

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Source + Category */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <div className="flex items-center gap-1 h-5 px-2 rounded-full bg-[#F5F5F5]">
              {item.source === "hq"
                ? <Building2 className="h-3 w-3 text-[#888888]" />
                : <User className="h-3 w-3 text-[#888888]" />
              }
              <span className="text-[10px] font-semibold text-[#888888]">
                {item.source === "hq" ? "HQ" : "Studio Soo"}
              </span>
            </div>
            <span
              className="h-5 px-2 rounded-full text-[10px] font-semibold flex items-center"
              style={{ background: `${cat.color}18`, color: cat.color }}
            >
              {cat.label}
            </span>
            <span className="text-[10px] text-[#AAAAAA] ml-auto">{item.createdAt}</span>
          </div>

          {/* Title */}
          <p className="text-[14px] font-semibold text-[#111111] leading-snug mb-1.5">
            {item.title}
          </p>

          {/* Notes */}
          {item.notes && (
            <p className="text-[12px] text-[#888888] leading-relaxed">{item.notes}</p>
          )}

          {/* Link */}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-[11px] text-[#007AFF] hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View published
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {nextLabel && (
            <button
              onClick={() => onStatusChange(item.id, next!)}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-[#F5C72C] text-[#111111] text-[11px] font-semibold hover:brightness-95 transition-all whitespace-nowrap"
            >
              {nextLabel}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="h-7 px-2.5 rounded-lg border border-[#E0E0E0] text-[#AAAAAA] text-[11px] hover:border-red-200 hover:text-red-400 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Status }) {
  const configs = {
    inbox: {
      icon: Inbox,
      title: "No HQ requests",
      desc: "When HQ sends content requests (blog posts, announcements, promotions), add them here to track progress.",
    },
    in_progress: {
      icon: FileText,
      title: "Nothing in progress",
      desc: "Move items from HQ Requests here when you start working on them.",
    },
    published: {
      icon: CheckCircle2,
      title: "No published items",
      desc: "Completed content pieces will appear here once marked as published.",
    },
  };
  const { icon: Icon, title, desc } = configs[tab];
  return (
    <div className="py-14 text-center">
      <div className="h-12 w-12 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-3">
        <Icon className="h-6 w-6 text-[#CCCCCC]" />
      </div>
      <p className="text-[14px] font-semibold text-[#888888]">{title}</p>
      <p className="text-[12px] text-[#AAAAAA] mt-1 max-w-xs mx-auto">{desc}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NewsManager() {
  const [activeTab, setActiveTab] = useState<Status>("inbox");
  const [items, setItems] = useState<ContentItem[]>(SEED_ITEMS);
  const [showAdd, setShowAdd] = useState(false);

  const visibleItems = items.filter((i) => i.status === activeTab);

  const handleAdd = (item: ContentItem) => {
    setItems((prev) => [item, ...prev]);
  };
  const handleStatusChange = (id: string, status: Status) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  };
  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const counts: Record<Status, number> = {
    inbox:       items.filter((i) => i.status === "inbox").length,
    in_progress: items.filter((i) => i.status === "in_progress").length,
    published:   items.filter((i) => i.status === "published").length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Newspaper className="h-5 w-5 text-[#F5C72C]" />
          <div>
            <h1 className="text-lg font-semibold text-[#111111]">News & Content Manager</h1>
            <p className="text-xs text-[#888888]">Track HQ requests, content drafts, and published pieces</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 h-9 px-4 bg-[#F5C72C] rounded-lg text-[13px] font-semibold text-[#111111] hover:brightness-95 active:scale-95 transition-all shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* Notice: local state only */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FFFBEB] border border-[#F5C72C]/30">
        <Building2 className="h-4 w-4 text-[#8B6E00] mt-0.5 shrink-0" />
        <p className="text-[12px] text-[#8B6E00] leading-relaxed">
          Items are stored locally (session only). Backend DB integration needed to persist across devices.
          Use this to track HQ content requests and your own content queue.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E0E0E0]">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-1.5 px-4 h-11 text-[13px] font-semibold transition-all border-b-2 -mb-px",
                isActive
                  ? "text-[#111111] border-[#F5C72C]"
                  : "text-[#888888] border-transparent hover:text-[#111111]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              {counts[key] > 0 && (
                <span className={cn(
                  "text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center",
                  isActive ? "bg-[#F5C72C] text-[#111111]" : "bg-[#F0F0F0] text-[#888888]"
                )}>
                  {counts[key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content list */}
      <div className="space-y-3">
        {visibleItems.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          visibleItems.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Add dialog */}
      {showAdd && <AddItemDialog onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
