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
  DollarSign, FileText, BookOpen, Plus,
  Calendar, MapPin, Instagram, Globe, QrCode, Trash2,
} from "lucide-react";
import { PRINT_STATUS_COLORS, getContractProgress } from "./types";

type PrintFormState = {
  vendorName: string;
  publicationType: "magazine" | "newspaper" | "flyer" | "billboard" | "direct_mail" | "other";
  adSize: string;
  costPerMonth: string;
  contractMonths: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "cancelled" | "negotiating";
  qrDestination: string;
  instagramHandle: string;
  website: string;
  circulation: string;
  targetArea: string;
  notes: string;
};

const INITIAL_FORM: PrintFormState = {
  vendorName: "", publicationType: "magazine",
  adSize: "", costPerMonth: "", contractMonths: "1",
  startDate: "", endDate: "", status: "active",
  qrDestination: "", instagramHandle: "", website: "",
  circulation: "", targetArea: "", notes: "",
};

export function PrintTab() {
  const { data: ads, isLoading, refetch } = trpc.printAd.list.useQuery();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PrintFormState>(INITIAL_FORM);

  const createMutation = trpc.printAd.create.useMutation({
    onSuccess: () => { toast({ title: "Ad placement added" }); setShowForm(false); refetch(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = trpc.printAd.delete.useMutation({
    onSuccess: () => { toast({ title: "Removed" }); refetch(); },
  });

  const handleCreate = () => {
    if (!form.vendorName || !form.costPerMonth) return;
    createMutation.mutate({
      vendorName: form.vendorName,
      publicationType: form.publicationType,
      adSize: form.adSize || undefined,
      costPerMonth: parseFloat(form.costPerMonth),
      contractMonths: parseInt(form.contractMonths) || 1,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status,
      qrDestination: form.qrDestination || undefined,
      instagramHandle: form.instagramHandle || undefined,
      website: form.website || undefined,
      circulation: form.circulation ? parseInt(form.circulation) : undefined,
      targetArea: form.targetArea || undefined,
      notes: form.notes || undefined,
    });
  };

  const totalMonthlySpend = ads?.reduce((s, a) => s + parseFloat(String(a.costPerMonth || 0)), 0) ?? 0;
  const totalContractValue = ads?.reduce((s, a) => s + parseFloat(String(a.totalContractValue || 0)), 0) ?? 0;
  const activeCount = ads?.filter(a => a.status === "active").length ?? 0;

  const setField = (k: keyof PrintFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) =>
    setForm(f => ({ ...f, [k]: typeof e === "string" ? e : e.target.value }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10"><DollarSign size={18} className="text-[#F2DD48]" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Spend</p>
                <p className="text-xl font-bold text-foreground">${totalMonthlySpend.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><FileText size={18} className="text-blue-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Contract Value</p>
                <p className="text-xl font-bold text-foreground">${totalContractValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><BookOpen size={18} className="text-green-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Active Placements</p>
                <p className="text-xl font-bold text-foreground">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Print & Magazine Placements</h2>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus size={14} /> Add Placement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Print Ad Placement</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Vendor / Publication Name *</Label>
                  <Input value={form.vendorName} onChange={setField("vendorName")} placeholder="e.g. Stroll Magazine" />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.publicationType} onValueChange={v => setForm(f => ({ ...f, publicationType: v as PrintFormState["publicationType"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["magazine","newspaper","flyer","billboard","direct_mail","other"].map(t => (
                        <SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ad Size</Label>
                  <Input value={form.adSize} onChange={setField("adSize")} placeholder="Full Page, Half Page…" />
                </div>
                <div>
                  <Label>Cost / Month ($) *</Label>
                  <Input type="number" value={form.costPerMonth} onChange={setField("costPerMonth")} placeholder="650" />
                </div>
                <div>
                  <Label>Contract Months</Label>
                  <Input type="number" value={form.contractMonths} onChange={setField("contractMonths")} placeholder="12" />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={setField("startDate")} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate} onChange={setField("endDate")} />
                </div>
                <div className="col-span-2">
                  <Label>QR Code Destination URL</Label>
                  <Input value={form.qrDestination} onChange={setField("qrDestination")} placeholder="https://ah.playgolfvx.com" />
                </div>
                <div>
                  <Label>Instagram Handle</Label>
                  <Input value={form.instagramHandle} onChange={setField("instagramHandle")} placeholder="@handle" />
                </div>
                <div>
                  <Label>Target Area</Label>
                  <Input value={form.targetArea} onChange={setField("targetArea")} placeholder="Arlington Heights, IL" />
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

      {/* Ad cards */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading placements…</div>
      ) : !ads?.length ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <BookOpen size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No print placements yet. Click "Add Placement" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ads.map(ad => {
            const prog = getContractProgress(
              ad.startDate ? String(ad.startDate) : null,
              ad.endDate ? String(ad.endDate) : null,
              ad.contractMonths
            );
            const monthlySpend = parseFloat(String(ad.costPerMonth));
            const totalValue = parseFloat(String(ad.totalContractValue || 0));
            const spentToDate = monthlySpend * prog.elapsed;
            return (
              <Card key={ad.id} className="bg-card border-border">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                          <BookOpen size={16} className="text-[#F2DD48]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{ad.vendorName}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs capitalize">{ad.publicationType}</Badge>
                            {ad.adSize && <span className="text-xs text-muted-foreground">{ad.adSize}</span>}
                            <Badge variant="outline" className={`text-xs border ${PRINT_STATUS_COLORS[ad.status]}`}>{ad.status}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Key metrics row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Monthly Cost</p>
                          <p className="text-lg font-bold text-foreground">${monthlySpend.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Contract Value</p>
                          <p className="text-lg font-bold text-foreground">${totalValue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{ad.contractMonths} months</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Spent to Date</p>
                          <p className="text-lg font-bold text-[#F2DD48]">${spentToDate.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{prog.elapsed} of {ad.contractMonths} mo</p>
                        </div>
                      </div>

                      {/* Contract progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Contract Progress</span>
                          <span>{prog.pct}% — {prog.remaining} months remaining</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-[#F2DD48] rounded-full transition-all" style={{ width: `${prog.pct}%` }} />
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {ad.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(ad.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            {" → "}
                            {ad.endDate ? new Date(ad.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "ongoing"}
                          </span>
                        )}
                        {ad.targetArea && (
                          <span className="flex items-center gap-1"><MapPin size={11} />{ad.targetArea}</span>
                        )}
                        {ad.instagramHandle && (
                          <span className="flex items-center gap-1"><Instagram size={11} />{ad.instagramHandle}</span>
                        )}
                        {ad.qrDestination && (
                          <a href={ad.qrDestination} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#F2DD48] hover:underline">
                            <QrCode size={11} />QR → {ad.qrDestination}
                          </a>
                        )}
                        {ad.website && (
                          <a href={ad.website} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline">
                            <Globe size={11} />{ad.website.replace("https://","")}
                          </a>
                        )}
                      </div>

                      {ad.notes && (
                        <p className="mt-3 text-xs text-muted-foreground bg-muted/20 rounded p-2 border border-border">{ad.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost" size="sm"
                        className="text-[#E8453C] hover:text-red-300 hover:bg-[#E8453C]/10"
                        onClick={() => { if (confirm(`Remove ${ad.vendorName}?`)) deleteMutation.mutate({ id: ad.id }); }}
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
