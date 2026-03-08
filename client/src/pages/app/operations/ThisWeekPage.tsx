import { Link } from "wouter";
import { AlertTriangle, ArrowRight, CheckSquare, Clock3, Inbox, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  formatDateOnly,
  formatDateTime,
  formatEnumLabel,
  formatVenueLabel,
  type ThisWeekSummary,
} from "@/lib/reporting";
import { appRoutes, DEFAULT_VENUE_SLUG } from "@/lib/routes";

type ThisWeekPageProps = {
  venueSlug?: string;
};

function countTone(value: number) {
  if (value >= 4) return "text-red-600";
  if (value >= 2) return "text-amber-600";
  return "text-foreground";
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Inbox;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`mt-2 text-3xl font-semibold ${countTone(value)}`}>{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-full bg-[#F5C72C]/15 p-3 text-[#B8900A]">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function OwnershipColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{ kind: "issue" | "task"; id: number; title: string; status: string }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{items.length} active item{items.length === 1 ? "" : "s"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing in this bucket right now.</p>
        ) : (
          items.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{formatEnumLabel(item.kind)} · {formatEnumLabel(item.status)}</p>
                </div>
                <Badge variant="outline">#{item.id}</Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function ThisWeekPage({ venueSlug = DEFAULT_VENUE_SLUG }: ThisWeekPageProps) {
  const venueLabel = formatVenueLabel(venueSlug);
  const venueRoutes = appRoutes.venue(venueSlug);
  const { data } = trpc.reporting.getThisWeekSummary.useQuery({ venueSlug });

  const summary = data as ThisWeekSummary | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B8900A]">Operations / This Week</p>
          <h1 className="text-3xl font-semibold text-foreground">{venueLabel} Weekly Coordination</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Weekly execution workspace for Studio Soo, venue admin, and HQ support. Review the active queue, ownership buckets,
            and upcoming work without changing the wider operations architecture.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={venueRoutes.operations.inbox}>Open Inbox</Link></Button>
          <Button asChild variant="outline"><Link href={venueRoutes.operations.issues}>Manage Issues</Link></Button>
          <Button asChild><Link href={venueRoutes.operations.tasks}>Manage Tasks</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="New inbox items" value={summary?.counts.newInboxItems ?? 0} description="Items still awaiting triage" icon={Inbox} />
        <SummaryCard title="Open issues" value={summary?.counts.openIssues ?? 0} description="Blockers and unresolved gaps" icon={AlertTriangle} />
        <SummaryCard title="Due tasks" value={summary?.counts.dueTasks ?? 0} description="Open tasks with target dates" icon={CheckSquare} />
        <SummaryCard title="Blocked items" value={summary?.counts.blockedItems ?? 0} description="Needs escalation or owner response" icon={Clock3} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Sparkles className="h-5 w-5 text-[#F5C72C]" /> Top priorities</CardTitle>
            <CardDescription>Fast scan of the most important unresolved work this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.topPriorities ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No active priorities yet.</p>
            ) : (
              summary?.topPriorities.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatEnumLabel(item.kind)}</Badge>
                    <Badge variant="secondary">{formatEnumLabel(item.status)}</Badge>
                    <Badge variant="secondary">{formatEnumLabel(item.ownershipState)}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">{item.title}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Quick actions</CardTitle>
            <CardDescription>Jump into the operational workspaces most likely needed this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                title: "Triage new inbox submissions",
                description: "Create linked issues or tasks, then mark updates processed.",
                href: venueRoutes.operations.inbox,
              },
              {
                title: "Resolve open issues",
                description: "Update status, ownership, assignee, and due dates for blockers.",
                href: venueRoutes.operations.issues,
              },
              {
                title: "Execute weekly tasks",
                description: "Track work items and push selected tasks into Asana when needed.",
                href: venueRoutes.operations.tasks,
              },
            ].map((action) => (
              <Link key={action.href} href={action.href} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{action.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <OwnershipColumn title="Awaiting Studio Soo" items={summary?.ownershipBuckets.awaiting_studio_soo ?? []} />
        <OwnershipColumn title="Awaiting Venue" items={summary?.ownershipBuckets.awaiting_venue ?? []} />
        <OwnershipColumn title="Awaiting HQ" items={summary?.ownershipBuckets.awaiting_hq ?? []} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming inbox items</CardTitle>
            <CardDescription>Most recent updates waiting for action.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.upcoming.inbox ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No inbox items.</p> : summary?.upcoming.inbox.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{formatEnumLabel(item.sourceType)}</Badge>
                  <Badge variant="secondary">{formatEnumLabel(item.status)}</Badge>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-foreground">{item.rawText}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.submittedAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open issues</CardTitle>
            <CardDescription>Current blockers and unresolved risks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.upcoming.issues ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No open issues.</p> : summary?.upcoming.issues.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{formatEnumLabel(item.priority)}</Badge>
                  <Badge variant="secondary">{formatEnumLabel(item.status)}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">Assigned to {item.assignedTo} · Due {formatDateOnly(item.dueAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming tasks</CardTitle>
            <CardDescription>Weekly execution work in flight.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.upcoming.tasks ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No active tasks.</p> : summary?.upcoming.tasks.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{formatEnumLabel(item.status)}</Badge>
                  <Badge variant="secondary">{formatEnumLabel(item.ownershipState)}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">Assigned to {item.assignedTo} · Due {formatDateOnly(item.dueAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
