import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { BarChart3, Clock3, FilePlus2, FileStack, FolderArchive, LibraryBig, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { appRoutes, DEFAULT_VENUE_SLUG } from "@/lib/routes";
import { formatVenueLabel, REPORT_TEMPLATES, type ReportTemplateType } from "@/lib/reporting";

type ReportsWorkspacePageProps = {
  venueSlug?: string;
};

export default function ReportsWorkspacePage({ venueSlug = DEFAULT_VENUE_SLUG }: ReportsWorkspacePageProps) {
  const reportQuery = trpc.reporting.listReports.useQuery({ venueSlug });
  const templatesQuery = trpc.reporting.templates.useQuery();
  const utils = trpc.useUtils();
  const createDraft = trpc.reporting.createReportDraft.useMutation({
    onSuccess: async () => {
      toast.success("Report draft created");
      await utils.reporting.listReports.invalidate({ venueSlug });
    },
  });

  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateType>("weekly_executive");
  const [title, setTitle] = useState("Arlington Heights Weekly Executive Report");
  const [dateRangeLabel, setDateRangeLabel] = useState("This Week");
  const [summary, setSummary] = useState("Weekly venue summary draft for leadership review.");

  const reports = reportQuery.data ?? [];
  const templates = templatesQuery.data?.reports ?? REPORT_TEMPLATES;
  const venueLabel = formatVenueLabel(venueSlug);

  const recentDrafts = useMemo(
    () => reports.filter((report) => report.status !== "archived").slice(0, 5),
    [reports]
  );

  const archivedReports = useMemo(
    () => reports.filter((report) => report.status === "archived"),
    [reports]
  );

  const handleTemplateChange = (value: ReportTemplateType) => {
    setSelectedTemplate(value);
    const template = REPORT_TEMPLATES.find((item) => item.type === value);
    if (template) {
      setTitle(template.title);
      setSummary(template.description);
    }
  };

  const handleCreateDraft = async () => {
    await createDraft.mutateAsync({
      venueSlug,
      reportType: selectedTemplate,
      title,
      dateRangeLabel,
      status: "draft",
      content: {
        summary,
        sections: [
          { heading: "Summary", body: summary },
        ],
        highlights: [],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B8900A]">Reports Workspace</p>
          <h1 className="text-3xl font-semibold text-foreground">{venueLabel} Reports</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Build recurring report drafts, start from approved templates, and keep archival outputs inside the new top-level Reports workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={appRoutes.venue(venueSlug).reports.templates}><Button variant="outline">Templates</Button></Link>
          <Link href={appRoutes.venue(venueSlug).reports.archive}><Button variant="outline">Archive</Button></Link>
          <Link href={appRoutes.venue(venueSlug).reports.briefs}><Button>Open Briefs</Button></Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FilePlus2 className="h-5 w-5 text-[#F5C72C]" /> Quick Start</CardTitle>
            <CardDescription>Create a new report draft from a supported report template.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={selectedTemplate} onValueChange={(value) => handleTemplateChange(value as ReportTemplateType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_TEMPLATES.map((template) => (
                      <SelectItem key={template.type} value={template.type}>{template.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Range / Effective Label</Label>
                <Input value={dateRangeLabel} onChange={(event) => setDateRangeLabel(event.target.value)} placeholder="This Week" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Report Title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kickoff Summary</Label>
              <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-dashed border-[#F5C72C]/50 bg-[#F5C72C]/5 p-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Templates available now</p>
                <p>Weekly executive, monthly marketing, and paid media reports are ready as MVP templates.</p>
              </div>
              <Button onClick={handleCreateDraft} disabled={createDraft.isPending}>{createDraft.isPending ? "Creating…" : "Create Draft"}</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LibraryBig className="h-5 w-5 text-[#F5C72C]" /> Templates</CardTitle>
              <CardDescription>Supported report definitions for Phase 2.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => (
                <div key={template.type} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{template.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    </div>
                    <Badge variant="secondary">{template.cadence}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#F5C72C]" /> Workspace Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/40 p-3"><p className="text-2xl font-semibold">{reports.length}</p><p className="text-xs text-muted-foreground">Total drafts/runs</p></div>
              <div className="rounded-lg bg-muted/40 p-3"><p className="text-2xl font-semibold">{recentDrafts.length}</p><p className="text-xs text-muted-foreground">Recent drafts</p></div>
              <div className="rounded-lg bg-muted/40 p-3"><p className="text-2xl font-semibold">{archivedReports.length}</p><p className="text-xs text-muted-foreground">Archived</p></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-[#F5C72C]" /> Recent Drafts</CardTitle>
            <CardDescription>Latest working reports kept in a draft-ready state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDrafts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No drafts yet. Use Quick Start to create the first one.</p>
            ) : recentDrafts.map((report) => (
              <div key={report.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{report.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{report.dateRangeLabel || "No date range label"}</p>
                  </div>
                  <Badge variant={report.status === "ready" ? "default" : "secondary"}>{report.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{report.content.summary || "No summary yet"}</p>
                <p className="text-xs text-muted-foreground mt-3">Updated {new Date(report.updatedAt).toLocaleString()} by {report.createdBy}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FolderArchive className="h-5 w-5 text-[#F5C72C]" /> Archive / History</CardTitle>
            <CardDescription>Historical outputs are backed by the same persistence layer and surfaced here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No report history yet.</p>
            ) : reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{report.title}</p>
                  <p className="text-xs text-muted-foreground">{report.dateRangeLabel || "Unscheduled"} · {new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{report.reportType.replace(/_/g, " ")}</Badge>
                  <Badge variant={report.status === "archived" ? "secondary" : "outline"}>{report.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-[#F5C72C]" /> Reports Workspace Notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
          <div className="rounded-lg border p-4">Templates are static config for Phase 2 to keep the implementation low-risk and fast to adopt.</div>
          <div className="rounded-lg border p-4">Recent drafts and archive cards are backed by real minimal persistence, not placeholder-only UI.</div>
          <div className="rounded-lg border p-4">Briefs are treated as a sister workspace under Reports for lightweight communication outputs.</div>
        </CardContent>
      </Card>
    </div>
  );
}
