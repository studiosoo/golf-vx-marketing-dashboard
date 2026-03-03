import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, MessageSquare, Users, Search, Send, Loader2,
  CheckSquare, Square, UserCheck, Phone, Copy, Sparkles, X
} from "lucide-react";

type Member = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  membershipTier?: string | null;
  membershipStatus?: string | null;
};

export default function CommunicationsHub() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeType, setComposeType] = useState<"email" | "sms">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);

  const { data: membersData, isLoading } = trpc.members.list.useQuery(
    search ? { search } : undefined
  );

  const sendEmail = trpc.communication.sendEmail.useMutation();
  const sendSMS = trpc.communication.sendSMS.useMutation();
  const generateDraft = trpc.campaigns.generateEmailDraft?.useMutation?.() ?? null;

  const members: Member[] = useMemo(() => {
    if (!membersData) return [];
    const arr = Array.isArray(membersData) ? membersData : [];
    return arr
      .filter((m: any) => m.membershipTier !== 'golf_vx_pro')
      .map((m: any) => ({
        id: m.id,
        firstName: m.name?.split(' ')[0] || '',
        lastName: m.name?.split(' ').slice(1).join(' ') || '',
        email: m.email || '',
        phone: m.phone,
        membershipTier: m.membershipTier,
        membershipStatus: m.status,
      }));
  }, [membersData]);

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    );
  }, [members, search]);

  const selectedMembers = useMemo(() =>
    filteredMembers.filter(m => selectedIds.has(m.id)),
    [filteredMembers, selectedIds]
  );

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredMembers.map(m => m.id)));
  const clearAll = () => setSelectedIds(new Set());

  const openCompose = (type: "email" | "sms") => {
    if (selectedIds.size === 0) {
      toast({ title: "No contacts selected", description: "Please select at least one contact.", variant: "destructive" });
      return;
    }
    setComposeType(type);
    setSubject("");
    setBody("");
    setComposeOpen(true);
  };

  const handleAiDraft = async () => {
    setAiDraftLoading(true);
    try {
      const { invokeLLM } = await import('@/lib/trpc').then(() => ({ invokeLLM: null }));
      // Use the generateEmailDraft tRPC endpoint
      const resp = await fetch('/api/trpc/campaigns.generateEmailDraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: {
          actionType: 'email_nurture',
          context: `Golf VX member communication. ${selectedMembers.length} recipients. Purpose: ${subject || 'general update'}`,
          audienceDescription: `${selectedMembers.length} Golf VX members`,
        }}),
      });
      if (resp.ok) {
        const data = await resp.json();
        const emails = data?.result?.data?.json?.emails;
        if (emails && emails.length > 0) {
          setSubject(emails[0].subject || '');
          setBody(emails[0].body || '');
        }
      }
    } catch {
      toast({ title: 'AI draft failed', description: 'Could not generate draft. Please write manually.', variant: 'destructive' });
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleSend = async () => {
    if (!body.trim()) {
      toast({ title: "Message required", variant: "destructive" });
      return;
    }
    if (composeType === "email" && !subject.trim()) {
      toast({ title: "Subject required for email", variant: "destructive" });
      return;
    }
    setIsSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const member of selectedMembers) {
      try {
        if (composeType === "email" && member.email) {
          await sendEmail.mutateAsync({
            email: member.email,
            subject,
            htmlBody: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
            textBody: body,
            recipientName: `${member.firstName} ${member.lastName}`,
            campaignName: "Communications Hub",
            recipientId: member.id,
            recipientType: "member" as const,
          });
          successCount++;
        } else if (composeType === "sms" && member.phone) {
          await sendSMS.mutateAsync({
            phone: member.phone,
            body,
            recipientName: `${member.firstName} ${member.lastName}`,
            campaignName: "Communications Hub",
            recipientId: member.id,
            recipientType: "member" as const,
          });
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsSending(false);
    setComposeOpen(false);
    toast({
      title: `Sent to ${successCount} contacts`,
      description: failCount > 0 ? `${failCount} failed (missing contact info)` : "All messages delivered.",
    });
  };

  const getTierBadge = (tier?: string | null) => {
    if (!tier) return null;
    const map: Record<string, string> = {
      all_access: "All-Access",
      swing_saver: "Swing Saver",
      golf_vx_pro: "Pro",
    };
    return <Badge variant="outline" className="text-xs">{map[tier] || tier}</Badge>;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Communications Hub</h1>
            <p className="text-muted-foreground mt-1">
              Send emails and SMS to your members and contacts
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Badge className="bg-[#ffcb00] text-black font-semibold px-3 py-1">
                {selectedIds.size} selected
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={() => openCompose("sms")}
              disabled={selectedIds.size === 0}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> SMS
            </Button>
            <Button
              onClick={() => openCompose("email")}
              disabled={selectedIds.size === 0}
              className="bg-[#ffcb00] text-black hover:bg-[#e6b800]"
            >
              <Mail className="h-4 w-4 mr-2" /> Email
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-[#ffcb00]" />
                <div>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{members.filter(m => m.email).length}</p>
                  <p className="text-sm text-muted-foreground">With Email</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Phone className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{members.filter(m => m.phone).length}</p>
                  <p className="text-sm text-muted-foreground">With Phone</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Member Contacts</CardTitle>
                <CardDescription>Select contacts to send email or SMS</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  <CheckSquare className="h-4 w-4 mr-1" /> Select All
                </Button>
                {selectedIds.size > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#ffcb00]" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No contacts found</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                {filteredMembers.map(member => (
                  <div
                    key={member.id}
                    onClick={() => toggleSelect(member.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedIds.has(member.id)
                        ? 'bg-[#ffcb00]/10 border border-[#ffcb00]/30'
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(member.id)}
                      onCheckedChange={() => toggleSelect(member.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {member.firstName} {member.lastName}
                        </span>
                        {getTierBadge(member.membershipTier)}
                        {member.membershipStatus === 'active' && (
                          <UserCheck className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {member.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {member.email}
                          </span>
                        )}
                        {member.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {composeType === "email" ? (
                <Mail className="h-5 w-5 text-[#ffcb00]" />
              ) : (
                <MessageSquare className="h-5 w-5 text-green-500" />
              )}
              {composeType === "email" ? "Compose Email" : "Compose SMS"}
              <Badge className="ml-2 bg-[#ffcb00]/20 text-[#b8960a] border-[#ffcb00]/30">
                {selectedMembers.length} recipients
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Recipients preview */}
            <div className="rounded-lg border p-3 bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recipients</p>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {selectedMembers.slice(0, 20).map(m => (
                  <Badge key={m.id} variant="secondary" className="text-xs">
                    {m.firstName} {m.lastName}
                  </Badge>
                ))}
                {selectedMembers.length > 20 && (
                  <Badge variant="outline" className="text-xs">+{selectedMembers.length - 20} more</Badge>
                )}
              </div>
            </div>

            {composeType === "email" && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body">Message</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAiDraft}
                  disabled={aiDraftLoading}
                  className="text-xs h-7 text-[#ffcb00] hover:text-[#e6b800]"
                >
                  {aiDraftLoading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  AI Draft
                </Button>
              </div>
              <Textarea
                id="body"
                placeholder={composeType === "email" ? "Write your email..." : "Write your SMS (160 char limit per segment)..."}
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={composeType === "sms" ? 4 : 8}
              />
              {composeType === "sms" && (
                <p className="text-xs text-muted-foreground text-right">{body.length} chars</p>
              )}
            </div>

            {/* Note about SMS */}
            {composeType === "sms" && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-600">
                <strong>Note:</strong> SMS sending requires Twilio credentials to be configured in Settings → Secrets. Once set up, messages will be delivered immediately.
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSend}
                disabled={isSending || !body.trim() || (composeType === "email" && !subject.trim())}
                className={composeType === "email" ? "bg-[#ffcb00] text-black hover:bg-[#e6b800]" : ""}
              >
                {isSending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Send to {selectedMembers.length} contacts</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
