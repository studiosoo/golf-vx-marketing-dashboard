import { useState, useMemo, useRef, useCallback } from "react";
import { Plus, X, ChevronDown, ChevronRight, AlertTriangle, RefreshCw, ExternalLink, CheckCircle2, Circle, Sparkles, Upload, Copy, Check, Wand2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

// ─── Production-linked Asana project names (mirrors server/routers/asana.ts) ───────────
const PRODUCTION_PROJECTS: Record<string, string> = {
  "PBGA Programs":               "1212078499567959",
  "Trial Conversion Campaign":   "1212077269419925",
  "Membership Acquisition":      "1212077289242708",
  "Member Retention":            "1211736985531595",
  "Corporate Events & B2B":      "1212077289242724",
  "Venue Display / Local Media": "1211917285471271",
  "AH Social Media Content":     "1211673464711096",
  "Stroll Magazine":             "1211912937095581",
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const TEXT_P  = "#222222";
const TEXT_S  = "#6F6F6B";
const TEXT_M  = "#A8A8A3";
const BORDER  = "#DEDEDA";
const BG_S    = "#F1F1EF";
const YELLOW  = "#F2DD48";
const GRN     = "#72B84A";
const ORG     = "#D89A3C";

// ─── Constants ────────────────────────────────────────────────────────────────
const RETAINER_MONTHLY = 6000;

const ACTIVITY_TYPES = [
  { value: "strategy",   label: "Strategy & Planning",     rate: 150 },
  { value: "content",    label: "Content Creation",        rate: 85  },
  { value: "paid_media", label: "Paid Media Management",   rate: 100 },
  { value: "design",     label: "Design & Creative",       rate: 85  },
  { value: "analytics",  label: "Analytics & Reporting",   rate: 100 },
  { value: "social",     label: "Social Media Mgmt",       rate: 65  },
  { value: "email",      label: "Email Marketing",         rate: 75  },
  { value: "technical",  label: "Technical Setup",         rate: 100 },
  { value: "admin",      label: "Admin & Coordination",    rate: 45  },
] as const;

const COMPLEXITY_TIERS = [
  { value: "standard",  label: "Standard",  multiplier: 1.0  },
  { value: "complex",   label: "Complex",   multiplier: 1.25 },
  { value: "strategic", label: "Strategic", multiplier: 1.5  },
] as const;

const DELIVERABLE_TYPES = [
  "Social Post", "Email Campaign", "Ad Creative", "Landing Page",
  "Report / Deck", "Video / Reel", "Graphic / Design", "Strategy Document",
  "Copy / Script", "Other",
];

const TEAM_ROLES = [
  "Studio Soo — Strategy",
  "Studio Soo — Content",
  "Studio Soo — Design",
  "Studio Soo — Paid Media",
  "Studio Soo — Analytics",
  "Freelancer",
];

const LINKED_ITEMS = [
  "Trial Conversion", "Membership Acquisition", "Member Retention", "B2B & Events",
  "Annual Membership Giveaway", "Junior Summer Camp", "PBGA Winter Clinic", "Sunday Clinic",
  "Chicago Golf Show", "General / Agency",
];

// ─── Types ────────────────────────────────────────────────────────────────────
type EffortEntry = {
  id: string;
  date: string;
  role: string;
  activityType: string;
  linked: string;
  hours: number;
  complexity: string;
  asanaTaskId?: string;
  notes?: string;
  isHighTouch?: boolean;
};

type DeliverableEntry = {
  id: string;
  name: string;
  type: string;
  linked: string;
  date: string;
  reusable: boolean;
  amortize: boolean;
  asanaProjectId?: string;
  notes?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2); }

function calcEntryValue(entry: EffortEntry): number {
  const act = ACTIVITY_TYPES.find(a => a.value === entry.activityType);
  const tier = COMPLEXITY_TIERS.find(c => c.value === entry.complexity);
  return entry.hours * (act?.rate ?? 75) * (tier?.multiplier ?? 1.0);
}

function fmtCurrency(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function currentMonthLabel() {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Add Effort Form ──────────────────────────────────────────────────────────
function AddEffortForm({ onAdd }: { onAdd: (e: EffortEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: todayStr(), role: TEAM_ROLES[0], activityType: "strategy",
    linked: LINKED_ITEMS[0], hours: "", complexity: "standard",
    asanaTaskId: "", notes: "", isHighTouch: false,
  });

  function handleSubmit() {
    const hrs = parseFloat(form.hours);
    if (!hrs || hrs <= 0) return;
    onAdd({ ...form, id: genId(), hours: hrs, asanaTaskId: form.asanaTaskId || undefined, notes: form.notes || undefined });
    setForm({ date: todayStr(), role: TEAM_ROLES[0], activityType: "strategy", linked: LINKED_ITEMS[0], hours: "", complexity: "standard", asanaTaskId: "", notes: "", isHighTouch: false });
    setOpen(false);
  }

  const F = (f: keyof typeof form) => ({ value: String(form[f]), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [f]: e.target.value })) });

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#F1F1EF]"
        style={{ borderColor: BORDER, color: TEXT_P }}
      >
        <Plus size={14} />
        Add Entry
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>

      {open && (
        <div className="mt-2 p-4 rounded-xl border" style={{ borderColor: BORDER, background: BG_S }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Date</span>
              <input type="date" {...F("date")} className="input-field" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Team Member / Role</span>
              <select {...F("role")} className="input-field">
                {TEAM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Activity Type</span>
              <select {...F("activityType")} className="input-field">
                {ACTIVITY_TYPES.map(a => <option key={a.value} value={a.value}>{a.label} (${a.rate}/hr)</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Linked Program / Campaign</span>
              <select {...F("linked")} className="input-field">
                {LINKED_ITEMS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Hours</span>
              <input type="number" min="0.25" step="0.25" placeholder="e.g. 2.5" {...F("hours")} className="input-field" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Complexity</span>
              <select {...F("complexity")} className="input-field">
                {COMPLEXITY_TIERS.map(c => <option key={c.value} value={c.value}>{c.label} (×{c.multiplier})</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Asana Task ID</span>
              <input type="text" placeholder="Paste Asana task GID (optional)" {...F("asanaTaskId")} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Notes</span>
              <input type="text" placeholder="Optional notes" {...F("notes")} className="input-field" />
            </label>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-[13px]" style={{ color: TEXT_S }}>
              <input
                type="checkbox"
                checked={form.isHighTouch}
                onChange={e => setForm(prev => ({ ...prev, isHighTouch: e.target.checked }))}
                className="rounded"
              />
              High-Touch Initiative
            </label>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setOpen(false)} className="text-[13px] px-3 py-1.5 rounded-lg border hover:bg-white transition-colors" style={{ borderColor: BORDER, color: TEXT_S }}>Cancel</button>
              <button onClick={handleSubmit} className="text-[13px] px-3 py-1.5 rounded-lg font-medium transition-colors hover:brightness-95" style={{ background: YELLOW, color: TEXT_P }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Deliverable Form ────────────────────────────────────────────────────
function AddDeliverableForm({ onAdd }: { onAdd: (d: DeliverableEntry) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", type: DELIVERABLE_TYPES[0], linked: LINKED_ITEMS[0],
    date: todayStr(), reusable: false, amortize: false,
    asanaProjectId: "", notes: "",
  });

  function handleSubmit() {
    if (!form.name.trim()) return;
    onAdd({ ...form, id: genId(), asanaProjectId: form.asanaProjectId || undefined, notes: form.notes || undefined });
    setForm({ name: "", type: DELIVERABLE_TYPES[0], linked: LINKED_ITEMS[0], date: todayStr(), reusable: false, amortize: false, asanaProjectId: "", notes: "" });
    setOpen(false);
  }

  const F = (f: keyof typeof form) => ({ value: String(form[f]), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(prev => ({ ...prev, [f]: e.target.value })) });

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#F1F1EF]"
        style={{ borderColor: BORDER, color: TEXT_P }}
      >
        <Plus size={14} />
        Add Deliverable
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>

      {open && (
        <div className="mt-2 p-4 rounded-xl border" style={{ borderColor: BORDER, background: BG_S }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Deliverable Name</span>
              <input type="text" placeholder="e.g. Junior Camp Email Campaign" {...F("name")} className="input-field" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Type</span>
              <select {...F("type")} className="input-field">
                {DELIVERABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Linked Program / Campaign</span>
              <select {...F("linked")} className="input-field">
                {LINKED_ITEMS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Date</span>
              <input type="date" {...F("date")} className="input-field" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Asana Project ID</span>
              <input type="text" placeholder="Paste Asana project GID (optional)" {...F("asanaProjectId")} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Notes</span>
              <input type="text" placeholder="Optional notes" {...F("notes")} className="input-field" />
            </label>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-[13px]" style={{ color: TEXT_S }}>
              <input type="checkbox" checked={form.reusable} onChange={e => setForm(p => ({ ...p, reusable: e.target.checked }))} className="rounded" />
              Reusable Asset
            </label>
            <label className="flex items-center gap-2 text-[13px]" style={{ color: TEXT_S }}>
              <input type="checkbox" checked={form.amortize} onChange={e => setForm(p => ({ ...p, amortize: e.target.checked }))} className="rounded" />
              Amortize Cost
            </label>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setOpen(false)} className="text-[13px] px-3 py-1.5 rounded-lg border hover:bg-white transition-colors" style={{ borderColor: BORDER, color: TEXT_S }}>Cancel</button>
              <button onClick={handleSubmit} className="text-[13px] px-3 py-1.5 rounded-lg font-medium transition-colors hover:brightness-95" style={{ background: YELLOW, color: TEXT_P }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Content Studio ─────────────────────────────────────────────────────────
type CaptionOption = { caption: string; hashtags: string; angle: string; bestFor: string };
type CaptionStrategy = { bestTime: string; contentType: string; engagementTip: string; callToAction: string } | null;

function CaptionCard({ opt, index, onRefine }: { opt: CaptionOption; index: number; onRefine: (caption: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const full = opt.caption + (opt.hashtags ? "\n\n" + opt.hashtags : "");
  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => { setter(true); setTimeout(() => setter(false), 1800); });
  }
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: BORDER, background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: YELLOW + "33", color: TEXT_P }}>Option {index + 1} · {opt.angle}</span>
        <div className="flex gap-1.5">
          <button onClick={() => copy(full, setCopied)} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors hover:bg-[#F1F1EF]" style={{ borderColor: BORDER, color: copied ? "#72B84A" : TEXT_S }}>
            {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied" : "Copy all"}
          </button>
          <button onClick={() => onRefine(opt.caption)} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors hover:bg-[#F1F1EF]" style={{ borderColor: BORDER, color: TEXT_S }}>
            <Wand2 size={11} /> Refine
          </button>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: TEXT_P }}>{opt.caption}</p>
      {opt.hashtags && (
        <div className="flex items-start gap-2 pt-2 border-t" style={{ borderColor: BORDER }}>
          <p className="text-[12px] leading-relaxed flex-1" style={{ color: "#1A56DB" }}>{opt.hashtags}</p>
          <button onClick={() => copy(opt.hashtags, setCopiedHash)} className="shrink-0 flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors hover:bg-[#F1F1EF]" style={{ borderColor: BORDER, color: copiedHash ? "#72B84A" : TEXT_S }}>
            {copiedHash ? <Check size={11} /> : <Copy size={11} />}
          </button>
        </div>
      )}
      {opt.bestFor && <p className="text-[11px] italic" style={{ color: TEXT_M }}>{opt.bestFor}</p>}
    </div>
  );
}

function ContentStudio() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "exciting" | "educational">("casual");
  const [contentType, setContentType] = useState<"feed_post" | "reel" | "story" | "carousel">("feed_post");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<CaptionOption[]>([]);
  const [strategy, setStrategy] = useState<CaptionStrategy>(null);
  const [refineTarget, setRefineTarget] = useState<string | null>(null);
  const [refineText, setRefineText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const generate = trpc.instagram.generateCaption.useMutation({
    onSuccess: (data) => {
      setOptions(data.options ?? []);
      setStrategy(data.strategy ?? null);
      setRefineTarget(null);
      setRefineText("");
    },
  });

  const refine = trpc.instagram.generateCaption.useMutation({
    onSuccess: (data) => {
      setOptions(data.options ?? []);
      setRefineTarget(null);
      setRefineText("");
    },
  });

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleGenerate() {
    if (!topic.trim() && !imageDataUrl) return;
    generate.mutate({ topic: topic || "(see image)", tone, contentType, imageDataUrl: imageDataUrl ?? undefined, count: 3 });
  }

  function handleRefine() {
    if (!refineTarget || !refineText.trim()) return;
    refine.mutate({ topic, tone, contentType, count: 1, refineRequest: refineText, previousCaption: refineTarget });
  }

  const isLoading = generate.isPending || refine.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}>
          <Sparkles size={14} color="white" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: TEXT_P }}>Instagram Content Studio</h2>
          <p className="text-[12px]" style={{ color: TEXT_S }}>Describe a moment, upload a photo, and get 3 caption options with hashtags — powered by Claude Sonnet</p>
        </div>
      </div>

      {/* Input Panel */}
      <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
        {/* Image Upload */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide mb-2" style={{ color: TEXT_M }}>Photo / Video Thumbnail (optional)</p>
          <div
            onClick={() => fileRef.current?.click()}
            className="relative flex items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-[#F2DD48]"
            style={{ borderColor: imageDataUrl ? "#72B84A" : BORDER, minHeight: "100px", background: imageDataUrl ? "#F8FFF4" : "#FAFAF9" }}
          >
            {imageDataUrl ? (
              <div className="flex items-center gap-3 p-3">
                <img src={imageDataUrl} alt="preview" className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "#72B84A" }}>Image ready</p>
                  <button onClick={(e) => { e.stopPropagation(); setImageDataUrl(null); }} className="text-[11px] mt-1" style={{ color: TEXT_M }}>Remove</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-4">
                <Upload size={18} style={{ color: TEXT_M }} />
                <p className="text-[12px]" style={{ color: TEXT_M }}>Click to upload a photo or video thumbnail</p>
                <p className="text-[11px]" style={{ color: TEXT_M }}>Claude will analyze the image and tailor the caption</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
        </div>

        {/* Topic */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide mb-1.5" style={{ color: TEXT_M }}>What happened? Describe the moment or content</p>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. We ran a Drive Day event last Saturday with 12 attendees — everyone was hitting 300+ yards by the end. Great energy, lots of laughs."
            className="w-full rounded-xl border p-3 text-[13px] leading-relaxed resize-none"
            style={{ borderColor: BORDER, color: TEXT_P, outline: "none", minHeight: "80px" }}
            onFocus={e => (e.target.style.borderColor = YELLOW)}
            onBlur={e => (e.target.style.borderColor = BORDER)}
          />
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide mb-1.5" style={{ color: TEXT_M }}>Tone</p>
            <select value={tone} onChange={e => setTone(e.target.value as any)} className="input-field">
              <option value="casual">Casual & Friendly</option>
              <option value="exciting">Exciting & Energetic</option>
              <option value="professional">Professional</option>
              <option value="educational">Educational</option>
            </select>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide mb-1.5" style={{ color: TEXT_M }}>Content Type</p>
            <select value={contentType} onChange={e => setContentType(e.target.value as any)} className="input-field">
              <option value="feed_post">Feed Post</option>
              <option value="reel">Reel</option>
              <option value="story">Story</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || (!topic.trim() && !imageDataUrl)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[14px] transition-all hover:brightness-95 disabled:opacity-40"
          style={{ background: YELLOW, color: TEXT_P }}
        >
          {isLoading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {isLoading ? "Generating..." : "Generate 3 Caption Options"}
        </button>
      </div>

      {/* Strategy Tip */}
      {strategy && (
        <div className="rounded-xl border p-4" style={{ borderColor: "#F2DD4866", background: "#FFFDF0" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: TEXT_S }}>Strategy Recommendation</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
            <div><span style={{ color: TEXT_M }}>Best time to post</span><br /><strong style={{ color: TEXT_P }}>{strategy.bestTime}</strong></div>
            <div><span style={{ color: TEXT_M }}>Format</span><br /><strong style={{ color: TEXT_P }}>{strategy.contentType}</strong></div>
            <div><span style={{ color: TEXT_M }}>Engagement tip</span><br /><strong style={{ color: TEXT_P }}>{strategy.engagementTip}</strong></div>
            <div><span style={{ color: TEXT_M }}>Call to action</span><br /><strong style={{ color: TEXT_P }}>{strategy.callToAction}</strong></div>
          </div>
        </div>
      )}

      {/* Caption Options */}
      {options.length > 0 && (
        <div className="space-y-3">
          <p className="text-[12px] font-medium" style={{ color: TEXT_S }}>Choose an option, copy it, or click Refine to adjust with Claude</p>
          {options.map((opt, i) => (
            <CaptionCard key={i} opt={opt} index={i} onRefine={cap => { setRefineTarget(cap); setRefineText(""); }} />
          ))}
        </div>
      )}

      {/* Inline Refinement */}
      {refineTarget && (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: YELLOW, background: "#FFFDF0" }}>
          <p className="text-[12px] font-semibold" style={{ color: TEXT_P }}>Refining selected caption with Claude</p>
          <p className="text-[12px] line-clamp-2" style={{ color: TEXT_S }}>{refineTarget}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={refineText}
              onChange={e => setRefineText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRefine()}
              placeholder='e.g. "Make it shorter", "Add a question at the end", "More energy"'
              className="flex-1 rounded-lg border px-3 py-2 text-[13px]"
              style={{ borderColor: BORDER, color: TEXT_P, outline: "none" }}
            />
            <button
              onClick={handleRefine}
              disabled={refine.isPending || !refineText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-[13px] transition-all hover:brightness-95 disabled:opacity-40"
              style={{ background: YELLOW, color: TEXT_P }}
            >
              {refine.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Wand2 size={13} />}
              Refine
            </button>
            <button onClick={() => setRefineTarget(null)} className="px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: BORDER, color: TEXT_S }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {options.length === 0 && !isLoading && (
        <div className="text-center py-10" style={{ color: TEXT_M }}>
          <Sparkles size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-[13px]">Describe a moment or upload a photo to generate Instagram captions</p>
          <p className="text-[11px] mt-1">Claude Sonnet will create 3 distinct options with hashtags and posting strategy</p>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Production() {
  const [tab, setTab] = useState<"effort" | "deliverables" | "asana" | "ratecard" | "content-studio">("effort");
  const [effortEntries, setEffortEntries] = useState<EffortEntry[]>([]);
  const [deliverableEntries, setDeliverableEntries] = useState<DeliverableEntry[]>([]);

  // ── Summary calculations ──
  const totalLaborValue = useMemo(
    () => effortEntries.reduce((sum, e) => sum + calcEntryValue(e), 0),
    [effortEntries],
  );
  const utilizationPct = Math.min((totalLaborValue / RETAINER_MONTHLY) * 100, 150);
  const isOverCapacity = totalLaborValue > RETAINER_MONTHLY;
  const highTouchCount = effortEntries.filter(e => e.isHighTouch).length;

  function removeEffort(id: string) { setEffortEntries(prev => prev.filter(e => e.id !== id)); }
  function removeDeliverable(id: string) { setDeliverableEntries(prev => prev.filter(d => d.id !== id)); }

  const [asanaProjectFilter, setAsanaProjectFilter] = useState<string>("all");
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskProject, setNewTaskProject] = useState(Object.keys(PRODUCTION_PROJECTS)[0]);
  const [newTaskDue, setNewTaskDue] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: asanaData, isLoading: asanaLoading, refetch: asanaRefetch } =
    trpc.asana.getProductionTasks.useQuery(
      { projectName: asanaProjectFilter === "all" ? undefined : asanaProjectFilter },
      { enabled: tab === "asana", staleTime: 60_000 },
    );

  const createTask = trpc.asana.createProductionTask.useMutation({
    onSuccess: () => { setNewTaskName(""); setNewTaskDue(""); setCreateOpen(false); asanaRefetch(); },
  });

  const tabs = [
    { id: "effort" as const,          label: "Effort Log" },
    { id: "deliverables" as const,     label: "Deliverables" },
    { id: "asana" as const,            label: "Asana Tasks" },
    { id: "ratecard" as const,         label: "Rate Card" },
    { id: "content-studio" as const,   label: "✦ Content Studio" },
  ];

  return (
    <div className="p-8 space-y-5">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: TEXT_P, marginBottom: 0 }}>Production</h1>
        <p style={{ fontSize: "13px", color: TEXT_S, marginTop: "4px" }}>Studio Soo work log · deliverables · retainer utilization · {currentMonthLabel()}</p>
      </div>

      {/* ── Summary Banner ── */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide mb-0.5" style={{ color: TEXT_M }}>Retainer / Month</p>
            <p className="text-[22px] font-bold" style={{ color: TEXT_P }}>{fmtCurrency(RETAINER_MONTHLY)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide mb-0.5" style={{ color: TEXT_M }}>Est. Labor Value</p>
            <p className="text-[22px] font-bold" style={{ color: isOverCapacity ? ORG : GRN }}>
              {totalLaborValue > 0 ? fmtCurrency(totalLaborValue) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide mb-0.5" style={{ color: TEXT_M }}>Deliverables</p>
            <p className="text-[22px] font-bold" style={{ color: TEXT_P }}>{deliverableEntries.length}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide mb-0.5" style={{ color: TEXT_M }}>High-Touch</p>
            <p className="text-[22px] font-bold" style={{ color: TEXT_P }}>{highTouchCount}</p>
          </div>
        </div>

        {/* Utilization bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-medium" style={{ color: TEXT_S }}>Retainer Utilization</span>
            <div className="flex items-center gap-2">
              {isOverCapacity && (
                <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#FFF0E0", color: ORG }}>
                  <AlertTriangle size={11} />
                  Over Capacity
                </span>
              )}
              <span className="text-[12px] font-bold" style={{ color: isOverCapacity ? ORG : TEXT_P }}>
                {totalLaborValue > 0 ? `${Math.round(utilizationPct)}%` : "0%"}
              </span>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: BG_S }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(utilizationPct, 100)}%`,
                background: isOverCapacity ? ORG : utilizationPct >= 80 ? YELLOW : GRN,
              }}
            />
          </div>
          {effortEntries.length === 0 && (
            <p className="text-[11px] mt-1.5" style={{ color: TEXT_M }}>Add effort entries to track utilization.</p>
          )}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex border-b" style={{ borderColor: BORDER }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-[13px] font-medium transition-all duration-150"
            style={tab === t.id
              ? { color: TEXT_P, borderBottom: `2px solid ${YELLOW}`, marginBottom: "-1px" }
              : { color: TEXT_M }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Effort Log Tab ── */}
      {tab === "effort" && (
        <div>
          <AddEffortForm onAdd={e => setEffortEntries(prev => [e, ...prev])} />
          {effortEntries.length === 0 ? (
            <div className="text-center py-12 text-[13px]" style={{ color: TEXT_M }}>
              No effort entries yet. Click "Add Entry" to log work.
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["Date", "Role", "Activity", "Linked To", "Hrs", "Tier", "Est Value", ""].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium" style={{ color: TEXT_M, fontSize: "11px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {effortEntries.map(e => {
                    const act = ACTIVITY_TYPES.find(a => a.value === e.activityType);
                    const tier = COMPLEXITY_TIERS.find(c => c.value === e.complexity);
                    const value = calcEntryValue(e);
                    return (
                      <tr key={e.id} className="border-b hover:bg-[#F6F6F4] transition-colors" style={{ borderColor: BORDER }}>
                        <td className="px-3 py-2.5" style={{ color: TEXT_S }}>{e.date}</td>
                        <td className="px-3 py-2.5 font-medium" style={{ color: TEXT_P }}>{e.role.replace("Studio Soo — ", "")}</td>
                        <td className="px-3 py-2.5" style={{ color: TEXT_S }}>
                          {act?.label ?? e.activityType}
                          {e.isHighTouch && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#FFF0E0", color: ORG }}>HT</span>}
                        </td>
                        <td className="px-3 py-2.5" style={{ color: TEXT_S }}>{e.linked}</td>
                        <td className="px-3 py-2.5 font-medium" style={{ color: TEXT_P }}>{e.hours}</td>
                        <td className="px-3 py-2.5" style={{ color: TEXT_S }}>{tier?.label ?? e.complexity}</td>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: GRN }}>{fmtCurrency(value)}</td>
                        <td className="px-3 py-2.5">
                          <button onClick={() => removeEffort(e.id)} className="p-1 rounded hover:bg-[#DEDEDA] transition-colors">
                            <X size={13} style={{ color: TEXT_M }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td colSpan={6} className="px-3 py-2.5 font-semibold text-[12px]" style={{ color: TEXT_S }}>Total</td>
                    <td className="px-3 py-2.5 font-bold text-[14px]" style={{ color: isOverCapacity ? ORG : GRN }}>{fmtCurrency(totalLaborValue)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Deliverables Tab ── */}
      {tab === "deliverables" && (
        <div>
          <AddDeliverableForm onAdd={d => setDeliverableEntries(prev => [d, ...prev])} />
          {deliverableEntries.length === 0 ? (
            <div className="text-center py-12 text-[13px]" style={{ color: TEXT_M }}>
              No deliverables yet. Click "Add Deliverable" to log assets.
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["Date", "Name", "Type", "Linked To", "Reusable", "Amortize", ""].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium" style={{ color: TEXT_M, fontSize: "11px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deliverableEntries.map(d => (
                    <tr key={d.id} className="border-b hover:bg-[#F6F6F4] transition-colors" style={{ borderColor: BORDER }}>
                      <td className="px-3 py-2.5" style={{ color: TEXT_S }}>{d.date}</td>
                      <td className="px-3 py-2.5 font-medium" style={{ color: TEXT_P }}>{d.name}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_S }}>{d.type}</td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_S }}>{d.linked}</td>
                      <td className="px-3 py-2.5">
                        {d.reusable
                          ? <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#E6F0DC", color: GRN }}>Yes</span>
                          : <span className="text-[11px]" style={{ color: TEXT_M }}>—</span>
                        }
                      </td>
                      <td className="px-3 py-2.5">
                        {d.amortize
                          ? <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#EAF2FF", color: "#4E8DF4" }}>Yes</span>
                          : <span className="text-[11px]" style={{ color: TEXT_M }}>—</span>
                        }
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeDeliverable(d.id)} className="p-1 rounded hover:bg-[#DEDEDA] transition-colors">
                          <X size={13} style={{ color: TEXT_M }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Asana Tasks Tab ── */}
      {tab === "asana" && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={asanaProjectFilter}
              onChange={e => setAsanaProjectFilter(e.target.value)}
              className="input-field"
              style={{ maxWidth: 260 }}
            >
              <option value="all">All Projects</option>
              {Object.keys(PRODUCTION_PROJECTS).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={() => asanaRefetch()}
              className="flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#F1F1EF]"
              style={{ borderColor: BORDER, color: TEXT_S }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
            <button
              onClick={() => setCreateOpen(v => !v)}
              className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors hover:brightness-95 ml-auto"
              style={{ background: YELLOW, borderColor: YELLOW, color: TEXT_P }}
            >
              <Plus size={14} />
              New Task
            </button>
          </div>

          {/* Create task form */}
          {createOpen && (
            <div className="p-4 rounded-xl border" style={{ borderColor: BORDER, background: BG_S }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Task Name</span>
                  <input
                    type="text"
                    placeholder="e.g. Design Junior Camp email header"
                    value={newTaskName}
                    onChange={e => setNewTaskName(e.target.value)}
                    className="input-field"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Due Date</span>
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={e => setNewTaskDue(e.target.value)}
                    className="input-field"
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-[11px] font-medium text-[#A8A8A3] uppercase tracking-wide">Project</span>
                  <select
                    value={newTaskProject}
                    onChange={e => setNewTaskProject(e.target.value)}
                    className="input-field"
                  >
                    {Object.keys(PRODUCTION_PROJECTS).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="text-[13px] px-3 py-1.5 rounded-lg border hover:bg-white transition-colors"
                  style={{ borderColor: BORDER, color: TEXT_S }}
                >Cancel</button>
                <button
                  onClick={() => {
                    if (!newTaskName.trim()) return;
                    createTask.mutate({
                      name: newTaskName.trim(),
                      projectName: newTaskProject,
                      due_on: newTaskDue || undefined,
                    });
                  }}
                  disabled={createTask.isPending || !newTaskName.trim()}
                  className="text-[13px] px-3 py-1.5 rounded-lg font-medium transition-colors hover:brightness-95 disabled:opacity-50"
                  style={{ background: YELLOW, color: TEXT_P }}
                >
                  {createTask.isPending ? "Creating…" : "Create in Asana"}
                </button>
              </div>
              {createTask.isError && (
                <p className="text-[12px] mt-2" style={{ color: "#D05A3A" }}>
                  Error: {createTask.error?.message}
                </p>
              )}
            </div>
          )}

          {/* Task list */}
          {asanaLoading ? (
            <div className="text-center py-12 text-[13px]" style={{ color: TEXT_M }}>Loading Asana tasks…</div>
          ) : !asanaData || asanaData.projects.every(p => p.tasks.length === 0) ? (
            <div className="text-center py-12 text-[13px]" style={{ color: TEXT_M }}>
              No tasks found. Check that ASANA_PAT is set and projects are accessible.
            </div>
          ) : (
            <div className="space-y-4">
              {asanaData.projects
                .filter(p => p.tasks.length > 0)
                .map(proj => (
                  <div key={proj.projectGid} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                      <div>
                        <h3 className="text-[14px] font-semibold" style={{ color: TEXT_P }}>{proj.projectName}</h3>
                        <p className="text-[11px] mt-0.5" style={{ color: TEXT_M }}>
                          {proj.tasks.filter(t => !t.completed).length} open · {proj.tasks.filter(t => t.completed).length} completed
                        </p>
                      </div>
                      <a
                        href={`https://app.asana.com/0/${proj.projectGid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[12px] hover:underline"
                        style={{ color: TEXT_S }}
                      >
                        Open in Asana <ExternalLink size={11} />
                      </a>
                    </div>
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          {["Status", "Task", "Assignee", "Due"].map(h => (
                            <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: TEXT_M, fontSize: "11px" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {proj.tasks.map(t => (
                          <tr key={t.gid} className="border-b hover:bg-[#F6F6F4] transition-colors" style={{ borderColor: BORDER }}>
                            <td className="px-4 py-2.5">
                              {t.completed
                                ? <CheckCircle2 size={15} style={{ color: GRN }} />
                                : <Circle size={15} style={{ color: TEXT_M }} />}
                            </td>
                            <td className="px-4 py-2.5 font-medium" style={{ color: t.completed ? TEXT_M : TEXT_P }}>
                              <a
                                href={`https://app.asana.com/0/${proj.projectGid}/${t.gid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {t.name}
                              </a>
                            </td>
                            <td className="px-4 py-2.5" style={{ color: TEXT_S }}>{t.assignee ?? "—"}</td>
                            <td className="px-4 py-2.5" style={{ color: t.due_on && new Date(t.due_on) < new Date() && !t.completed ? "#D05A3A" : TEXT_S }}>
                              {t.due_on ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              <p className="text-[11px] text-right" style={{ color: TEXT_M }}>
                Last fetched: {asanaData.fetchedAt ? new Date(asanaData.fetchedAt).toLocaleTimeString() : "—"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Rate Card Tab ── */}
      {tab === "ratecard" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
              <h3 className="text-[14px] font-semibold" style={{ color: TEXT_P }}>Activity Rate Card</h3>
              <p className="text-[12px] mt-0.5" style={{ color: TEXT_S }}>Base hourly rates by activity type · Complexity multiplier applied automatically</p>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Activity", "Base Rate / hr", "Standard", "Complex ×1.25", "Strategic ×1.5"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: TEXT_M, fontSize: "11px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ACTIVITY_TYPES.map((a, i) => (
                  <tr key={a.value} className="border-b" style={{ borderColor: BORDER, background: i % 2 === 0 ? "white" : BG_S }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: TEXT_P }}>{a.label}</td>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: YELLOW }}>${a.rate}</td>
                    <td className="px-4 py-2.5" style={{ color: TEXT_S }}>${a.rate}</td>
                    <td className="px-4 py-2.5" style={{ color: TEXT_S }}>${Math.round(a.rate * 1.25)}</td>
                    <td className="px-4 py-2.5" style={{ color: TEXT_S }}>${Math.round(a.rate * 1.5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border p-4" style={{ borderColor: BORDER, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
            <h3 className="text-[13px] font-semibold mb-2" style={{ color: TEXT_P }}>Retainer Summary</h3>
            <div className="space-y-1.5 text-[12px]" style={{ color: TEXT_S }}>
              <p>· Monthly retainer: <strong style={{ color: TEXT_P }}>{fmtCurrency(RETAINER_MONTHLY)}</strong></p>
              <p>· Approx. capacity at avg $100/hr: <strong style={{ color: TEXT_P }}>60 hrs/month</strong></p>
              <p>· Over-capacity threshold: labor value exceeds {fmtCurrency(RETAINER_MONTHLY)}</p>
              <p>· Asana Tasks tab: live read/write to all production projects via API</p>
              <p>· Next: link effort log entries to Asana task GIDs for two-way sync</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Content Studio Tab ── */}
      {tab === "content-studio" && <ContentStudio />}

      <style>{`
        .input-field {
          width: 100%;
          padding: 6px 10px;
          font-size: 13px;
          border: 1px solid ${BORDER};
          border-radius: 8px;
          background: white;
          color: ${TEXT_P};
          outline: none;
        }
        .input-field:focus { border-color: ${YELLOW}; box-shadow: 0 0 0 2px ${YELLOW}22; }
      `}</style>
    </div>
  );
}
