import { FileStack } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { REPORT_TEMPLATES } from "@/lib/reporting";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#B8900A]">Reports</p>
        <h1 className="text-3xl font-semibold text-foreground">Report Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Supported report templates available for quick-start creation in the Phase 2 reports workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORT_TEMPLATES.map((template) => (
          <Card key={template.type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><FileStack className="h-5 w-5 text-[#F5C72C]" /> {template.title}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant="secondary">{template.cadence}</Badge>
              <span className="text-xs text-muted-foreground">Type: {template.type}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
