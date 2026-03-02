import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export default function WebsiteViewer() {
  const websiteUrl = "https://playgolfvx.com/arlington-heights/";

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Golf VX Website</h1>
          <p className="text-muted-foreground mt-1">
            Arlington Heights Location
          </p>
        </div>
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Open in new tab
        </a>
      </div>

      <Card>
        <CardContent className="p-0">
          <iframe
            src={websiteUrl}
            className="w-full h-[calc(100vh-200px)] border-0"
            title="Golf VX Arlington Heights Website"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </CardContent>
      </Card>
    </div>
  );
}
