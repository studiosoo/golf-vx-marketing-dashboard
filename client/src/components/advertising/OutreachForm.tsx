import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { OUTREACH_STATUS_CONFIG, REQUEST_TYPE_LABELS } from "./types";

interface OutreachFormProps {
  onSuccess: () => void;
  initial?: Record<string, unknown>;
}

export function OutreachForm({ onSuccess, initial }: OutreachFormProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const create = trpc.outreach.create.useMutation({
    onSuccess: () => {
      utils.outreach.list.invalidate();
      utils.outreach.getSummary.invalidate();
      toast({ title: "Outreach request added" });
      onSuccess();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const update = trpc.outreach.update.useMutation({
    onSuccess: () => {
      utils.outreach.list.invalidate();
      utils.outreach.getSummary.invalidate();
      toast({ title: "Request updated" });
      onSuccess();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const [form, setForm] = useState({
    orgName: (initial?.orgName as string) || "",
    orgType: (initial?.orgType as string) || "other",
    contactName: (initial?.contactName as string) || "",
    contactEmail: (initial?.contactEmail as string) || "",
    contactPhone: (initial?.contactPhone as string) || "",
    website: (initial?.website as string) || "",
    ein: (initial?.ein as string) || "",
    is501c3: (initial?.is501c3 as boolean) || false,
    requestType: (initial?.requestType as string) || "gift_card",
    requestDate: initial?.requestDate ? String(initial.requestDate).split("T")[0] : "",
    eventName: (initial?.eventName as string) || "",
    eventDate: initial?.eventDate ? String(initial.eventDate).split("T")[0] : "",
    eventLocation: (initial?.eventLocation as string) || "",
    estimatedAttendees: initial?.estimatedAttendees ? String(initial.estimatedAttendees) : "",
    requestedAmount: (initial?.requestedAmount as string) || "",
    requestDescription: (initial?.requestDescription as string) || "",
    status: (initial?.status as string) || "received",
    decisionNotes: (initial?.decisionNotes as string) || "",
    rejectionReason: (initial?.rejectionReason as string) || "",
    actualDonationType: (initial?.actualDonationType as string) || "",
    actualCashValue: (initial?.actualCashValue as string) || "",
    actualPerceivedValue: (initial?.actualPerceivedValue as string) || "",
    benefitsReceived: (initial?.benefitsReceived as string) || "",
    estimatedReach: initial?.estimatedReach ? String(initial.estimatedReach) : "",
    actualLeadsGenerated: initial?.actualLeadsGenerated ? String(initial.actualLeadsGenerated) : "",
    actualBookingsGenerated: initial?.actualBookingsGenerated ? String(initial.actualBookingsGenerated) : "",
    actualRevenue: (initial?.actualRevenue as string) || "",
    roiNotes: (initial?.roiNotes as string) || "",
    priority: (initial?.priority as string) || "medium",
    notes: (initial?.notes as string) || "",
  });

  const handleSubmit = () => {
    if (!form.orgName) return toast({ title: "Organization name is required", variant: "destructive" });
    const payload = {
      orgName: form.orgName,
      orgType: form.orgType as "school_pta" | "school_sports" | "nonprofit" | "civic" | "arts_culture" | "sports_league" | "religious" | "business" | "other",
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      website: form.website || undefined,
      ein: form.ein || undefined,
      is501c3: form.is501c3,
      requestType: form.requestType as "cash_donation" | "gift_card" | "product_donation" | "service_donation" | "sponsorship" | "partnership" | "networking",
      requestDate: form.requestDate || undefined,
      eventName: form.eventName || undefined,
      eventDate: form.eventDate || undefined,
      eventLocation: form.eventLocation || undefined,
      estimatedAttendees: form.estimatedAttendees ? parseInt(form.estimatedAttendees) : undefined,
      requestedAmount: form.requestedAmount || undefined,
      requestDescription: form.requestDescription || undefined,
      status: form.status as "received" | "under_review" | "approved" | "rejected" | "fulfilled" | "follow_up",
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
      priority: form.priority as "low" | "medium" | "high",
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

  const roiFields = [
    { key: "estimatedReach", label: "Est. Reach" },
    { key: "actualLeadsGenerated", label: "Leads Generated" },
    { key: "actualBookingsGenerated", label: "Bookings" },
  ] as const;

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
        {roiFields.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label>{label}</Label>
            <Input type="number" placeholder="0" value={form[key]} onChange={f(key)} />
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
