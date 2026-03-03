import { useState } from "react";
import ProgramMarketingPanel from "@/components/ProgramMarketingPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, UserPlus, TrendingUp, Calendar, Share2, Mail, Phone, X } from "lucide-react";

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
  const sendSms = trpc.communication.sendSMS.useMutation();
  const sendEmail = trpc.communication.sendEmail.useMutation();

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
              {attendees.map((a) => (
                <div key={`${a.email}-${a.date}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
  const sendSms = trpc.communication.sendSMS.useMutation();
  const sendEmail = trpc.communication.sendEmail.useMutation();
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
              {attendees.map((a) => (
                <div key={`${a.email}-${a.date}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
  const sendSms = trpc.communication.sendSMS.useMutation();
  const sendEmail = trpc.communication.sendEmail.useMutation();
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
              {attendees.map((a) => (
                <div key={`${a.email}-${a.date}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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

export default function SundayClinicDetail() {
  const [attendeeModal, setAttendeeModal] = useState<AttendeeType | null>(null);
  const [sourceModal, setSourceModal] = useState<SourceModal>(null);
  const [eventModal, setEventModal] = useState<EventModal>(null);

  const { data: metrics, isLoading } = trpc.campaigns.getSundayClinicMetrics.useQuery({
    minDate: "2026-01-01",
    maxDate: "2026-03-31",
  }, { staleTime: 0 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-muted-foreground">No data available</div>
    );
  }

  const memberGoalProgress = (metrics.memberAttendees / metrics.totalMembers) * 100;
  const targetMemberAttendance = 50;
  const memberPerformance = (memberGoalProgress / targetMemberAttendance) * 100;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sunday Clinic — Drive Day Series</h1>
          <p className="text-muted-foreground">6-session public clinic series (Jan 25 – Mar 29, 2026) · Member retention & new visitor acquisition</p>
          {/* Topic Series Overview */}
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span className="text-xs font-medium text-blue-700">Sessions 1–2: Driving to the Ball</span>
              <span className="text-xs text-blue-500 ml-1">Jan 25 · Feb 1</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="text-xs font-medium text-green-700">Sessions 3–4: Putting — Score Low</span>
              <span className="text-xs text-green-500 ml-1">Feb 22 · Mar 1</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              <span className="text-xs font-medium text-orange-700">Sessions 5–6: Short Game — Swing Below the Hips</span>
              <span className="text-xs text-orange-500 ml-1">Mar 22 · Mar 29</span>
            </div>
          </div>
        </div>

        {/* Dual Goal Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Member Retention Goal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Member Retention</CardTitle>
                </div>
                <Badge variant={memberPerformance >= 80 ? "default" : "secondary"}>
                  {Math.round(memberPerformance)}% Performance
                </Badge>
              </div>
              <CardDescription>Track member engagement through clinic attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.totalMembers}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Members Attended</p>
                  <button
                    onClick={() => setAttendeeModal("members")}
                    className="text-2xl font-bold text-primary hover:underline cursor-pointer transition-colors"
                    title="Click to see member list"
                  >
                    {metrics.memberAttendees}
                  </button>
                  <p className="text-xs text-muted-foreground mt-0.5">↑ click to view list</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  <p className="text-lg font-semibold text-foreground">{metrics.memberAttendanceRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Repeat Rate</p>
                  <p className="text-lg font-semibold text-foreground">{metrics.memberRepeatRate.toFixed(1)}%</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Member Engagement Goal</span>
                  <span>{memberGoalProgress.toFixed(0)}%</span>
                </div>
                <Progress value={memberGoalProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Non-Member Acquisition Goal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <CardTitle>New Visitor Acquisition</CardTitle>
                </div>
                <Badge variant="secondary">
                  {metrics.nonMemberAttendees} Prospects
                </Badge>
              </div>
              <CardDescription>Convert clinic attendees to paying members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">New Visitors</p>
                  <button
                    onClick={() => setAttendeeModal("new_visitors")}
                    className="text-2xl font-bold text-primary hover:underline cursor-pointer transition-colors"
                    title="Click to see new visitor list"
                  >
                    {metrics.nonMemberAttendees}
                  </button>
                  <p className="text-xs text-muted-foreground mt-0.5">↑ click to view list</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                  <p className="text-2xl font-bold text-foreground">{metrics.nonMemberTotalBookings}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conversion Opportunities</p>
                  <p className="text-lg font-semibold text-foreground">{metrics.conversionOpportunities}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Visits/Person</p>
                  <p className="text-lg font-semibold text-foreground">
                    {metrics.nonMemberAttendees > 0
                      ? (metrics.nonMemberTotalBookings / metrics.nonMemberAttendees).toFixed(1)
                      : '0'}
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 Follow up with {metrics.conversionOpportunities} prospects to convert them into members
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acquisition Source Attribution */}
        {metrics.sourceBreakdown && Object.keys(metrics.sourceBreakdown).length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                <CardTitle>Acquisition Sources</CardTitle>
              </div>
              <CardDescription>
                How attendees found out about Sunday Clinic events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                      <div key={source} className="space-y-2 p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <span className="font-medium text-foreground">{source}</span>
                          </div>
                          <div className="text-right">
                            <button
                              onClick={() => setSourceModal({ source })}
                              className="font-bold text-primary hover:underline cursor-pointer transition-colors"
                              title="Click to see attendee list"
                            >{count}</button>
                            <span className="text-sm text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        {goal > 0 && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                            <span>Goal: {goal} attendees</span>
                            <span className={goalProgress >= 100 ? "text-green-600 font-semibold" : ""}>
                              {goalProgress.toFixed(0)}% of goal
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Event Breakdown</CardTitle>
            </div>
            <CardDescription>
              {metrics.totalEvents} events • {metrics.totalBookings} total bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 6-Session Schedule — 2 sessions per topic */}
            <div className="mb-4 p-3 bg-[#FFFBEA] border border-[#F5C72C]/30 rounded-lg">
              <p className="text-xs font-semibold text-[#B8860B] mb-2">6-Session Schedule</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-blue-50 rounded border border-blue-100">
                  <div className="font-semibold text-blue-700 mb-1">Driving to the Ball</div>
                  <div className="text-blue-500">Jan 25 &amp; Feb 1</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded border border-green-100">
                  <div className="font-semibold text-green-700 mb-1">Putting — Score Low</div>
                  <div className="text-green-500">Feb 22 &amp; Mar 1</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded border border-orange-100">
                  <div className="font-semibold text-orange-700 mb-1">Short Game — Below the Hips</div>
                  <div className="text-orange-500">Mar 22 &amp; Mar 29</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {metrics.events.map((event, idx) => {
                const topicColors: Record<string, { bg: string; text: string; dot: string }> = {
                  drive_day: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
                  putting: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
                  short_game: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
                };
                const tc = topicColors[(event as any).topic || 'drive_day'];
                return (
                <div key={event.date} className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg shrink-0">
                        <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-foreground">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tc.bg} ${tc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                            {(event as any).topicLabel || 'Driving to the Ball'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.uniqueAttendees} unique attendees
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => setEventModal({ eventDate: event.date, label: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })}
                        className="text-lg font-bold text-primary hover:underline cursor-pointer transition-colors block"
                        title="Click to see attendee list"
                      >{event.totalBookings}</button>
                      <p className="text-xs text-muted-foreground">bookings ↑ click</p>
                    </div>
                  </div>

                  {event.sourceBreakdown && Object.keys(event.sourceBreakdown).length > 0 && (
                    <div className="pl-16 pr-3 pb-2">
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
    </>
  );
}