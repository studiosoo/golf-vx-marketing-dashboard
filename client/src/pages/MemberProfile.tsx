import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Award,
  MessageSquare,
  CreditCard,
  BookOpen,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

export default function MemberProfile() {
  const { id } = useParams();
  const memberId = parseInt(id || "0");

  const { data: member, isLoading } = trpc.members.getById.useQuery({ id: memberId });
  const { data: appointments, isLoading: appointmentsLoading } = trpc.conversion.getMemberAppointments.useQuery({ memberId });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center text-muted-foreground">Loading member...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Member Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The member you're looking for doesn't exist.
          </p>
          <Link href="/members">
            <Button className="mt-4">Back to Members</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      inactive: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      trial: "Trial",
      monthly: "Monthly",
      annual: "Annual",
      corporate: "Corporate",
      none: "None",
      all_access_aces: "All Access Aces",
      swing_savers: "Swing Savers",
      golf_vx_pro: "Golf VX Pro",
    };
    return labels[tier] || tier;
  };

  return (
    <div className="container py-8">
      <Link href="/members">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Members
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Member Info */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{member.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {getStatusBadge(member.status)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {member.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {format(new Date(member.joinDate), "MMM d, yyyy")}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Membership</span>
                  <span className="font-medium">{getTierLabel(member.membershipTier)}</span>
                </div>
                {member.renewalDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Renewal</span>
                    <span className="font-medium">
                      {format(new Date(member.renewalDate), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Member Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Lifetime Value</span>
                </div>
                <span className="font-bold text-lg">
                  ${parseFloat(member.lifetimeValue).toLocaleString()}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Visits</span>
                </div>
                <span className="font-bold text-lg">{member.totalVisits}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Lessons</span>
                </div>
                <span className="font-bold text-lg">{member.totalLessons}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity & Integrations */}
        <div className="md:col-span-2 space-y-6">
          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>Connected platforms and sync status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Boomerangme</div>
                      <div className="text-sm text-muted-foreground">
                        {member.loyaltyPoints} points
                      </div>
                    </div>
                  </div>
                  <Badge variant={member.loyaltyCardStatus === "active" ? "default" : "outline"}>
                    {member.loyaltyCardStatus}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Email Subscription</div>
                      <div className="text-sm text-muted-foreground">
                        {member.emailSubscribed ? (
                          <span>Subscribed • Score: {member.emailEngagementScore}</span>
                        ) : (
                          <span>Not subscribed</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={member.emailSubscribed ? "default" : "outline"}>
                    {member.emailSubscribed ? "subscribed" : "unsubscribed"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Toast POS</div>
                      <div className="text-sm text-muted-foreground">
                        ${parseFloat(member.totalPurchases).toLocaleString()} spent
                      </div>
                    </div>
                  </div>
                  <Badge variant={member.toastCustomerId ? "default" : "outline"}>
                    {member.toastCustomerId ? "connected" : "not connected"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Acuity</div>
                      <div className="text-sm text-muted-foreground">
                        {member.totalLessons} lessons
                      </div>
                    </div>
                  </div>
                  <Badge variant={member.acuityClientId ? "default" : "outline"}>
                    {member.acuityClientId ? "connected" : "not connected"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment History */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
              <CardDescription>Detailed booking history from Acuity Scheduler</CardDescription>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading appointments...</div>
              ) : !appointments || appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No appointments recorded
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt: any) => (
                    <div key={apt.id} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{apt.appointmentType}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(apt.appointmentDate), "MMM d, yyyy 'at' h:mm a")}
                            </div>
                            {apt.category && (
                              <Badge variant="outline" className="mt-1">{apt.category}</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold">${parseFloat(apt.price).toFixed(2)}</div>
                            {apt.paid && (
                              <Badge variant="default" className="mt-1">Paid</Badge>
                            )}
                            {apt.canceled && (
                              <Badge variant="destructive" className="mt-1">Canceled</Badge>
                            )}
                            {apt.completed && !apt.canceled && (
                              <Badge variant="secondary" className="mt-1">Completed</Badge>
                            )}
                          </div>
                        </div>
                        {apt.notes && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {apt.notes}
                          </div>
                        )}
                        {apt.location && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Location: {apt.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent member activity and interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {member.lastVisitDate && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="font-medium">Last Visit</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(member.lastVisitDate), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                )}

                {member.lastPurchaseDate && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div className="flex-1">
                      <div className="font-medium">Last Purchase</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(member.lastPurchaseDate), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                )}

                {member.lastEmailOpen && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">Email Opened</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(member.lastEmailOpen), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                )}

                {member.lastLessonDate && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-purple-500" />
                    <div className="flex-1">
                      <div className="font-medium">Last Lesson</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(member.lastLessonDate), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                )}

                {!member.lastVisitDate &&
                  !member.lastPurchaseDate &&
                  !member.lastEmailOpen &&
                  !member.lastLessonDate && (
                    <div className="text-center py-8 text-muted-foreground">
                      No activity recorded yet
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {member.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{member.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
