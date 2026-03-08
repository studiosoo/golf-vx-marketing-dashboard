import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface PlaceholderConfig {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  icon: LucideIcon;
  status?: string;
}

export function createPlaceholderPage(config: PlaceholderConfig) {
  const Icon = config.icon;

  return function PlaceholderPage() {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] uppercase tracking-[0.18em] text-[#888888]">
                {config.eyebrow}
              </Badge>
              <Badge className="bg-[#F5C72C]/15 text-[#111111] hover:bg-[#F5C72C]/15">
                {config.status ?? "Phase 1 Placeholder"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#111111]">{config.title}</h1>
            <p className="text-sm text-[#666666] leading-6">{config.description}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#F5C72C]/15 flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6 text-[#111111]" />
          </div>
        </div>

        <Card className="border-[#E0E0E0]">
          <CardHeader>
            <CardTitle className="text-lg text-[#111111]">What Phase 1 establishes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {config.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-[#444444]">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#F5C72C]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#AAAAAA] mb-2">Next phase</p>
              <p className="text-sm text-[#555555]">
                This workspace is wired into the new Control Tower route model and navigation now, so detailed workflows can be layered in without redoing information architecture again.
              </p>
            </div>
            <Button variant="outline" className="gap-2" disabled>
              Detailed workflow lands in Phase 2
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };
}
