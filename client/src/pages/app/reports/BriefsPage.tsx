import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BRIEF_STATUS_OPTIONS, BRIEF_TEMPLATES, formatVenueLabel, joinLines, splitLines, type BriefTemplateType, type BriefStatus } from "@/lib/reporting";
import { DEFAULT_VENUE_SLUG } from "@/lib/routes";

type BriefsPageProps = {
  venueSlug?: string;
};

export default function BriefsPage({ venueSlug = DEFAULT_VENUE_SLUG }: BriefsPageProps) {
  const venueLabel = formatVenueLabel(venueSlug);
  const utils = trpc.useUtils();
  const { data: briefs = [] } = trpc.reporting.listBriefs.useQuery({ venueSlug });
  const createBrief = trpc.reporting.createBrief.useMutation({
    onSuccess: async () => {
      toast.success("Brief created");
      await utils.reporting.listBriefs.invalidate({ venueSlug });
    },
  });
  const updateBrief = trpc.reporting.updateBrief.useMutation({
    onSuccess: async () => {
      toast.success("Brief updated");
      await utils.reporting.listBriefs.invalidate({ venueSlug });
    },
  });

  const [selectedBriefId, setSelectedBriefId] = useState<number | null>(null);
  const [briefType, setBriefType] = useState<BriefTemplateType>("weekly_ops");
  const [title, setTitle] = useState("Weekly Ops Brief");
  const [status, setStatus] = useState<BriefStatus>("draft");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateRangeLabel, setDateRangeLabel] = useState("");
  const [summary, setSummary] = useState("");
  const [topHighlights, setTopHighlights] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextActions, setNextActions] = useState("");

  const activeBrief = useMemo(
    () => briefs.find((brief) => brief.id === selectedBriefId) ?? null,
    [briefs, selectedBriefId]
  );

  const hydrateEditor = (brief: typeof briefs[number]) => {
    setSelectedBriefId(brief.id);
    setBriefType(brief.briefType);
    setTitle(brief.title);
    setStatus(brief.status);
    setEffectiveDate(brief.content.effectiveDate || new Date().toISOString().slice(0, 10));
    setDateRangeLabel(brief.content.dateRangeLabel || "");
    setSummary(brief.content.summary || "");
    setTopHighlights(joinLines(brief.content.topHighlights));
    setBlockers(joinLines(brief.content.blockers));
    setNextActions(joinLines(brief.content.nextActions));
  };

  const resetEditor = () => {
    setSelectedBriefId(null);
    setBriefType("weekly_ops");
    setTitle("Weekly Ops Brief");
    setStatus("draft");
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setDateRangeLabel("");
    setSummary("");
    setTopHighlights("");
    setBlockers("");
    setNextActions("");
  };

  const handleBriefTypeChange = (value: BriefTemplateType) => {
    setBriefType(value);
    const template = BRIEF_TEMPLATES.find((item) => item.type === value);
    if (!selectedBriefId && template) setTitle(template.title);
  };

  const payload = {
    effectiveDate,
    dateRangeLabel,
    summary,
    topHighlights: splitLines(topHighlights),
    blockers: splitLines(blockers),
    nextActions: splitLines(nextActions),
  };

  const saveBrief = async () => {
    if (selectedBriefId) {
      await updateBrief.mutateAsync({
        id: selectedBriefId,
        title,
        status,
        content: payload,
      });
    } else {
      const created = await createBrief.mutateAsync({
        venueSlug,
        briefType,
        title,
        status,
        content: payload,
      });
      hydrateEditor(created);
    }
  };

  const shareBrief = async () => {
    const sharePayload = `${title}\n${summary}`;
    if (navigator.share) {
      await navigator.share({ title, text: sharePayload });
    } else {
      await navigator.clipboard.writeText(sharePayload);
      toast.success("Brief summary copied to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B8900A]">Reports / Briefs</p>
          <h1 className="text-3xl font-semibold text-foreground">{venueLabel} Briefs</h1>
          <p className="text-sm text-muted-foreground mt-1">Lightweight communication outputs for weekly ops, blockers, promotion updates, and branch summaries.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button onClick={shareBrief}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-[#F5C72C]" /> Briefs</CardTitle>
            <CardDescription>Create a new brief or reopen an existing draft.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={resetEditor}>New Brief</Button>
            {briefs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No briefs created yet.</p>
            ) : briefs.map((brief) => (
              <button
                key={brief.id}
                type="button"
                onClick={() => hydrateEditor(brief)}
                className={`w-full rounded-lg border p-4 text-left transition ${selectedBriefId === brief.id ? "border-[#F5C72C] bg-[#F5C72C]/5" : "hover:bg-muted/20"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{brief.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{brief.content.dateRangeLabel || brief.content.effectiveDate || "No timing yet"}</p>
                  </div>
                  <Badge variant={brief.status === "shared" ? "default" : "secondary"}>{brief.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{brief.content.summary || "No summary yet"}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedBriefId ? "Edit Brief" : "Create Brief"}</CardTitle>
            <CardDescription>Title, effective timing, summary, highlights, blockers, and next actions are editable in this Phase 2 MVP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Brief Type</Label>
                <Select value={briefType} onValueChange={(value) => handleBriefTypeChange(value as BriefTemplateType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRIEF_TEMPLATES.map((template) => (
                      <SelectItem key={template.type} value={template.type}>{template.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as BriefStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRIEF_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Effective Date</Label>
                <Input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date Range Label</Label>
                <Input value={dateRangeLabel} onChange={(event) => setDateRangeLabel(event.target.value)} placeholder="This Week / Mar 1-7" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Top Highlights</Label>
              <Textarea rows={4} value={topHighlights} onChange={(event) => setTopHighlights(event.target.value)} placeholder="One item per line" />
            </div>
            <div className="space-y-2">
              <Label>Blockers / Issues</Label>
              <Textarea rows={4} value={blockers} onChange={(event) => setBlockers(event.target.value)} placeholder="One item per line" />
            </div>
            <div className="space-y-2">
              <Label>Next Actions</Label>
              <Textarea rows={4} value={nextActions} onChange={(event) => setNextActions(event.target.value)} placeholder="One item per line" />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p>Lightweight sharing is supported through browser print and native share/copy behavior.</p>
              <Button onClick={saveBrief} disabled={createBrief.isPending || updateBrief.isPending}>{selectedBriefId ? "Save Brief" : "Create Brief"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
