import { FolderArchive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { DEFAULT_VENUE_SLUG } from "@/lib/routes";

type ArchivePageProps = {
  venueSlug?: string;
};

export default function ArchivePage({ venueSlug = DEFAULT_VENUE_SLUG }: ArchivePageProps) {
  const { data: reports = [] } = trpc.reporting.listReports.useQuery({ venueSlug });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#B8900A]">Reports</p>
        <h1 className="text-3xl font-semibold text-foreground">Archive & History</h1>
        <p className="text-sm text-muted-foreground mt-1">Historical report drafts and outputs stored by the new Phase 2 persistence layer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FolderArchive className="h-5 w-5 text-[#F5C72C]" /> Stored Reports</CardTitle>
          <CardDescription>Archive visibility is lightweight in Phase 2 but backed by real saved records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No report history yet.</p>
          ) : reports.map((report) => (
            <div key={report.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{report.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{report.dateRangeLabel || "No date label"}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{report.reportType.replace(/_/g, " ")}</Badge>
                  <Badge variant={report.status === "archived" ? "secondary" : "outline"}>{report.status}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">Created {new Date(report.createdAt).toLocaleString()} · Updated {new Date(report.updatedAt).toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
