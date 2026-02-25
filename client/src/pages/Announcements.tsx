import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, MessageSquare, Mail, Users, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-400",
  delivered: "bg-green-500/15 text-green-400",
  failed: "bg-red-500/15 text-red-400",
  bounced: "bg-red-500/15 text-red-400",
  opened: "bg-purple-500/15 text-purple-400",
  clicked: "bg-primary/15 text-primary",
};

export default function Announcements() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [sending, setSending] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const { data: history, isLoading: histLoading } = trpc.communication.getHistory.useQuery({ page: historyPage, limit: 20 });
  const { data: stats } = trpc.communication.getStats.useQuery({});

  const { data: allMembers } = trpc.members.list.useQuery({});

  const bulkSMS = trpc.communication.sendBulkSMS.useMutation({
    onSuccess: (r: any) => {
      toast({ title: `SMS queued for ${r.results?.length ?? 0} members` });
      setBody(""); setCampaignName("");
      utils.communication.getHistory.invalidate();
      utils.communication.getStats.invalidate();
      setSending(false);
    },
    onError: (e: any) => { toast({ title: "Send failed", description: e.message, variant: "destructive" }); setSending(false); },
  });
  const bulkEmail = trpc.communication.sendBulkEmail.useMutation({
    onSuccess: (r: any) => {
      toast({ title: `Email queued for ${r.results?.length ?? 0} members` });
      setSubject(""); setBody(""); setCampaignName("");
      utils.communication.getHistory.invalidate();
      utils.communication.getStats.invalidate();
      setSending(false);
    },
    onError: (e: any) => { toast({ title: "Send failed", description: e.message, variant: "destructive" }); setSending(false); },
  });

  const handleSend = () => {
    if (!body.trim()) { toast({ title: "Body required", variant: "destructive" }); return; }
    if (!allMembers?.length) { toast({ title: "No members found", variant: "destructive" }); return; }
    setSending(true);
    if (channel === "sms") {
      const smsRecipients = allMembers
        .filter((m: any) => m.phone && m.status === "active")
        .map((m: any) => ({ id: m.id, type: "member" as const, phone: m.phone!, name: m.name }));
      if (!smsRecipients.length) { toast({ title: "No active members with phone numbers", variant: "destructive" }); setSending(false); return; }
      bulkSMS.mutate({ recipients: smsRecipients, bodyTemplate: body, campaignName: campaignName || undefined });
    } else {
      if (!subject.trim()) { toast({ title: "Subject required for email", variant: "destructive" }); setSending(false); return; }
      const emailRecipients = allMembers
        .filter((m: any) => m.email && m.status === "active")
        .map((m: any) => ({ id: m.id, type: "member" as const, email: m.email, name: m.name }));
      if (!emailRecipients.length) { toast({ title: "No active members with email", variant: "destructive" }); setSending(false); return; }
      bulkEmail.mutate({ recipients: emailRecipients, subject, htmlBodyTemplate: body, campaignName: campaignName || undefined });
    }
  };

  const smsSent = (stats as any)?.sms?.sent ?? 0;
  const emailSent = (stats as any)?.email?.sent ?? 0;
  const totalSent = Number(smsSent) + Number(emailSent);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Announcements</h1>
            <p className="text-muted-foreground mt-1 text-sm">Broadcast SMS or email to all members</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
            onClick={() => { utils.communication.getHistory.invalidate(); utils.communication.getStats.invalidate(); }}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Sent", value: totalSent, icon: Send, color: "text-primary" },
            { label: "SMS", value: smsSent, icon: MessageSquare, color: "text-blue-400" },
            { label: "Email", value: emailSent, icon: Mail, color: "text-green-400" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{Number(s.value).toLocaleString()}</p>
                  </div>
                  <s.icon className={`h-5 w-5 ${s.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Send Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant={channel === "sms" ? "default" : "outline"} className="h-8 text-xs gap-1.5" onClick={() => setChannel("sms")}>
                <MessageSquare className="h-3.5 w-3.5" /> SMS
              </Button>
              <Button size="sm" variant={channel === "email" ? "default" : "outline"} className="h-8 text-xs gap-1.5" onClick={() => setChannel("email")}>
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
            </div>
            <Input placeholder="Campaign name (optional)" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="h-8 text-sm" />
            {channel === "email" && (
              <Input placeholder="Subject line" value={subject} onChange={(e) => setSubject(e.target.value)} className="h-8 text-sm" />
            )}
            <Textarea
              placeholder={channel === "sms" ? "SMS message (160 chars recommended)" : "Email body (HTML supported)"}
              value={body} onChange={(e) => setBody(e.target.value)}
              className="text-sm min-h-[100px] resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Sends to all active members</span>
              </div>
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={handleSend} disabled={sending || !body.trim()}>
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Message History</CardTitle>
            {history && history.totalPages > 1 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>‹</Button>
                <span>{historyPage} / {history.totalPages}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={historyPage >= history.totalPages} onClick={() => setHistoryPage(p => p + 1)}>›</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {histLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : !history?.data.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No messages sent yet</p>
            ) : (
              <div className="divide-y divide-border/50">
                {history.data.map((log: any) => (
                  <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                    <div className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${log.channel === "sms" ? "bg-blue-500/10" : "bg-green-500/10"}`}>
                      {log.channel === "sms" ? <MessageSquare className="h-3.5 w-3.5 text-blue-400" /> : <Mail className="h-3.5 w-3.5 text-green-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">{log.recipientName ?? log.recipientEmail ?? log.recipientPhone ?? "Unknown"}</span>
                        {log.campaignName && <Badge variant="outline" className="text-xs">{log.campaignName}</Badge>}
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[log.status] ?? ""}`}>{log.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.subject ?? log.body?.slice(0, 80)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}</p>
                    </div>
                    <div className="shrink-0">
                      {log.status === "delivered" || log.status === "sent" ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : log.status === "failed" ? <XCircle className="h-4 w-4 text-red-400" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
