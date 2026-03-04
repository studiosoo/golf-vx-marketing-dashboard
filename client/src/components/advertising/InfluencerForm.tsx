import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { INFLUENCER_STATUS_CONFIG } from "./types";

interface InfluencerFormProps {
  onSuccess: () => void;
  initial?: Record<string, unknown>;
}

export function InfluencerForm({ onSuccess, initial }: InfluencerFormProps) {
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
    handle: (initial?.handle as string) || "",
    platform: (initial?.platform as string) || "instagram",
    followerCount: initial?.followerCount ? String(initial.followerCount) : "",
    contactName: (initial?.contactName as string) || "",
    contactEmail: (initial?.contactEmail as string) || "",
    dealDate: initial?.dealDate ? String(initial.dealDate).split("T")[0] : "",
    totalCost: (initial?.totalCost as string) || "",
    deliverables: (initial?.deliverables as string) || "",
    campaignGoal: (initial?.campaignGoal as string) || "",
    targetAudience: (initial?.targetAudience as string) || "",
    status: (initial?.status as string) || "contracted",
    actualReach: initial?.actualReach ? String(initial.actualReach) : "",
    actualImpressions: initial?.actualImpressions ? String(initial.actualImpressions) : "",
    actualEngagements: initial?.actualEngagements ? String(initial.actualEngagements) : "",
    actualLeadsGenerated: initial?.actualLeadsGenerated ? String(initial.actualLeadsGenerated) : "",
    actualBookingsGenerated: initial?.actualBookingsGenerated ? String(initial.actualBookingsGenerated) : "",
    actualRevenue: (initial?.actualRevenue as string) || "",
    notes: (initial?.notes as string) || "",
  });

  const handleSubmit = () => {
    if (!form.handle) return toast({ title: "Handle is required", variant: "destructive" });
    const payload = {
      handle: form.handle,
      platform: form.platform as "instagram" | "tiktok" | "youtube" | "facebook" | "other",
      followerCount: form.followerCount ? parseInt(form.followerCount) : undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      dealDate: form.dealDate || undefined,
      totalCost: form.totalCost || undefined,
      deliverables: form.deliverables || undefined,
      campaignGoal: form.campaignGoal || undefined,
      targetAudience: form.targetAudience || undefined,
      status: form.status as "negotiating" | "contracted" | "in_progress" | "completed" | "cancelled",
      actualReach: form.actualReach ? parseInt(form.actualReach) : undefined,
      actualImpressions: form.actualImpressions ? parseInt(form.actualImpressions) : undefined,
      actualEngagements: form.actualEngagements ? parseInt(form.actualEngagements) : undefined,
      actualLeadsGenerated: form.actualLeadsGenerated ? parseInt(form.actualLeadsGenerated) : undefined,
      actualBookingsGenerated: form.actualBookingsGenerated ? parseInt(form.actualBookingsGenerated) : undefined,
      actualRevenue: form.actualRevenue || undefined,
      notes: form.notes || undefined,
    };
    if (initial?.id) {
      update.mutate({ id: initial.id as number, updates: payload });
    } else {
      create.mutate(payload);
    }
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) =>
    setForm(p => ({ ...p, [k]: typeof e === "string" ? e : e.target.value }));

  const performanceFields = [
    { key: "actualReach", label: "Reach" },
    { key: "actualImpressions", label: "Impressions" },
    { key: "actualEngagements", label: "Engagements" },
    { key: "actualLeadsGenerated", label: "Leads" },
    { key: "actualBookingsGenerated", label: "Bookings" },
    { key: "actualRevenue", label: "Revenue ($)" },
  ] as const;

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {performanceFields.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label>{label}</Label>
            <Input
              type={key === "actualRevenue" ? "text" : "number"}
              placeholder="0"
              value={form[key]}
              onChange={f(key)}
            />
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
