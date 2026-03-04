import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, Users, Target, Ticket,
  Plus, Building2, MapPin, Globe, Calendar,
  Edit2, Trash2,
} from "lucide-react";
import { EVENT_STATUS_COLORS, EVENT_TYPE_LABELS } from "./types";

type EventFormState = {
  eventName: string;
  eventType: "trade_show" | "expo" | "sponsorship" | "community_event" | "golf_tournament" | "other";
  venue: string;
  location: string;
  eventDate: string;
  eventEndDate: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  boothCost: string;
  totalCost: string;
  expectedVisitors: string;
  boothSize: string;
  contactPerson: string;
  website: string;
  notes: string;
};

type EditFormState = {
  actualVisitors: string;
  promosDistributed: string;
  leadsCollected: string;
  teamSignups: string;
  membershipSignups: string;
  revenue: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  notes: string;
};

const INITIAL_FORM: EventFormState = {
  eventName: "", eventType: "trade_show",
  venue: "", location: "", eventDate: "", eventEndDate: "",
  status: "upcoming", boothCost: "", totalCost: "",
  expectedVisitors: "", boothSize: "", contactPerson: "",
  website: "", notes: "",
};

const INITIAL_EDIT_FORM: EditFormState = {
  actualVisitors: "", promosDistributed: "", leadsCollected: "",
  teamSignups: "", membershipSignups: "", revenue: "",
  status: "completed", notes: "",
};

const EVENT_STATUSES = ["upcoming", "active", "completed", "cancelled"] as const;

