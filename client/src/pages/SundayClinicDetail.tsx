import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProgramMarketingPanel from "@/components/ProgramMarketingPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, UserPlus, TrendingUp, Calendar, Share2, Mail, Phone, X, Target, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type AttendeeType = "members" | "new_visitors";
type SourceModal = { source: string } | null;
type EventModal = { eventDate: string; label: string } | null;

function AttendeeListModal({
  open,
  onClose,
  type,
  minDate,
  maxDate,
}: {
  open: boolean;
  onClose: () => void;
  type: AttendeeType;
  minDate: string;
  maxDate: string;
}) {
  const { data: attendees, isLoading } = trpc.campaigns.getSundayClinicAttendeeList.useQuery(
    { type, minDate, maxDate },
    { enabled: open }
  );
  const sendSms = trpc.communication.sendSMS.useMutation({
    onSuccess: (r) => r.success ? toast({ title: "SMS sent!" }) : toast({ title: "SMS failed", description: r.error ?? "Twilio not configured", variant: "destructive" }),
    onError: (e) => toast({ title: "SMS error", description: e.message, variant: "destructive" }),
  });
  const sendEmail = trpc.communication.sendEmail.useMutation({
    onSuccess: (r) => r.success ? toast({ title: "Email sent!" }) : toast({ title: "Email failed", description: r.error ?? "SendGrid not configured — add SENDGRID_API_KEY in Settings → Secrets", variant: "destructive" }),
    onError: (e) => toast({ title: "Email error", description: e.message, variant: "destructive" }),
  });

  const title = type === "members" ? "Members Attended" : "New Visitors";
  const description = type === "members"
    ? "Existing members who attended Sunday Clinic events"
    : "Non-member attendees — potential conversion opportunities";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "members" ? <Users className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
            {title}
            {attendees && (
              <Badge variant="secondary" className="ml-2">{attendees.length}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !attendees?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              No {type === "members" ? "member" : "new visitor"} attendees found in this date range.
            </div>
          ) : (
            <div className="space-y-2">
              {attendees.map((a, idx) => (
                <div key={`${a.id ?? idx}-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {(a.firstName?.[0] || "?").toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {a.firstName} {a.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{a.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {a.email && (
                      <button onClick={() => sendEmail.mutate({ recipientId: a.id, recipientType: type === 'members' ? 'member' : 'lead', recipientName: `${a.firstName} ${a.lastName}`, email: a.email, subject: `Golf VX - Follow Up`, htmlBody: `<p>Hi ${a.firstName}, thanks for joining us at Golf VX!</p>` })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" title="Send email">
                        <Mail className="h-3 w-3" />
                        <span className="hidden sm:inline truncate max-w-[160px]">{a.email}</span>
                      </button>
                    )}
                    {a.phone && (
                      <button onClick={() => sendSms.mutate({ recipientId: a.id, recipientType: type === 'members' ? 'member' : 'lead', recipientName: `${a.firstName} ${a.lastName}`, phone: a.phone, body: `Hi ${a.firstName}! Thanks for joining us at Golf VX Drive Day. Book your next session at playgolfvx.com!` })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" title="Send SMS">
                        <Phone className="h-3 w-3" />
                        <span className="hidden sm:inline">{a.phone}</span>
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {a.date ? new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between">
          {attendees && attendees.length > 0 ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => attendees.forEach(a => a.email && sendEmail.mutate({ recipientId: a.id, recipientType: type === 'members' ? 'member' : 'lead', recipientName: `${a.firstName} ${a.lastName}`, email: a.email, subject: `Golf VX - Follow Up`, htmlBody: `<p>Hi ${a.firstName}, thanks for joining us at Golf VX!</p>` }))} disabled={sendEmail.isPending}>
                <Mail className="h-3 w-3 mr-1" /> Email All ({attendees.length})
              </Button>
              <Button size="sm" variant="outline" onClick={() => attendees.forEach(a => a.phone && sendSms.mutate({ recipientId: a.id, recipientType: type === 'members' ? 'member' : 'lead', recipientName: `${a.firstName} ${a.lastName}`, phone: a.phone, body: `Hi ${a.firstName}! Thanks for joining us at Golf VX Drive Day!` }))} disabled={sendSms.isPending}>
                <Phone className="h-3 w-3 mr-1" /> SMS All ({attendees.filter(a => a.phone).length})
              </Button>
            </div>
          ) : <div />}
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Modal for attendees filtered by acquisition source
function SourceAttendeeModal({
  open, onClose, source, minDate, maxDate,
}: { open: boolean; onClose: () => void; source: string; minDate: string; maxDate: string }) {
  const { data: attendees, isLoading } = trpc.campaigns.getSundayClinicAttendeesBySource.useQuery(
    { source, minDate, maxDate }, { enabled: open }
  );
  const sendSms = trpc.communication.sendSMS.useMutation({
    onSuccess: (r) => r.success ? toast({ title: "SMS sent!" }) : toast({ title: "SMS failed", description: r.error ?? "Twilio not configured", variant: "destructive" }),
    onError: (e) => toast({ title: "SMS error", description: e.message, variant: "destructive" }),
  });
  const sendEmail = trpc.communication.sendEmail.useMutation({
    onSuccess: (r) => r.success ? toast({ title: "Email sent!" }) : toast({ title: "Email failed", description: r.error ?? "SendGrid not configured — add SENDGRID_API_KEY in Settings → Secrets", variant: "destructive" }),
    onError: (e) => toast({ title: "Email error", description: e.message, variant: "destructive" }),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Source: {source}
            {attendees && <Badge variant="secondary" className="ml-2">{attendees.length}</Badge>}
          </DialogTitle>
          <DialogDescription>Attendees who found Golf VX via {source}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !attendees?.length ? (
            <div className="text-center py-12 text-muted-foreground">No attendees found for this source.</div>
          ) : (
            <div className="space-y-2">
              {attendees.map((a, idx) => (
                <div key={`src-${a.id ?? idx}-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{(a.firstName?.[0] || "?").toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{a.firstName} {a.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {a.email && (
                      <button onClick={() => sendEmail.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, email: a.email, subject: `Golf VX - Follow Up`, htmlBody: `<p>Hi ${a.firstName}, thanks for visiting Golf VX!</p>` })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" title="Send email">
                        <Mail className="h-3 w-3" /><span className="hidden sm:inline truncate max-w-[140px]">{a.email}</span>
                      </button>
                    )}
                    {a.phone && (
                      <button onClick={() => sendSms.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, phone: a.phone, body: `Hi ${a.firstName}! Thanks for joining us at Golf VX Drive Day. Book your next session at playgolfvx.com!` })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" title="Send SMS">
                        <Phone className="h-3 w-3" /><span className="hidden sm:inline">{a.phone}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {attendees && attendees.length > 0 && (
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => attendees.forEach(a => a.email && sendEmail.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, email: a.email, subject: `Golf VX - Follow Up`, htmlBody: `<p>Hi ${a.firstName}, thanks for visiting Golf VX!</p>` }))} disabled={sendEmail.isPending}>
                <Mail className="h-3 w-3 mr-1" /> Email All ({attendees.length})
              </Button>
              <Button size="sm" variant="outline" onClick={() => attendees.forEach(a => a.phone && sendSms.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, phone: a.phone, body: `Hi ${a.firstName}! Thanks for joining us at Golf VX Drive Day!` }))} disabled={sendSms.isPending}>
                <Phone className="h-3 w-3 mr-1" /> SMS All ({attendees.filter(a => a.phone).length})
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}><X className="h-4 w-4 mr-1" /> Close</Button>
          </div>
        )}
        {(!attendees || attendees.length === 0) && (
          <div className="pt-3 border-t border-border flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}><X className="h-4 w-4 mr-1" /> Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Modal for attendees at a specific event date
function EventAttendeeModal({
  open, onClose, eventDate, label, minDate, maxDate,
}: { open: boolean; onClose: () => void; eventDate: string; label: string; minDate: string; maxDate: string }) {
  const { data: attendees, isLoading } = trpc.campaigns.getSundayClinicAttendeesByEvent.useQuery(
    { eventDate, minDate, maxDate }, { enabled: open }
  );
  const sendSms = trpc.communication.sendSMS.useMutation({
    onSuccess: (r) => r.success ? toast({ title: "SMS sent!" }) : toast({ title: "SMS failed", description: r.error ?? "Twilio not configured", variant: "destructive" }),
    onError: (e) => toast({ title: "SMS error", description: e.message, variant: "destructive" }),
  });
  const sendEmail = trpc.communication.sendEmail.useMutation({
    onSuccess: (r) => r.success ? toast({ title: "Email sent!" }) : toast({ title: "Email failed", description: r.error ?? "SendGrid not configured — add SENDGRID_API_KEY in Settings → Secrets", variant: "destructive" }),
    onError: (e) => toast({ title: "Email error", description: e.message, variant: "destructive" }),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Event: {label}
            {attendees && <Badge variant="secondary" className="ml-2">{attendees.length}</Badge>}
          </DialogTitle>
          <DialogDescription>All attendees at this event</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !attendees?.length ? (
            <div className="text-center py-12 text-muted-foreground">No attendees found for this event.</div>
          ) : (
            <div className="space-y-2">
              {attendees.map((a, idx) => (
                <div key={`evt-${a.id ?? idx}-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{(a.firstName?.[0] || "?").toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{a.firstName} {a.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.type} • {a.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {a.isMember && <Badge variant="default" className="text-xs">Member</Badge>}
                    {a.email && (
                      <button onClick={() => sendEmail.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, email: a.email, subject: `Golf VX - Follow Up`, htmlBody: `<p>Hi ${a.firstName}, thanks for visiting Golf VX!</p>` })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" title="Send email">
                        <Mail className="h-3 w-3" /><span className="hidden sm:inline truncate max-w-[120px]">{a.email}</span>
                      </button>
                    )}
                    {a.phone && (
                      <button onClick={() => sendSms.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, phone: a.phone, body: `Hi ${a.firstName}! Thanks for joining us at Golf VX Drive Day!` })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" title="Send SMS">
                        <Phone className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {attendees && attendees.length > 0 && (
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => attendees.forEach(a => a.email && sendEmail.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, email: a.email, subject: `Golf VX - Follow Up`, htmlBody: `<p>Hi ${a.firstName}, thanks for attending our Drive Day!</p>` }))} disabled={sendEmail.isPending}>
                <Mail className="h-3 w-3 mr-1" /> Email All ({attendees.length})
              </Button>
              <Button size="sm" variant="outline" onClick={() => attendees.forEach(a => a.phone && sendSms.mutate({ recipientId: a.id, recipientType: 'lead', recipientName: `${a.firstName} ${a.lastName}`, phone: a.phone, body: `Hi ${a.firstName}! Thanks for joining us at Golf VX Drive Day!` }))} disabled={sendSms.isPending}>
                <Phone className="h-3 w-3 mr-1" /> SMS All ({attendees.filter(a => a.phone).length})
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}><X className="h-4 w-4 mr-1" /> Close</Button>
          </div>
        )}
        {(!attendees || attendees.length === 0) && (
          <div className="pt-3 border-t border-border flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}><X className="h-4 w-4 mr-1" /> Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Event topic grouping: 2 dates per topic based on the Drive Day Clinic series schedule
const EVENT_TOPICS: Record<string, { topic: string; color: string; icon: string }> = {
  "2026-01-25": { topic: "Drive Day", color: "text-amber-600", icon: "🏌️" },
  "2026-02-01": { topic: "Drive Day", color: "text-amber-600", icon: "🏌️" },
  "2026-02-22": { topic: "Putting Clinic", color: "text-blue-600", icon: "⛳" },
  "2026-03-01": { topic: "Putting Clinic", color: "text-blue-600", icon: "⛳" },
  "2026-03-22": { topic: "Hitting Below the Hips", color: "text-green-600", icon: "🎯" },
  "2026-03-29": { topic: "Hitting Below the Hips", color: "text-green-600", icon: "🎯" },
};

const TOPIC_ORDER = ["Drive Day", "Putting Clinic", "Hitting Below the Hips"];

export default function SundayClinicDetail() {
  const [attendeeModal, setAttendeeModal] = useState<AttendeeType | null>(null);
  const [sourceModal, setSourceModal] = useState<SourceModal>(null);
  const [eventModal, setEventModal] = useState<EventModal>(null);

  const { data: metrics, isLoading } = trpc.campaigns.getSundayClinicMetrics.useQuery({
    minDate: "2026-01-25",
    maxDate: "2026-03-29",
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!metrics) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground">No data available</div>
      </DashboardLayout>
    );
  }

  // Sort events by date ascending (Jan 25 first)
  const sortedEvents = [...(metrics.events || [])].sort((a, b) => a.date.localeCompare(b.date));

  // Group events by topic
  const eventsByTopic = sortedEvents.reduce((acc, event) => {
    const topicInfo = EVENT_TOPICS[event.date];
    const topic = topicInfo?.topic || "Other";
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(event);
    return acc;
  }, {} as Record<string, typeof sortedEvents>);

  // Format date safely (avoid Invalid Date)
  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sunday Clinic</h1>
          <p className="text-muted-foreground">Public drive day events - Member retention & new visitor acquisition</p>
        </div>

        {/* New Visitor Acquisition + Source Attribution — unified card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <CardTitle>New Member Acquisition</CardTitle>
              </div>
              <Badge variant="secondary">{metrics.nonMemberAttendees} Prospects</Badge>
            </div>
            <CardDescription>New visitors by acquisition source — conversion opportunities for membership</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Top stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">New Visitors</p>
                <button
                  onClick={() => setAttendeeModal("new_visitors")}
                  className="text-2xl font-bold text-primary hover:underline cursor-pointer transition-colors block"
                  title="Click to see new visitor list"
                >{metrics.nonMemberAttendees}</button>
                <p className="text-xs text-muted-foreground mt-0.5">↑ click to view list</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold text-foreground">{metrics.nonMemberTotalBookings}</p>
                <p className="text-xs text-muted-foreground mt-0.5">across all events</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Avg Visits/Person</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.nonMemberAttendees > 0
                    ? (metrics.nonMemberTotalBookings / metrics.nonMemberAttendees).toFixed(1)
                    : '0'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">repeat engagement</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Conversion Opps</p>
                <p className="text-2xl font-bold text-amber-500">{metrics.conversionOpportunities}</p>
                <p className="text-xs text-muted-foreground mt-0.5">prospects to follow up</p>
              </div>
            </div>

            {/* Acquisition source breakdown */}
            {metrics.sourceBreakdown && Object.keys(metrics.sourceBreakdown).length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" />
                  How They Found Us
                </p>
                {Object.entries(metrics.sourceBreakdown)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([source, count]) => {
                    const percentage = ((count as number) / metrics.totalBookings) * 100;
                    const sourceGoals: Record<string, number> = {
                      'Social Media': 15,
                      'PBGA': 20,
                      'Golf VX': 10,
                      'Referral': 5,
                    };
                    const goal = sourceGoals[source] || 0;
                    const goalProgress = goal > 0 ? Math.min(((count as number) / goal) * 100, 100) : 0;

                    return (
                      <div key={source} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            <span className="font-medium text-sm text-foreground">{source}</span>
                            {goal > 0 && (
                              <span className="text-xs text-muted-foreground">Goal: {goal}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSourceModal({ source })}
                              className="font-bold text-primary hover:underline cursor-pointer transition-colors text-sm"
                              title="Click to see attendee list"
                            >{count}</button>
                            <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                            {goal > 0 && goalProgress >= 100 && (
                              <Badge variant="default" className="text-xs py-0 px-1.5 bg-green-600">✓ Goal</Badge>
                            )}
                          </div>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                💡 Follow up with <strong>{metrics.conversionOpportunities}</strong> prospects to convert them into members
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Event Breakdown — grouped by topic, sorted by date ascending (Jan 25 first) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Event Breakdown</CardTitle>
              </div>
              {(metrics as any).totalRevenue != null && (
                <Badge variant="outline" className="text-sm font-semibold text-green-600 border-green-500">
                  ${(metrics as any).totalRevenue?.toFixed(0)} total revenue
                </Badge>
              )}
            </div>
            <CardDescription>
              {metrics.totalEvents} events • {metrics.totalBookings} total bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {TOPIC_ORDER.map((topic) => {
                const topicEvents = eventsByTopic[topic];
                if (!topicEvents || topicEvents.length === 0) return null;
                const topicInfo = Object.values(EVENT_TOPICS).find(t => t.topic === topic);
                const topicTotal = topicEvents.reduce((s, e) => s + e.totalBookings, 0);
                const topicRevenue = topicEvents.reduce((s, e) => s + ((e as any).revenue || 0), 0);

                return (
                  <div key={topic}>
                    {/* Topic header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{topicInfo?.icon}</span>
                      <h3 className={`font-bold text-base ${topicInfo?.color || 'text-foreground'}`}>{topic}</h3>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">{topicTotal} total bookings</span>
                      {topicRevenue > 0 && (
                        <span className="text-xs text-green-600 font-medium">${topicRevenue.toFixed(0)} revenue</span>
                      )}
                    </div>

                    <div className="space-y-3 pl-2">
                      {topicEvents.map((event) => (
                        <div key={event.date} className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                                <Calendar className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {formatEventDate(event.date)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {event.uniqueAttendees} unique attendees
                                  {(event as any).revenue != null && (event as any).revenue > 0 && (
                                    <span className="ml-2 text-green-600 font-medium">
                                      · ${(event as any).revenue?.toFixed(0)} revenue
                                    </span>
                                  )}
                                </p>
                                {(event as any).paidAttendees != null && (
                                  <p className="text-xs text-muted-foreground">
                                    Paid: {(event as any).paidAttendees} · Members: {(event as any).memberAttendees}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <button
                                onClick={() => setEventModal({ eventDate: event.date, label: formatEventDate(event.date) })}
                                className="text-lg font-bold text-primary hover:underline cursor-pointer transition-colors block"
                                title="Click to see attendee list"
                              >{event.totalBookings}</button>
                              <p className="text-xs text-muted-foreground">bookings ↑ click</p>
                            </div>
                          </div>

                          {event.sourceBreakdown && Object.keys(event.sourceBreakdown).length > 0 && (
                            <div className="pl-14 pr-3 pb-1">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(event.sourceBreakdown)
                                  .sort(([, a], [, b]) => (b as number) - (a as number))
                                  .map(([source, count]) => (
                                    <Badge
                                      key={source}
                                      variant="outline"
                                      className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                                      onClick={() => setSourceModal({ source })}
                                      title={`Click to see ${source} attendees`}
                                    >
                                      {source}: {count}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>



        {/* Overall Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{metrics.totalEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{metrics.totalBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique Attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{metrics.uniqueAttendees}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Repeat Attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{metrics.repeatAttendees}</p>
              <p className="text-sm text-muted-foreground">{metrics.repeatRate.toFixed(1)}% repeat rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Marketing Intelligence */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Marketing Intelligence</h2>
            <p className="text-sm text-muted-foreground mt-1">Meta Ads, Instagram, and newsletter efforts for Drive Day Clinics.</p>
          </div>
          <ProgramMarketingPanel
            programName="Drive Day Clinics"
            programKeywords={["drive day", "sunday clinic", "putting clinic", "sunday's putting", "this sunday", "instagram post"]}
          />
        </div>
      </div>

      {/* Attendee List Modal */}
      {attendeeModal && (
        <AttendeeListModal
          open={true}
          onClose={() => setAttendeeModal(null)}
          type={attendeeModal}
          minDate="2026-01-25"
          maxDate="2026-03-29"
        />
      )}
      {/* Source Attendee Modal */}
      {sourceModal && (
        <SourceAttendeeModal
          open={true}
          onClose={() => setSourceModal(null)}
          source={sourceModal.source}
          minDate="2026-01-25"
          maxDate="2026-03-29"
        />
      )}
      {/* Event Attendee Modal */}
      {eventModal && (
        <EventAttendeeModal
          open={true}
          onClose={() => setEventModal(null)}
          eventDate={eventModal.eventDate}
          label={eventModal.label}
          minDate="2026-01-25"
          maxDate="2026-03-29"
        />
      )}
    </DashboardLayout>
  );
}
