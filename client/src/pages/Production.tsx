import { useState, useMemo } from "react";
import { Plus, X, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";

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
              <input type="text" placeholder="Optional — Phase 2" {...F("asanaTaskId")} className="input-field" />
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
              <input type="text" placeholder="Optional — Phase 2" {...F("asanaProjectId")} className="input-field" />
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Production() {
  const [tab, setTab] = useState<"effort" | "deliverables" | "ratecard">("effort");
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

  const tabs = [
    { id: "effort" as const,      label: "Effort Log" },
    { id: "deliverables" as const, label: "Deliverables" },
    { id: "ratecard" as const,    label: "Rate Card" },
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
              <p>· Phase 2: entries sync to Asana via Task ID / Project ID fields</p>
              <p>· Phase 3: MCP / API integration for automated time tracking</p>
            </div>
          </div>
        </div>
      )}

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