export function EventsTab() {
  const { data: events, isLoading, refetch } = trpc.eventAd.list.useQuery();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<{ id: number } & Record<string, unknown> | null>(null);
  const [form, setForm] = useState<EventFormState>(INITIAL_FORM);
  const [editForm, setEditForm] = useState<EditFormState>(INITIAL_EDIT_FORM);

  const createMutation = trpc.eventAd.create.useMutation({
    onSuccess: () => {
      toast({ title: "Event added" });
      setShowForm(false);
      refetch();
      setForm(INITIAL_FORM);
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const updateMutation = trpc.eventAd.update.useMutation({
    onSuccess: () => { toast({ title: "Updated" }); setEditItem(null); refetch(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = trpc.eventAd.delete.useMutation({
    onSuccess: () => { toast({ title: "Removed" }); refetch(); },
  });

  const handleCreate = () => {
    if (!form.eventName) return;
    createMutation.mutate({
      eventName: form.eventName,
      eventType: form.eventType,
      venue: form.venue || undefined,
      location: form.location || undefined,
      eventDate: form.eventDate || undefined,
      eventEndDate: form.eventEndDate || undefined,
      status: form.status,
      boothCost: form.boothCost ? parseFloat(form.boothCost) : undefined,
      totalCost: form.totalCost ? parseFloat(form.totalCost) : undefined,
      expectedVisitors: form.expectedVisitors ? parseInt(form.expectedVisitors) : undefined,
      boothSize: form.boothSize || undefined,
      contactPerson: form.contactPerson || undefined,
      website: form.website || undefined,
      notes: form.notes || undefined,
    });
  };

  const handleUpdate = (id: number) => {
    updateMutation.mutate({
      id,
      actualVisitors: editForm.actualVisitors ? parseInt(editForm.actualVisitors) : undefined,
      promosDistributed: editForm.promosDistributed ? parseInt(editForm.promosDistributed) : undefined,
      leadsCollected: editForm.leadsCollected ? parseInt(editForm.leadsCollected) : undefined,
      teamSignups: editForm.teamSignups ? parseInt(editForm.teamSignups) : undefined,
      membershipSignups: editForm.membershipSignups ? parseInt(editForm.membershipSignups) : undefined,
      revenue: editForm.revenue ? parseFloat(editForm.revenue) : undefined,
      status: editForm.status,
      notes: editForm.notes || undefined,
    });
  };

  const totalSpend = events?.reduce((s, e) => s + parseFloat(String(e.totalCost || 0)), 0) ?? 0;
  const totalVisitors = events?.reduce((s, e) => s + (e.actualVisitors || 0), 0) ?? 0;
  const totalLeads = events?.reduce((s, e) => s + (e.leadsCollected || 0), 0) ?? 0;
  const totalPromos = events?.reduce((s, e) => s + (e.promosDistributed || 0), 0) ?? 0;

  const setField = (k: keyof EventFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) =>
    setForm(f => ({ ...f, [k]: typeof e === "string" ? e : e.target.value }));

  const setEditField = (k: keyof EditFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) =>
    setEditForm(f => ({ ...f, [k]: typeof e === "string" ? e : e.target.value }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Spend", value: `$${totalSpend.toLocaleString()}`, icon: <DollarSign size={18} className="text-yellow-400" />, bg: "bg-yellow-500/10" },
          { label: "Total Visitors Reached", value: totalVisitors.toLocaleString(), icon: <Users size={18} className="text-blue-400" />, bg: "bg-blue-500/10" },
          { label: "Leads Collected", value: String(totalLeads), icon: <Target size={18} className="text-green-400" />, bg: "bg-green-500/10" },
          { label: "Promos Distributed", value: String(totalPromos), icon: <Ticket size={18} className="text-purple-400" />, bg: "bg-purple-500/10" },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>{kpi.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Events & Trade Shows</h2>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus size={14} /> Add Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Event / Trade Show</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Event Name *</Label>
                  <Input value={form.eventName} onChange={setField("eventName")} placeholder="e.g. Chicago Golf Show 2026" />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.eventType} onValueChange={v => setForm(f => ({ ...f, eventType: v as EventFormState["eventType"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as EventFormState["status"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Venue</Label>
                  <Input value={form.venue} onChange={setField("venue")} placeholder="Donald E. Stephens Convention Center" />
                </div>
                <div className="col-span-2">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={setField("location")} placeholder="Rosemont, IL" />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={form.eventDate} onChange={setField("eventDate")} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={form.eventEndDate} onChange={setField("eventEndDate")} />
                </div>
                <div>
                  <Label>Booth Cost ($)</Label>
                  <Input type="number" value={form.boothCost} onChange={setField("boothCost")} placeholder="1200" />
                </div>
                <div>
                  <Label>Total Cost ($)</Label>
                  <Input type="number" value={form.totalCost} onChange={setField("totalCost")} placeholder="1500" />
                </div>
                <div>
                  <Label>Expected Visitors</Label>
                  <Input type="number" value={form.expectedVisitors} onChange={setField("expectedVisitors")} placeholder="2500" />
                </div>
                <div>
                  <Label>Booth Size</Label>
                  <Input value={form.boothSize} onChange={setField("boothSize")} placeholder="10x10" />
                </div>
                <div className="col-span-2">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={setField("website")} placeholder="https://chicagogolfshow.com" />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={setField("notes")} rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event cards */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading events…</div>
      ) : !events?.length ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Ticket size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No events yet. Click "Add Event" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map(ev => {
            const boothCost = parseFloat(String(ev.boothCost || 0));
            const totalCost = parseFloat(String(ev.totalCost || 0));
            const costPerVisitor = ev.actualVisitors && totalCost > 0 ? (totalCost / ev.actualVisitors).toFixed(2) : null;
            const isEditing = editItem?.id === ev.id;
            return (
              <Card key={ev.id} className="bg-card border-border">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                          <Ticket size={16} className="text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{ev.eventName}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">{EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}</Badge>
                            <Badge variant="outline" className={`text-xs border ${EVENT_STATUS_COLORS[ev.status]}`}>{ev.status}</Badge>
                            {ev.boothSize && <span className="text-xs text-muted-foreground">Booth: {ev.boothSize}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Date + location */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                        {ev.eventDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(ev.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            {ev.eventEndDate && ev.eventEndDate !== ev.eventDate && (
                              <> → {new Date(ev.eventEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                            )}
                          </span>
                        )}
                        {ev.venue && <span className="flex items-center gap-1"><Building2 size={11} />{ev.venue}</span>}
                        {ev.location && <span className="flex items-center gap-1"><MapPin size={11} />{ev.location}</span>}
                        {ev.website && (
                          <a href={ev.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-yellow-400 hover:underline">
                            <Globe size={11} />{ev.website.replace("https://","")}
                          </a>
                        )}
                      </div>

                      {/* Key metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Total Cost</p>
                          <p className="text-lg font-bold text-foreground">${totalCost.toLocaleString()}</p>
                          {boothCost > 0 && <p className="text-xs text-muted-foreground">Booth: ${boothCost.toLocaleString()}</p>}
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Visitors</p>
                          <p className="text-lg font-bold text-foreground">
                            {(ev.actualVisitors ?? ev.expectedVisitors ?? 0).toLocaleString()}
                          </p>
                          {ev.expectedVisitors && ev.actualVisitors != null && (
                            <p className="text-xs text-muted-foreground">Goal: {ev.expectedVisitors.toLocaleString()}</p>
                          )}
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Promos Out</p>
                          <p className="text-lg font-bold text-foreground">{ev.promosDistributed ?? 0}</p>
                          {ev.leadsCollected != null && (
                            <p className="text-xs text-muted-foreground">{ev.leadsCollected} leads</p>
                          )}
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Team Signups</p>
                          <p className="text-lg font-bold text-yellow-400">{ev.teamSignups ?? 0}</p>
                          {costPerVisitor && <p className="text-xs text-muted-foreground">${costPerVisitor}/visitor</p>}
                        </div>
                      </div>

                      {ev.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/20 rounded p-2 border border-border">{ev.notes}</p>
                      )}

                      {/* Inline edit for results */}
                      {isEditing && (
                        <div className="mt-4 p-4 bg-muted/20 rounded-lg border border-border space-y-3">
                          <p className="text-sm font-medium text-foreground">Update Results</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Actual Visitors</Label>
                              <Input type="number" value={editForm.actualVisitors} onChange={setEditField("actualVisitors")} placeholder={String(ev.actualVisitors ?? ev.expectedVisitors ?? "")} />
                            </div>
                            <div>
                              <Label className="text-xs">Promos Distributed</Label>
                              <Input type="number" value={editForm.promosDistributed} onChange={setEditField("promosDistributed")} placeholder={String(ev.promosDistributed ?? "")} />
                            </div>
                            <div>
                              <Label className="text-xs">Leads Collected</Label>
                              <Input type="number" value={editForm.leadsCollected} onChange={setEditField("leadsCollected")} placeholder={String(ev.leadsCollected ?? "")} />
                            </div>
                            <div>
                              <Label className="text-xs">Team Signups</Label>
                              <Input type="number" value={editForm.teamSignups} onChange={setEditField("teamSignups")} placeholder={String(ev.teamSignups ?? "")} />
                            </div>
                            <div>
                              <Label className="text-xs">Membership Signups</Label>
                              <Input type="number" value={editForm.membershipSignups} onChange={setEditField("membershipSignups")} placeholder={String(ev.membershipSignups ?? "")} />
                            </div>
                            <div>
                              <Label className="text-xs">Revenue ($)</Label>
                              <Input type="number" value={editForm.revenue} onChange={setEditField("revenue")} placeholder={String(ev.revenue ?? "0")} />
                            </div>
                            <div>
                              <Label className="text-xs">Status</Label>
                              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v as EditFormState["status"] }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {EVENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Notes</Label>
                              <Input value={editForm.notes} onChange={setEditField("notes")} placeholder={ev.notes || ""} />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setEditItem(null)}>Cancel</Button>
                            <Button size="sm" onClick={() => handleUpdate(ev.id)} disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? "Saving…" : "Save Results"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => {
                          setEditItem(ev as typeof editItem);
                          setEditForm({
                            actualVisitors: String(ev.actualVisitors ?? ""),
                            promosDistributed: String(ev.promosDistributed ?? ""),
                            leadsCollected: String(ev.leadsCollected ?? ""),
                            teamSignups: String(ev.teamSignups ?? ""),
                            membershipSignups: String(ev.membershipSignups ?? ""),
                            revenue: String(ev.revenue ?? ""),
                            status: ev.status as EditFormState["status"],
                            notes: ev.notes || "",
                          });
                        }}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => { if (confirm(`Remove ${ev.eventName}?`)) deleteMutation.mutate({ id: ev.id }); }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
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
