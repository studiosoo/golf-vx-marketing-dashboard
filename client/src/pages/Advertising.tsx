import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, Users, DollarSign, TrendingUp, Eye, MousePointer,
  Plus, Instagram, Youtube, Facebook, Globe, Star, Heart,
  Building2, School, Trophy, Music, Flame, CheckCircle2,
  XCircle, Clock, AlertCircle, RefreshCw, ExternalLink,
  Edit2, Trash2, ChevronRight, Target, Megaphone
} from "lucide-react";
import MetaAds from "./MetaAds";

// ─── Types ─────────────────────────────────────────────────────────────────
type InfluencerStatus = "negotiating" | "contracted" | "in_progress" | "completed" | "cancelled";
type OutreachStatus = "received" | "under_review" | "approved" | "rejected" | "fulfilled" | "follow_up";
type OutreachRequestType = "cash_donation" | "gift_card" | "product_donation" | "service_donation" | "sponsorship" | "partnership" | "networking";

// ─── Helpers ───────────────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram size={14} />,
  youtube: <Youtube size={14} />,
  facebook: <Facebook size={14} />,
  tiktok: <span className="text-xs font-bold">TT</span>,
  other: <Globe size={14} />,
};

const INFLUENCER_STATUS_CONFIG: Record<InfluencerStatus, { label: string; color: string }> = {
  negotiating: { label: "Negotiating", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  contracted: { label: "Contracted", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  in_progress: { label: "In Progress", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const OUTREACH_STATUS_CONFIG: Record<OutreachStatus, { label: string; color: string; icon: React.ReactNode }> = {
  received: { label: "Received", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Clock size={12} /> },
  under_review: { label: "Under Review", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <AlertCircle size={12} /> },
  approved: { label: "Approved", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle2 size={12} /> },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle size={12} /> },
  fulfilled: { label: "Fulfilled", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <Star size={12} /> },
  follow_up: { label: "Follow Up", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: <RefreshCw size={12} /> },
};

const ORG_TYPE_ICONS: Record<string, React.ReactNode> = {
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

const REQUEST_TYPE_LABELS: Record<OutreachRequestType, string> = {
  cash_donation: "Cash Donation",
  gift_card: "Gift Card",
  product_donation: "Product/Item",
  service_donation: "Free Service",
  sponsorship: "Sponsorship",
  partnership: "Partnership",
  networking: "Networking",
};

function fmt$(v: any) {
  const n = parseFloat(String(v || 0));
  return n === 0 ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtNum(v: any) {
  const n = parseInt(String(v || 0));
  return n === 0 ? "—" : n.toLocaleString();
}

// ─── Influencer Form ───────────────────────────────────────────────────────
function InfluencerForm({ onSuccess, initial }: { onSuccess: () => void; initial?: any }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const create = trpc.influencer.create.useMutation({
    onSuccess: () => { utils.influencer.list.invalidate(); toast({ title: "Influencer partnership added" }); onSuccess(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const update = trpc.influencer.update.useMutation({
    onSuccess: () => { utils.influencer.list.invalidate(); toast({ title: "Partnership updated" }); onSuccess(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const [form, setForm] = useState({
    handle: initial?.handle || "",
    platform: initial?.platform || "instagram",
    followerCount: initial?.followerCount ? String(initial.followerCount) : "",
    contactName: initial?.contactName || "",
    contactEmail: initial?.contactEmail || "",
    dealDate: initial?.dealDate ? String(initial.dealDate).split("T")[0] : "",
    totalCost: initial?.totalCost || "",
    deliverables: initial?.deliverables || "",
    campaignGoal: initial?.campaignGoal || "",
    targetAudience: initial?.targetAudience || "",
    status: initial?.status || "contracted",
    actualReach: initial?.actualReach ? String(initial.actualReach) : "",
    actualImpressions: initial?.actualImpressions ? String(initial.actualImpressions) : "",
    actualEngagements: initial?.actualEngagements ? String(initial.actualEngagements) : "",
    actualLeadsGenerated: initial?.actualLeadsGenerated ? String(initial.actualLeadsGenerated) : "",
    actualBookingsGenerated: initial?.actualBookingsGenerated ? String(initial.actualBookingsGenerated) : "",
    actualRevenue: initial?.actualRevenue || "",
    notes: initial?.notes || "",
  });

  const handleSubmit = () => {
    if (!form.handle) return toast({ title: "Handle is required", variant: "destructive" });
    const payload = {
      handle: form.handle,
      platform: form.platform as any,
      followerCount: form.followerCount ? parseInt(form.followerCount) : undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      dealDate: form.dealDate || undefined,
      totalCost: form.totalCost || undefined,
      deliverables: form.deliverables || undefined,
      campaignGoal: form.campaignGoal || undefined,
      targetAudience: form.targetAudience || undefined,
      status: form.status as any,
      actualReach: form.actualReach ? parseInt(form.actualReach) : undefined,
      actualImpressions: form.actualImpressions ? parseInt(form.actualImpressions) : undefined,
      actualEngagements: form.actualEngagements ? parseInt(form.actualEngagements) : undefined,
      actualLeadsGenerated: form.actualLeadsGenerated ? parseInt(form.actualLeadsGenerated) : undefined,
      actualBookingsGenerated: form.actualBookingsGenerated ? parseInt(form.actualBookingsGenerated) : undefined,
      actualRevenue: form.actualRevenue || undefined,
      notes: form.notes || undefined,
    };
    if (initial?.id) {
      update.mutate({ id: initial.id, updates: payload });
    } else {
      create.mutate(payload);
    }
  };

  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target?.value ?? e }));

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Handle *</Label>
          <Input placeholder="@actionheightslifestyle" value={form.handle} onChange={f("handle")} />
        </div>
        <div className="space-y-1">
          <Label>Platform</Label>
          <Select value={form.platform} onValueChange={f("platform")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["instagram","tiktok","youtube","facebook","other"].map(p => (
                <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Follower Count</Label>
          <Input type="number" placeholder="25000" value={form.followerCount} onChange={f("followerCount")} />
        </div>
        <div className="space-y-1">
          <Label>Deal Date</Label>
          <Input type="date" value={form.dealDate} onChange={f("dealDate")} />
        </div>
        <div className="space-y-1">
          <Label>Total Cost ($)</Label>
          <Input type="number" placeholder="500" value={form.totalCost} onChange={f("totalCost")} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={f("status")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(INFLUENCER_STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Contact Name</Label>
          <Input placeholder="Jane Smith" value={form.contactName} onChange={f("contactName")} />
        </div>
        <div className="space-y-1">
          <Label>Contact Email</Label>
          <Input placeholder="jane@example.com" value={form.contactEmail} onChange={f("contactEmail")} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Deliverables</Label>
        <Input placeholder="1 reel + 3 stories" value={form.deliverables} onChange={f("deliverables")} />
      </div>
      <div className="space-y-1">
        <Label>Campaign Goal</Label>
        <Input placeholder="Drive trial session bookings" value={form.campaignGoal} onChange={f("campaignGoal")} />
      </div>
      <div className="space-y-1">
        <Label>Target Audience</Label>
        <Input placeholder="Arlington Heights families, golf enthusiasts" value={form.targetAudience} onChange={f("targetAudience")} />
      </div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide pt-2">Performance (fill in after campaign)</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "actualReach", label: "Reach" },
          { key: "actualImpressions", label: "Impressions" },
          { key: "actualEngagements", label: "Engagements" },
          { key: "actualLeadsGenerated", label: "Leads" },
          { key: "actualBookingsGenerated", label: "Bookings" },
          { key: "actualRevenue", label: "Revenue ($)" },
        ].map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label>{label}</Label>
            <Input type={key === "actualRevenue" ? "text" : "number"} placeholder="0" value={(form as any)[key]} onChange={f(key)} />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea placeholder="Additional notes..." value={form.notes} onChange={f("notes")} rows={2} />
      </div>
      <Button onClick={handleSubmit} className="w-full" disabled={create.isPending || update.isPending}>
        {initial?.id ? "Update Partnership" : "Add Partnership"}
      </Button>
    </div>
  );
}

// ─── Outreach Form ─────────────────────────────────────────────────────────
function OutreachForm({ onSuccess, initial }: { onSuccess: () => void; initial?: any }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const create = trpc.outreach.create.useMutation({
    onSuccess: () => { utils.outreach.list.invalidate(); utils.outreach.getSummary.invalidate(); toast({ title: "Outreach request added" }); onSuccess(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const update = trpc.outreach.update.useMutation({
    onSuccess: () => { utils.outreach.list.invalidate(); utils.outreach.getSummary.invalidate(); toast({ title: "Request updated" }); onSuccess(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const [form, setForm] = useState({
    orgName: initial?.orgName || "",
    orgType: initial?.orgType || "other",
    contactName: initial?.contactName || "",
    contactEmail: initial?.contactEmail || "",
    contactPhone: initial?.contactPhone || "",
    website: initial?.website || "",
    ein: initial?.ein || "",
    is501c3: initial?.is501c3 || false,
    requestType: initial?.requestType || "gift_card",
    requestDate: initial?.requestDate ? String(initial.requestDate).split("T")[0] : "",
    eventName: initial?.eventName || "",
    eventDate: initial?.eventDate ? String(initial.eventDate).split("T")[0] : "",
    eventLocation: initial?.eventLocation || "",
    estimatedAttendees: initial?.estimatedAttendees ? String(initial.estimatedAttendees) : "",
    requestedAmount: initial?.requestedAmount || "",
    requestDescription: initial?.requestDescription || "",
    status: initial?.status || "received",
    decisionNotes: initial?.decisionNotes || "",
    rejectionReason: initial?.rejectionReason || "",
    actualDonationType: initial?.actualDonationType || "",
    actualCashValue: initial?.actualCashValue || "",
    actualPerceivedValue: initial?.actualPerceivedValue || "",
    benefitsReceived: initial?.benefitsReceived || "",
    estimatedReach: initial?.estimatedReach ? String(initial.estimatedReach) : "",
    actualLeadsGenerated: initial?.actualLeadsGenerated ? String(initial.actualLeadsGenerated) : "",
    actualBookingsGenerated: initial?.actualBookingsGenerated ? String(initial.actualBookingsGenerated) : "",
    actualRevenue: initial?.actualRevenue || "",
    roiNotes: initial?.roiNotes || "",
    priority: initial?.priority || "medium",
    notes: initial?.notes || "",
  });

  const handleSubmit = () => {
    if (!form.orgName) return toast({ title: "Organization name is required", variant: "destructive" });
    const payload = {
      orgName: form.orgName,
      orgType: form.orgType as any,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      website: form.website || undefined,
      ein: form.ein || undefined,
      is501c3: form.is501c3,
      requestType: form.requestType as any,
      requestDate: form.requestDate || undefined,
      eventName: form.eventName || undefined,
      eventDate: form.eventDate || undefined,
      eventLocation: form.eventLocation || undefined,
      estimatedAttendees: form.estimatedAttendees ? parseInt(form.estimatedAttendees) : undefined,
      requestedAmount: form.requestedAmount || undefined,
      requestDescription: form.requestDescription || undefined,
      status: form.status as any,
      decisionNotes: form.decisionNotes || undefined,
      rejectionReason: form.rejectionReason || undefined,
      actualDonationType: form.actualDonationType || undefined,
      actualCashValue: form.actualCashValue || undefined,
      actualPerceivedValue: form.actualPerceivedValue || undefined,
      benefitsReceived: form.benefitsReceived || undefined,
      estimatedReach: form.estimatedReach ? parseInt(form.estimatedReach) : undefined,
      actualLeadsGenerated: form.actualLeadsGenerated ? parseInt(form.actualLeadsGenerated) : undefined,
      actualBookingsGenerated: form.actualBookingsGenerated ? parseInt(form.actualBookingsGenerated) : undefined,
      actualRevenue: form.actualRevenue || undefined,
      roiNotes: form.roiNotes || undefined,
      priority: form.priority as any,
      notes: form.notes || undefined,
    };
    if (initial?.id) {
      update.mutate({ id: initial.id, updates: payload });
    } else {
      create.mutate(payload);
    }
  };

  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target?.value ?? e }));

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Organization</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <Label>Organization Name *</Label>
          <Input placeholder="Windsor Elementary School PTA" value={form.orgName} onChange={f("orgName")} />
        </div>
        <div className="space-y-1">
          <Label>Org Type</Label>
          <Select value={form.orgType} onValueChange={f("orgType")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[
                ["school_pta","School PTA"],["school_sports","School Sports"],["nonprofit","Nonprofit"],
                ["civic","Civic Org"],["arts_culture","Arts & Culture"],["sports_league","Sports League"],
                ["religious","Religious"],["business","Business"],["other","Other"]
              ].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={f("priority")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Contact Name</Label>
          <Input placeholder="Amy Elston" value={form.contactName} onChange={f("contactName")} />
        </div>
        <div className="space-y-1">
          <Label>Contact Email</Label>
          <Input placeholder="amy@school.org" value={form.contactEmail} onChange={f("contactEmail")} />
        </div>
        <div className="space-y-1">
          <Label>Contact Phone</Label>
          <Input placeholder="269-910-8345" value={form.contactPhone} onChange={f("contactPhone")} />
        </div>
        <div className="space-y-1">
          <Label>EIN (501c3)</Label>
          <Input placeholder="36-3291003" value={form.ein} onChange={f("ein")} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide pt-2">Request Details</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Request Type</Label>
          <Select value={form.requestType} onValueChange={f("requestType")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(REQUEST_TYPE_LABELS).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={f("status")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(OUTREACH_STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Request Date</Label>
          <Input type="date" value={form.requestDate} onChange={f("requestDate")} />
        </div>
        <div className="space-y-1">
          <Label>Requested Amount ($)</Label>
          <Input type="number" placeholder="0" value={form.requestedAmount} onChange={f("requestedAmount")} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Event Name</Label>
          <Input placeholder="Windsor PTA Trivia Night Fundraiser" value={form.eventName} onChange={f("eventName")} />
        </div>
        <div className="space-y-1">
          <Label>Event Date</Label>
          <Input type="date" value={form.eventDate} onChange={f("eventDate")} />
        </div>
        <div className="space-y-1">
          <Label>Est. Attendees</Label>
          <Input type="number" placeholder="200" value={form.estimatedAttendees} onChange={f("estimatedAttendees")} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Event Location</Label>
          <Input placeholder="Knights of Columbus Hall, Arlington Heights" value={form.eventLocation} onChange={f("eventLocation")} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Request Description</Label>
        <Textarea placeholder="Brief description of the request..." value={form.requestDescription} onChange={f("requestDescription")} rows={2} />
      </div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide pt-2">Our Response</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <Label>What We Donated / Offered</Label>
          <Input placeholder="2x $50 gift cards + 1 FREE Summer Camp Week ($699 value)" value={form.actualDonationType} onChange={f("actualDonationType")} />
        </div>
        <div className="space-y-1">
          <Label>Cash Value ($)</Label>
          <Input type="number" placeholder="100" value={form.actualCashValue} onChange={f("actualCashValue")} />
        </div>
        <div className="space-y-1">
          <Label>Perceived Value ($)</Label>
          <Input type="number" placeholder="799" value={form.actualPerceivedValue} onChange={f("actualPerceivedValue")} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Benefits Received (marketing value)</Label>
          <Input placeholder="Logo at event, social media mention, 250 flyers distributed" value={form.benefitsReceived} onChange={f("benefitsReceived")} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Decision Notes</Label>
          <Textarea placeholder="Why approved or rejected..." value={form.decisionNotes} onChange={f("decisionNotes")} rows={2} />
        </div>
        {form.status === "rejected" && (
          <div className="space-y-1 col-span-2">
            <Label>Rejection Reason</Label>
            <Input placeholder="Out of budget / not aligned with target audience" value={form.rejectionReason} onChange={f("rejectionReason")} />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide pt-2">ROI Tracking</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "estimatedReach", label: "Est. Reach" },
          { key: "actualLeadsGenerated", label: "Leads Generated" },
          { key: "actualBookingsGenerated", label: "Bookings" },
        ].map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label>{label}</Label>
            <Input type="number" placeholder="0" value={(form as any)[key]} onChange={f(key)} />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label>ROI Notes</Label>
        <Textarea placeholder="Notes on marketing impact, brand awareness, leads..." value={form.roiNotes} onChange={f("roiNotes")} rows={2} />
      </div>
      <Button onClick={handleSubmit} className="w-full" disabled={create.isPending || update.isPending}>
        {initial?.id ? "Update Request" : "Add Outreach Request"}
      </Button>
    </div>
  );
}

// ─── Influencer Tab ────────────────────────────────────────────────────────
function InfluencerTab() {
  const { data: partnerships = [], isLoading } = trpc.influencer.list.useQuery();
  const deleteP = trpc.influencer.delete.useMutation({
    onSuccess: () => trpc.useUtils().influencer.list.invalidate(),
  });
  const utils = trpc.useUtils();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const totalSpend = partnerships.reduce((s, p) => s + parseFloat(String(p.totalCost || 0)), 0);
  const totalReach = partnerships.reduce((s, p) => s + (p.actualReach || 0), 0);
  const totalEngagements = partnerships.reduce((s, p) => s + (p.actualEngagements || 0), 0);
  const totalBookings = partnerships.reduce((s, p) => s + (p.actualBookingsGenerated || 0), 0);
  const avgCPE = totalEngagements > 0 ? totalSpend / totalEngagements : 0;

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Spend", value: fmt$(totalSpend), icon: <DollarSign size={16} />, color: "text-red-400" },
          { label: "Total Reach", value: fmtNum(totalReach), icon: <Eye size={16} />, color: "text-blue-400" },
          { label: "Engagements", value: fmtNum(totalEngagements), icon: <Heart size={16} />, color: "text-pink-400" },
          { label: "Bookings Generated", value: fmtNum(totalBookings), icon: <Target size={16} />, color: "text-green-400" },
          { label: "Cost Per Engagement", value: avgCPE > 0 ? `$${avgCPE.toFixed(3)}` : "—", icon: <TrendingUp size={16} />, color: "text-yellow-400" },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <span className={kpi.color}>{kpi.icon}</span>
              </div>
              <div className="text-xl font-bold text-foreground">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Influencer Partnerships</h2>
          <p className="text-sm text-muted-foreground">{partnerships.length} partnership{partnerships.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus size={14} /> Add Partnership</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add Influencer Partnership</DialogTitle></DialogHeader>
            <InfluencerForm onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : partnerships.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="p-8 text-center">
            <Instagram size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">No influencer partnerships yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add your first partnership to start tracking ROI.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {partnerships.map((p: any) => {
            const cost = parseFloat(String(p.totalCost || 0));
            const cpe = p.actualEngagements && p.actualEngagements > 0 ? cost / p.actualEngagements : null;
            const statusCfg = INFLUENCER_STATUS_CONFIG[p.status as InfluencerStatus] || INFLUENCER_STATUS_CONFIG.contracted;
            return (
              <Card key={p.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                        {PLATFORM_ICONS[p.platform] || <Globe size={16} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{p.handle}</span>
                          <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</Badge>
                          {p.followerCount && (
                            <span className="text-xs text-muted-foreground">{fmtNum(p.followerCount)} followers</span>
                          )}
                        </div>
                        {p.deliverables && (
                          <p className="text-sm text-muted-foreground mt-0.5">{p.deliverables}</p>
                        )}
                        {p.campaignGoal && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5">Goal: {p.campaignGoal}</p>
                        )}
                        {p.dealDate && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {new Date(p.dealDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditItem(p)}>
                            <Edit2 size={13} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader><DialogTitle>Edit Partnership</DialogTitle></DialogHeader>
                          {editItem?.id === p.id && <InfluencerForm onSuccess={() => setEditItem(null)} initial={editItem} />}
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300"
                        onClick={() => { if (confirm("Delete this partnership?")) { deleteP.mutate({ id: p.id }); utils.influencer.list.invalidate(); } }}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                  {/* Metrics row */}
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3 pt-3 border-t border-border">
                    {[
                      { label: "Cost", value: fmt$(cost), highlight: true },
                      { label: "Reach", value: fmtNum(p.actualReach) },
                      { label: "Impressions", value: fmtNum(p.actualImpressions) },
                      { label: "Engagements", value: fmtNum(p.actualEngagements) },
                      { label: "Leads", value: fmtNum(p.actualLeadsGenerated) },
                      { label: "CPE", value: cpe ? `$${cpe.toFixed(3)}` : "—" },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <div className={`text-sm font-semibold ${m.highlight ? "text-yellow-400" : "text-foreground"}`}>{m.value}</div>
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Community Outreach Tab ────────────────────────────────────────────────
function OutreachTab() {
  const { data: requests = [], isLoading } = trpc.outreach.list.useQuery();
  const { data: summary } = trpc.outreach.getSummary.useQuery();
  const updateStatus = trpc.outreach.updateStatus.useMutation({
    onSuccess: () => { trpc.useUtils().outreach.list.invalidate(); trpc.useUtils().outreach.getSummary.invalidate(); },
  });
  const deleteR = trpc.outreach.delete.useMutation({
    onSuccess: () => { trpc.useUtils().outreach.list.invalidate(); trpc.useUtils().outreach.getSummary.invalidate(); },
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = filterStatus === "all" ? requests : requests.filter((r: any) => r.status === filterStatus);

  const PIPELINE_ORDER: OutreachStatus[] = ["received", "under_review", "approved", "rejected", "fulfilled", "follow_up"];

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: String(summary.total), icon: <Megaphone size={16} />, color: "text-blue-400" },
            { label: "Cash Donated", value: fmt$(summary.totalCashValue), icon: <DollarSign size={16} />, color: "text-red-400" },
            { label: "Perceived Value", value: fmt$(summary.totalPerceivedValue), icon: <Star size={16} />, color: "text-yellow-400" },
            { label: "Est. Total Reach", value: fmtNum(summary.totalEstimatedReach), icon: <Eye size={16} />, color: "text-green-400" },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  <span className={kpi.color}>{kpi.icon}</span>
                </div>
                <div className="text-xl font-bold text-foreground">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pipeline status strip */}
      {summary && (
        <div className="flex gap-2 flex-wrap">
          {PIPELINE_ORDER.map(s => {
            const cfg = OUTREACH_STATUS_CONFIG[s];
            const count = (summary.byStatus as any)[s] || 0;
            return (
              <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${cfg.color} ${filterStatus === s ? "ring-2 ring-offset-1 ring-offset-background ring-current" : "opacity-70 hover:opacity-100"}`}>
                {cfg.icon} {cfg.label} <span className="font-bold">{count}</span>
              </button>
            );
          })}
          {filterStatus !== "all" && (
            <button onClick={() => setFilterStatus("all")} className="text-xs text-muted-foreground hover:text-foreground px-2">
              Clear filter ×
            </button>
          )}
        </div>
      )}

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Community Outreach Requests</h2>
          <p className="text-sm text-muted-foreground">Sponsorships, donations, partnerships from local organizations</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus size={14} /> Add Request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add Outreach Request</DialogTitle></DialogHeader>
            <OutreachForm onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Request cards */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="p-8 text-center">
            <Building2 size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">No outreach requests {filterStatus !== "all" ? `with status "${filterStatus}"` : "yet"}.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add requests from local schools, nonprofits, and community organizations.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r: any) => {
            const statusCfg = OUTREACH_STATUS_CONFIG[r.status as OutreachStatus] || OUTREACH_STATUS_CONFIG.received;
            const cashVal = parseFloat(String(r.actualCashValue || 0));
            const percVal = parseFloat(String(r.actualPerceivedValue || 0));
            return (
              <Card key={r.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
                        {ORG_TYPE_ICONS[r.orgType] || <Globe size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{r.orgName}</span>
                          <Badge variant="outline" className={`text-xs flex items-center gap-1 ${statusCfg.color}`}>
                            {statusCfg.icon} {statusCfg.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                            {REQUEST_TYPE_LABELS[r.requestType as OutreachRequestType] || r.requestType}
                          </Badge>
                          {r.priority === "high" && (
                            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">High Priority</Badge>
                          )}
                          {r.is501c3 && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">501(c)3</Badge>
                          )}
                        </div>
                        {r.eventName && (
                          <p className="text-sm text-muted-foreground mt-0.5">{r.eventName}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/70 flex-wrap">
                          {r.eventDate && <span>📅 {new Date(r.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                          {r.estimatedAttendees && <span>👥 ~{r.estimatedAttendees.toLocaleString()} attendees</span>}
                          {r.eventLocation && <span>📍 {r.eventLocation}</span>}
                          {r.contactName && <span>👤 {r.contactName}</span>}
                        </div>
                        {r.actualDonationType && (
                          <div className="mt-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400">
                            <span className="font-medium">We gave:</span> {r.actualDonationType}
                            {(cashVal > 0 || percVal > 0) && (
                              <span className="ml-2 text-green-400/70">
                                (Cash: {fmt$(cashVal)}{percVal > 0 ? ` / Perceived: ${fmt$(percVal)}` : ""})
                              </span>
                            )}
                          </div>
                        )}
                        {r.benefitsReceived && (
                          <p className="text-xs text-muted-foreground/70 mt-1.5">
                            <span className="text-muted-foreground font-medium">Benefits:</span> {r.benefitsReceived}
                          </p>
                        )}
                        {r.decisionNotes && (
                          <p className="text-xs text-muted-foreground/60 mt-1 italic">{r.decisionNotes}</p>
                        )}
                        {r.rejectionReason && (
                          <p className="text-xs text-red-400/70 mt-1">Rejected: {r.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditItem(r)}>
                            <Edit2 size={13} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader><DialogTitle>Edit Outreach Request</DialogTitle></DialogHeader>
                          {editItem?.id === r.id && <OutreachForm onSuccess={() => setEditItem(null)} initial={editItem} />}
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300"
                        onClick={() => { if (confirm("Delete this request?")) deleteR.mutate({ id: r.id }); }}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                  {/* Quick status actions */}
                  {(r.status === "received" || r.status === "under_review") && (
                    <div className="mt-3 flex gap-2 pt-3 border-t border-border">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-green-400 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "approved" })}>
                        <CheckCircle2 size={11} /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "under_review" })}>
                        <AlertCircle size={11} /> Under Review
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "rejected" })}>
                        <XCircle size={11} /> Reject
                      </Button>
                    </div>
                  )}
                  {r.status === "approved" && (
                    <div className="mt-3 flex gap-2 pt-3 border-t border-border">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "fulfilled" })}>
                        <Star size={11} /> Mark Fulfilled
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "follow_up" })}>
                        <RefreshCw size={11} /> Follow Up
                      </Button>
                    </div>
                  )}
                  {/* ROI metrics */}
                  {(r.estimatedReach || r.actualLeadsGenerated || r.actualBookingsGenerated) ? (
                    <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-border">
                      {[
                        { label: "Est. Reach", value: fmtNum(r.estimatedReach) },
                        { label: "Leads", value: fmtNum(r.actualLeadsGenerated) },
                        { label: "Bookings", value: fmtNum(r.actualBookingsGenerated) },
                      ].map(m => (
                        <div key={m.label} className="text-center">
                          <div className="text-sm font-semibold text-foreground">{m.value}</div>
                          <div className="text-xs text-muted-foreground">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Advertising Page ─────────────────────────────────────────────────
export default function Advertising() {
  const [tab, setTab] = useState<"meta" | "influencer" | "outreach">("meta");

  const TABS = [
    { id: "meta" as const, label: "Meta Ads", icon: <BarChart3 size={15} /> },
    { id: "influencer" as const, label: "Influencer", icon: <Instagram size={15} /> },
    { id: "outreach" as const, label: "Community Outreach", icon: <Building2 size={15} /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Advertising</h1>
        <p className="text-muted-foreground text-sm mt-1">Paid media, influencer partnerships, and community sponsorships</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "meta" && <MetaAds embedded />}
      {tab === "influencer" && <InfluencerTab />}
      {tab === "outreach" && <OutreachTab />}
    </div>
  );
}
